from __future__ import annotations

from importlib.metadata import version
from pathlib import Path
from typing import Any, Literal

from loura_ingest_worker.models import ParsedDocument, StructuralBlock


def _label_value(item: object) -> str:
    label = getattr(item, "label", "other")
    return str(getattr(label, "value", label))


def _item_text(item: object, document: object) -> str:
    text = getattr(item, "text", None)
    if isinstance(text, str):
        return text.strip()
    exporter = getattr(item, "export_to_markdown", None)
    if callable(exporter):
        try:
            return str(exporter(doc=document)).strip()
        except TypeError:
            return str(exporter()).strip()
    return ""


def _provenance(item: object) -> tuple[int | None, int | None, dict[str, Any]]:
    entries = getattr(item, "prov", []) or []
    serialized: list[dict[str, Any]] = []
    pages: list[int] = []
    for entry in entries:
        model_dump = getattr(entry, "model_dump", None)
        value = model_dump(mode="json") if callable(model_dump) else {}
        if isinstance(value, dict):
            serialized.append(value)
        page = getattr(entry, "page_no", None)
        if isinstance(page, int):
            pages.append(page)
    return (
        min(pages) if pages else None,
        max(pages) if pages else None,
        {"docling": serialized},
    )


BlockType = Literal[
    "heading",
    "paragraph",
    "list",
    "table",
    "figure_caption",
    "code",
    "formula",
    "transcript",
    "other",
]


def _block_type(label: str) -> BlockType:
    mapping: dict[str, BlockType] = {
        "title": "heading",
        "section_header": "heading",
        "list_item": "list",
        "table": "table",
        "caption": "figure_caption",
        "code": "code",
        "formula": "formula",
    }
    return mapping.get(label, "paragraph")


class DoclingParser:
    def parse(self, path: Path) -> ParsedDocument:
        # Import lazily: worker health and queue polling must not load the heavy parser stack.
        from docling.datamodel.base_models import InputFormat
        from docling.datamodel.pipeline_options import PdfPipelineOptions
        from docling.document_converter import DocumentConverter, PdfFormatOption

        converter = DocumentConverter(
            format_options={
                InputFormat.PDF: PdfFormatOption(
                    pipeline_options=PdfPipelineOptions(
                        do_ocr=False,
                        do_table_structure=False,
                        do_picture_classification=False,
                        do_picture_description=False,
                        generate_page_images=False,
                        generate_picture_images=False,
                        generate_table_images=False,
                    ),
                )
            }
        )
        result = converter.convert(path)
        document = result.document
        markdown = document.export_to_markdown()
        raw_json = document.export_to_dict()
        headings: list[str] = []
        blocks: list[StructuralBlock] = []
        for item, level in document.iterate_items():
            label = _label_value(item)
            text = _item_text(item, document)
            if not text:
                continue
            block_type = _block_type(label)
            if block_type == "heading":
                depth = max(0, int(level) - 1)
                headings = headings[:depth]
                headings.append(text)
            page_start, page_end, provenance = _provenance(item)
            blocks.append(
                StructuralBlock(
                    block_type=block_type,
                    heading_path=tuple(headings),
                    text=text,
                    page_start=page_start,
                    page_end=page_end,
                    provenance=provenance,
                )
            )
        pages = getattr(document, "pages", None)
        page_count = len(pages) if pages is not None else None
        return ParsedDocument(
            docling_json=raw_json,
            markdown=markdown,
            blocks=tuple(blocks),
            extracted_metadata={"name": getattr(document, "name", path.stem)},
            page_count=page_count,
            parser_version=version("docling"),
        )
