from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from loura_ingest_worker.ai_schemas import AtlasExtractionOutput
from loura_ingest_worker.extraction import DeterministicResolution


@dataclass(frozen=True)
class ProposalItemDraft:
    """A persistence-neutral proposal item; it cannot mutate canonical records."""

    item_type: str
    proposed_payload: dict[str, Any]
    evidence_segment_ids: tuple[str, ...]
    confidence: float
    rationale: str
    target_type: str | None = None
    target_id: str | None = None


def build_proposal_items(
    output: AtlasExtractionOutput,
    resolutions: tuple[DeterministicResolution, ...] = (),
) -> tuple[ProposalItemDraft, ...]:
    resolution_by_key = {item.candidate_key: item for item in resolutions}
    drafts: list[ProposalItemDraft] = []
    for concept in output.concepts:
        resolution = resolution_by_key.get(concept.candidate_key)
        # Exact matches are never auto-merged. They become citation proposals;
        # create-new candidates remain structural proposals for owner review.
        if resolution and resolution.action == "match_existing" and resolution.existing_concept_id:
            drafts.append(
                ProposalItemDraft(
                    item_type="add_citation",
                    target_type="concept",
                    target_id=resolution.existing_concept_id,
                    proposed_payload={
                        "candidateKey": concept.candidate_key,
                        "canonicalName": concept.canonical_name,
                        "conciseDefinition": concept.concise_definition,
                    },
                    evidence_segment_ids=concept.evidence_segment_ids,
                    confidence=concept.confidence,
                    rationale="Exact canonical or alias match; citation requires human review.",
                )
            )
            continue
        drafts.append(
            ProposalItemDraft(
                item_type="create_concept",
                proposed_payload={
                    "canonicalName": concept.canonical_name,
                    "aliases": list(concept.aliases),
                    "conceptKind": concept.concept_kind,
                    "conciseDefinition": concept.concise_definition,
                    "proposedDomainSlug": concept.proposed_domain_slug,
                    "candidateKey": concept.candidate_key,
                },
                evidence_segment_ids=concept.evidence_segment_ids,
                confidence=concept.confidence,
                rationale="Candidate extracted from a completed source version.",
            )
        )
    for relation in output.relations:
        drafts.append(
            ProposalItemDraft(
                item_type="add_relation",
                proposed_payload={
                    "sourceRef": relation.source_ref.model_dump(by_alias=True, exclude_none=True),
                    "relationTypeKey": relation.relation_type_key,
                    "targetRef": relation.target_ref.model_dump(by_alias=True, exclude_none=True),
                    "qualification": relation.qualification,
                },
                evidence_segment_ids=relation.evidence_segment_ids,
                confidence=relation.confidence,
                rationale=(
                    "Typed relation candidate; endpoint and grammar checks remain "
                    "required at review."
                ),
            )
        )
    for claim in output.claims:
        drafts.append(
            ProposalItemDraft(
                item_type="add_claim",
                proposed_payload=claim.model_dump(by_alias=True, exclude_none=True),
                evidence_segment_ids=tuple(item.segment_id for item in claim.evidence),
                confidence=claim.confidence,
                rationale="Claim candidate retained with source stance and evidence.",
            )
        )
    for application in output.applications:
        drafts.append(
            ProposalItemDraft(
                item_type="add_application",
                proposed_payload=application.model_dump(by_alias=True, exclude_none=True),
                evidence_segment_ids=application.evidence_segment_ids,
                confidence=application.confidence,
                rationale="Application implication is advisory and requires human review.",
            )
        )
    return tuple(drafts)
