from loura_ingest_worker.ai_schemas import AtlasExtractionOutput
from loura_ingest_worker.extraction import DeterministicResolution
from loura_ingest_worker.proposals import build_proposal_items


def test_builder_keeps_exact_matches_as_citation_only() -> None:
    output = AtlasExtractionOutput.model_validate(
        {
            "documentAssessment": {
                "relevanceToAtlas": "high",
                "reason": "Relevant",
                "sourceLimitations": [],
            },
            "concepts": [
                {
                    "candidateKey": "idempotency",
                    "canonicalName": "Idempotency",
                    "aliases": [],
                    "proposedDomainSlug": "distributed-systems",
                    "conceptKind": "concept",
                    "conciseDefinition": "Safe repetition.",
                    "evidenceSegmentIds": ["a" * 32],
                    "confidence": 0.9,
                }
            ],
        }
    )
    items = build_proposal_items(
        output,
        (DeterministicResolution("idempotency", "match_existing", "concept-1", "exact match"),),
    )
    assert items[0].item_type == "add_citation"
    assert items[0].target_id == "concept-1"


def test_builder_never_returns_a_canonical_write_command() -> None:
    output = AtlasExtractionOutput.model_validate(
        {
            "documentAssessment": {
                "relevanceToAtlas": "high",
                "reason": "Relevant",
                "sourceLimitations": [],
            },
            "concepts": [],
            "claims": [],
        }
    )
    assert build_proposal_items(output) == ()
