from loura_ingest_worker.models import StructuralBlock
from loura_ingest_worker.segmentation import MAX_SEGMENT_TOKENS, build_segments


def test_segment_order_and_keys_are_stable() -> None:
    blocks = (
        StructuralBlock(block_type="heading", heading_path=("Reliability",), text="Reliability"),
        StructuralBlock(
            block_type="paragraph",
            heading_path=("Reliability",),
            text="Retries require explicit operation identity and outcome checks.",
            page_start=2,
            page_end=2,
            provenance={"docling": [{"page_no": 2}]},
        ),
    )

    first = build_segments(blocks)
    second = build_segments(blocks)

    assert first == second
    assert [segment.ordinal for segment in first] == [1, 2]
    assert first[1].heading_path == ("Reliability",)
    assert first[1].page_start == 2


def test_long_blocks_split_below_the_token_cap() -> None:
    segments = build_segments(
        (
            StructuralBlock(
                block_type="paragraph",
                heading_path=("Long section",),
                text=" ".join(f"word-{index}" for index in range(2_000)),
            ),
        )
    )

    assert len(segments) > 1
    assert all(segment.token_count <= MAX_SEGMENT_TOKENS for segment in segments)
