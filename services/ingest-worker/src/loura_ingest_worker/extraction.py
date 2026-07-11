"""Validation and deterministic resolution for AI extraction proposals."""

from __future__ import annotations

import hashlib
import re
import unicodedata
from collections.abc import Iterable, Sequence
from dataclasses import dataclass
from uuid import UUID

from pydantic import ValidationError

from loura_ingest_worker.ai_prompts import build_extraction_prompt
from loura_ingest_worker.ai_provider import StructuredAIProvider
from loura_ingest_worker.ai_schemas import AtlasExtractionOutput, SourceSummaryOutput
from loura_ingest_worker.models import SourceSegment


class ExtractionValidationError(ValueError):
    """Model output cannot become a reviewable proposal."""


_INJECTION_PATTERNS = (
    re.compile(r"\bignore\s+(?:all\s+)?(?:previous|prior|above)\s+instructions?\b", re.I),
    re.compile(r"\bdisregard\s+(?:the\s+)?instructions?\b", re.I),
    re.compile(r"\b(?:system|developer)\s+message\s*:", re.I),
    re.compile(r"\byou\s+are\s+now\s+(?:an?|the)\b", re.I),
)


def detect_prompt_injection(segments: Iterable[SourceSegment]) -> bool:
    """Return whether untrusted source text contains instruction-like language."""

    return any(
        pattern.search(segment.text) is not None
        for segment in segments
        for pattern in _INJECTION_PATTERNS
    )


def validate_evidence_segment_ids(
    segment_ids: Iterable[str], available_segment_ids: set[str]
) -> tuple[str, ...]:
    ids = tuple(dict.fromkeys(segment_ids))
    if not ids:
        raise ExtractionValidationError("proposal item requires evidence segment IDs")
    unknown = sorted(set(ids) - available_segment_ids)
    if unknown:
        raise ExtractionValidationError(f"unknown evidence segment ID(s): {', '.join(unknown)}")
    return ids


def validate_extraction(
    output: AtlasExtractionOutput,
    *,
    available_segment_ids: set[str],
    allowed_relation_type_keys: set[str],
    existing_concept_ids: set[str] | None = None,
) -> AtlasExtractionOutput:
    """Apply invariants that a schema alone cannot express."""

    if output.schema_version != "atlas-extract-v1":
        raise ExtractionValidationError(f"unsupported extraction schema: {output.schema_version}")
    # ``None`` means the caller did not load the existing catalogue; structural
    # checks still run, while ID membership validation is deferred to the
    # service that has the workspace-scoped catalogue.
    known_concepts = existing_concept_ids
    candidate_keys = {concept.candidate_key for concept in output.concepts}
    if len(candidate_keys) != len(output.concepts):
        raise ExtractionValidationError("duplicate candidate key")
    for concept in output.concepts:
        validate_evidence_segment_ids(concept.evidence_segment_ids, available_segment_ids)
        for match in concept.existing_concept_candidates:
            if known_concepts is not None and match.concept_id not in known_concepts:
                raise ExtractionValidationError(f"unknown existing concept ID: {match.concept_id}")
    for relation in output.relations:
        if relation.relation_type_key not in allowed_relation_type_keys:
            raise ExtractionValidationError(f"unknown relation type: {relation.relation_type_key}")
        validate_evidence_segment_ids(relation.evidence_segment_ids, available_segment_ids)
        for reference in (relation.source_ref, relation.target_ref):
            if (
                reference.concept_id is not None
                and known_concepts is not None
                and reference.concept_id not in known_concepts
            ):
                raise ExtractionValidationError(
                    f"unknown existing concept ID: {reference.concept_id}"
                )
            if (
                reference.candidate_key is not None
                and reference.candidate_key not in candidate_keys
            ):
                raise ExtractionValidationError(
                    f"unknown candidate key: {reference.candidate_key}"
                )

    def validate_ref(reference: object) -> None:
        # ConceptRef and ClaimConceptRef intentionally share these attributes;
        # keeping this check local avoids allowing arbitrary model output fields.
        concept_id = getattr(reference, "concept_id", None)
        candidate_key = getattr(reference, "candidate_key", None)
        if (
            concept_id is not None
            and known_concepts is not None
            and concept_id not in known_concepts
        ):
            raise ExtractionValidationError(f"unknown existing concept ID: {concept_id}")
        if candidate_key is not None and candidate_key not in candidate_keys:
            raise ExtractionValidationError(f"unknown candidate key: {candidate_key}")

    for claim in output.claims:
        for reference in claim.concept_refs:
            validate_ref(reference)
        validate_evidence_segment_ids(
            (item.segment_id for item in claim.evidence), available_segment_ids
        )
    for application in output.applications:
        for reference in application.concept_refs:
            validate_ref(reference)
        validate_evidence_segment_ids(application.evidence_segment_ids, available_segment_ids)
    return output


def extract_candidates(
    provider: StructuredAIProvider,
    segments: Sequence[SourceSegment],
    *,
    existing_concepts: Iterable[tuple[str, str, tuple[str, ...]]] = (),
    relation_type_keys: Iterable[str] = (),
    existing_concept_ids: set[str] | None = None,
) -> AtlasExtractionOutput:
    available_ids = {
        identifier
        for segment in segments
        for identifier in (segment.stable_key, str(segment.id) if segment.id else None)
        if identifier is not None
    }
    relation_keys = set(relation_type_keys)
    prompt = build_extraction_prompt(
        segments,
        existing_concepts=existing_concepts,
        relation_type_keys=relation_keys,
    )
    try:
        raw_output = provider.generate(AtlasExtractionOutput, prompt=prompt)
        output = (
            raw_output
            if isinstance(raw_output, AtlasExtractionOutput)
            else AtlasExtractionOutput.model_validate(raw_output)
        )
    except (ValidationError, ValueError) as error:
        raise ExtractionValidationError(
            "model output failed extraction schema validation"
        ) from error
    validated = validate_extraction(
        output,
        available_segment_ids=available_ids,
        allowed_relation_type_keys=relation_keys,
        existing_concept_ids=existing_concept_ids,
    )
    if detect_prompt_injection(segments) and not any(
        "prompt injection" in warning.casefold() for warning in validated.warnings
    ):
        validated = validated.model_copy(
            update={
                "warnings": (
                    *validated.warnings,
                    "Prompt injection-like text detected in source data.",
                ),
            }
        )
    return validated


def generate_source_summary(
    provider: StructuredAIProvider, segments: Sequence[SourceSegment]
) -> SourceSummaryOutput:
    prompt = build_extraction_prompt(segments, relation_type_keys=())
    try:
        raw_summary = provider.generate(SourceSummaryOutput, prompt=prompt)
        summary = (
            raw_summary
            if isinstance(raw_summary, SourceSummaryOutput)
            else SourceSummaryOutput.model_validate(raw_summary)
        )
    except (ValidationError, ValueError) as error:
        raise ExtractionValidationError(
            "model output failed source summary schema validation"
        ) from error
    validate_evidence_segment_ids(
        summary.evidence_segment_ids,
        {
            identifier
            for segment in segments
            for identifier in (segment.stable_key, str(segment.id) if segment.id else None)
            if identifier is not None
        },
    ) if summary.evidence_segment_ids else None
    return summary


def normalize_concept_name(value: str) -> str:
    normalized = "".join(
        char
        for char in unicodedata.normalize("NFKD", value).casefold()
        if unicodedata.category(char) != "Mn"
    )
    normalized = re.sub(r"[^\w\s]", " ", normalized, flags=re.UNICODE)
    return " ".join(normalized.split())


@dataclass(frozen=True)
class DeterministicResolution:
    candidate_key: str
    action: str
    existing_concept_id: str | None
    reason: str


def resolve_candidates_deterministically(
    output: AtlasExtractionOutput,
    existing_concepts: Iterable[tuple[str, str, tuple[str, ...]]],
) -> tuple[DeterministicResolution, ...]:
    """Resolve exact canonical/alias matches only; ambiguous matches stay review-only."""

    index: dict[str, list[str]] = {}
    for concept_id, name, aliases in existing_concepts:
        for label in (name, *aliases):
            index.setdefault(normalize_concept_name(label), []).append(concept_id)
    decisions: list[DeterministicResolution] = []
    for candidate in output.concepts:
        matches: set[str] = set()
        for label in (candidate.canonical_name, *candidate.aliases):
            matches.update(index.get(normalize_concept_name(label), []))
        if len(matches) == 1:
            concept_id = next(iter(matches))
            decisions.append(
                DeterministicResolution(
                    candidate.candidate_key,
                    "match_existing",
                    concept_id,
                    "exact canonical or alias match",
                )
            )
        elif len(matches) > 1:
            decisions.append(
                DeterministicResolution(
                    candidate.candidate_key,
                    "needs_human_review",
                    None,
                    "ambiguous exact alias match",
                )
            )
        else:
            decisions.append(
                DeterministicResolution(
                    candidate.candidate_key,
                    "create_new",
                    None,
                    "no exact canonical or alias match",
                )
            )
    return tuple(decisions)


def extraction_run_key(
    workspace_id: UUID | str,
    source_version_id: UUID | str,
    *,
    schema_version: str = "atlas-extract-v1",
    prompt_version: str = "atlas-extract-prompt-v1",
) -> str:
    raw = ":".join((str(workspace_id), str(source_version_id), schema_version, prompt_version))
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()
