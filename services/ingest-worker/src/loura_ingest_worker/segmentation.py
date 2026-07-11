from __future__ import annotations

import hashlib
import math

from loura_ingest_worker.models import SourceSegment, StructuralBlock

MAX_SEGMENT_TOKENS = 1_000


def estimate_tokens(text: str) -> int:
    return max(1, math.ceil(len(text.split()) * 1.33))


def _split_block(block: StructuralBlock) -> tuple[StructuralBlock, ...]:
    words = block.text.split()
    max_words = max(1, math.floor(MAX_SEGMENT_TOKENS / 1.33))
    if len(words) <= max_words:
        return (block,)
    return tuple(
        block.model_copy(update={"text": " ".join(words[offset : offset + max_words])})
        for offset in range(0, len(words), max_words)
    )


def build_segments(blocks: tuple[StructuralBlock, ...]) -> tuple[SourceSegment, ...]:
    segments: list[SourceSegment] = []
    for block in blocks:
        for split_block in _split_block(block):
            text = split_block.text.strip()
            if not text:
                continue
            ordinal = len(segments) + 1
            stable_input = "\0".join(
                [
                    str(ordinal),
                    split_block.block_type,
                    "/".join(split_block.heading_path),
                    text,
                ]
            )
            stable_key = hashlib.sha256(stable_input.encode("utf-8")).hexdigest()[:32]
            segments.append(
                SourceSegment(
                    ordinal=ordinal,
                    stable_key=stable_key,
                    segment_type=split_block.block_type,
                    heading_path=split_block.heading_path,
                    text=text,
                    token_count=estimate_tokens(text),
                    page_start=split_block.page_start,
                    page_end=split_block.page_end,
                    provenance=split_block.provenance,
                )
            )
    return tuple(segments)
