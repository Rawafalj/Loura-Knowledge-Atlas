"""Versioned, review-only schemas for Milestone 6 AI work.

These models intentionally describe *proposals*.  They contain no persistence
handles and therefore cannot be used as a direct canonical write command.
Source segment IDs are validated by :mod:`extraction` against the retrieved
source version before a proposal is persisted.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

EXTRACTION_SCHEMA_VERSION = "atlas-extract-v1"
PROMPT_VERSION = "atlas-extract-prompt-v1"


class _Schema(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        populate_by_name=True,
        str_strip_whitespace=True,
    )


class SourceSummaryOutput(_Schema):
    abstract: str = Field(min_length=1, max_length=12_000)
    central_questions: tuple[str, ...] = Field(default=(), alias="centralQuestions")
    key_topics: tuple[str, ...] = Field(default=(), alias="keyTopics")
    key_contributions: tuple[str, ...] = Field(default=(), alias="keyContributions")
    limitations: tuple[str, ...] = ()
    intended_audience: str | None = Field(default=None, alias="intendedAudience")
    recommended_domain_slugs: tuple[str, ...] = Field(default=(), alias="recommendedDomainSlugs")
    evidence_segment_ids: tuple[str, ...] = Field(default=(), alias="evidenceSegmentIds")


class DocumentAssessment(_Schema):
    relevance_to_atlas: Literal["high", "medium", "low"] = Field(alias="relevanceToAtlas")
    reason: str = Field(min_length=1, max_length=4_000)
    source_limitations: tuple[str, ...] = Field(default=(), alias="sourceLimitations")


class ExistingConceptCandidate(_Schema):
    concept_id: str = Field(min_length=1, alias="conceptId")
    score: float = Field(ge=0, le=1)
    relation: Literal["same", "broader", "narrower", "related", "uncertain"]


ConceptKind = Literal[
    "concept",
    "theory",
    "mechanism",
    "method",
    "standard",
    "model",
    "tool",
]


class CandidateConcept(_Schema):
    candidate_key: str = Field(min_length=1, max_length=120, alias="candidateKey")
    canonical_name: str = Field(min_length=1, max_length=300, alias="canonicalName")
    aliases: tuple[str, ...] = ()
    proposed_domain_slug: str = Field(min_length=1, max_length=120, alias="proposedDomainSlug")
    concept_kind: ConceptKind = Field(alias="conceptKind")
    concise_definition: str = Field(min_length=1, max_length=4_000, alias="conciseDefinition")
    explanation: str | None = Field(default=None, max_length=12_000)
    evidence_segment_ids: tuple[str, ...] = Field(min_length=1, alias="evidenceSegmentIds")
    confidence: float = Field(ge=0, le=1)
    existing_concept_candidates: tuple[ExistingConceptCandidate, ...] = Field(
        default=(), alias="existingConceptCandidates"
    )


class ConceptRef(_Schema):
    concept_id: str | None = Field(default=None, alias="conceptId")
    candidate_key: str | None = Field(default=None, alias="candidateKey")

    def model_post_init(self, __context: object) -> None:
        if (self.concept_id is None) == (self.candidate_key is None):
            raise ValueError("a concept reference must contain exactly one id or candidate key")


class CandidateRelation(_Schema):
    source_ref: ConceptRef = Field(alias="sourceRef")
    relation_type_key: str = Field(min_length=1, max_length=120, alias="relationTypeKey")
    target_ref: ConceptRef = Field(alias="targetRef")
    qualification: str | None = Field(default=None, max_length=4_000)
    evidence_segment_ids: tuple[str, ...] = Field(min_length=1, alias="evidenceSegmentIds")
    confidence: float = Field(ge=0, le=1)


ClaimType = Literal[
    "definition",
    "descriptive",
    "causal",
    "normative",
    "design_principle",
    "technical_assumption",
    "empirical",
    "disputed",
]
ClaimStatus = Literal[
    "observed",
    "supported",
    "inferred",
    "hypothesized",
    "contested",
    "unknown",
]


class ClaimConceptRef(ConceptRef):
    role: str = Field(min_length=1, max_length=120)


class ClaimEvidence(_Schema):
    segment_id: str = Field(min_length=1, alias="segmentId")
    stance: Literal["supports", "challenges", "qualifies", "mentions"]


class CandidateClaim(_Schema):
    statement: str = Field(min_length=1, max_length=8_000)
    claim_type: ClaimType = Field(alias="claimType")
    status: ClaimStatus
    concept_refs: tuple[ClaimConceptRef, ...] = Field(default=(), alias="conceptRefs")
    evidence: tuple[ClaimEvidence, ...] = Field(min_length=1)
    qualification: str | None = Field(default=None, max_length=4_000)
    confidence: float = Field(ge=0, le=1)


class CandidateApplication(_Schema):
    application_type: Literal[
        "decision",
        "component",
        "experiment",
        "deployment_question",
        "artifact",
        "risk",
        "requirement",
    ] = Field(alias="applicationType")
    title: str = Field(min_length=1, max_length=300)
    implication: str = Field(min_length=1, max_length=8_000)
    concept_refs: tuple[ConceptRef, ...] = Field(default=(), alias="conceptRefs")
    evidence_segment_ids: tuple[str, ...] = Field(min_length=1, alias="evidenceSegmentIds")
    confidence: float = Field(ge=0, le=1)


class AtlasExtractionOutput(_Schema):
    schema_version: str = Field(default=EXTRACTION_SCHEMA_VERSION, alias="schemaVersion")
    document_assessment: DocumentAssessment = Field(alias="documentAssessment")
    concepts: tuple[CandidateConcept, ...] = ()
    relations: tuple[CandidateRelation, ...] = ()
    claims: tuple[CandidateClaim, ...] = ()
    applications: tuple[CandidateApplication, ...] = ()
    unresolved_questions: tuple[str, ...] = Field(default=(), alias="unresolvedQuestions")
    warnings: tuple[str, ...] = ()


class ConceptResolutionDecision(_Schema):
    candidate_key: str = Field(min_length=1, alias="candidateKey")
    action: Literal["match_existing", "create_new", "needs_human_review"]
    existing_concept_id: str | None = Field(default=None, alias="existingConceptId")
    relation_if_not_same: Literal["broader", "narrower", "related"] | None = Field(
        default=None, alias="relationIfNotSame"
    )
    reason: str = Field(min_length=1, max_length=2_000)
    confidence: float = Field(ge=0, le=1)


class ConceptResolutionOutput(_Schema):
    decisions: tuple[ConceptResolutionDecision, ...] = ()

