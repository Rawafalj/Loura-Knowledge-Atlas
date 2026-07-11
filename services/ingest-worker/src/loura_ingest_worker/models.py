from __future__ import annotations

from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, HttpUrl


class QueueMessage(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="forbid")

    version: Literal[1]
    job_id: UUID = Field(alias="jobId")
    workspace_id: UUID = Field(alias="workspaceId")
    source_id: UUID = Field(alias="sourceId")
    requested_by: UUID = Field(alias="requestedBy")
    parser_profile: str = Field(alias="parserProfile", min_length=1, max_length=80)
    extraction_schema_version: str = Field(
        alias="extractionSchemaVersion", min_length=1, max_length=80
    )
    allow_external_ai: bool = Field(alias="allowExternalAi")
    force_reprocess: bool = Field(alias="forceReprocess")


class ClaimedMessage(BaseModel):
    message_id: int
    read_count: int
    enqueued_at: datetime
    payload: QueueMessage


class SourceRecord(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: UUID
    workspace_id: UUID
    origin: Literal["file", "url"]
    title: str
    external_url: HttpUrl | None
    final_url: HttpUrl | None
    file_name: str | None
    file_mime_type: str | None
    file_size_bytes: int | None
    file_checksum_sha256: str | None
    storage_path: str | None
    sensitivity: Literal["public", "internal", "confidential"]
    external_ai_policy: Literal["allowed", "denied", "explicit_per_run"]


class StructuralBlock(BaseModel):
    model_config = ConfigDict(frozen=True)

    block_type: Literal[
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
    heading_path: tuple[str, ...] = ()
    text: str
    page_start: int | None = None
    page_end: int | None = None
    provenance: dict[str, Any] = Field(default_factory=dict)


class ParsedDocument(BaseModel):
    model_config = ConfigDict(frozen=True)

    docling_json: dict[str, Any]
    markdown: str
    blocks: tuple[StructuralBlock, ...]
    extracted_metadata: dict[str, Any] = Field(default_factory=dict)
    page_count: int | None = None
    language_code: str | None = None
    parser_name: str = "docling"
    parser_version: str


class SourceSegment(BaseModel):
    model_config = ConfigDict(frozen=True)

    ordinal: int = Field(ge=1)
    stable_key: str = Field(pattern=r"^[0-9a-f]{32}$")
    segment_type: str
    heading_path: tuple[str, ...]
    text: str
    token_count: int = Field(ge=1)
    page_start: int | None = None
    page_end: int | None = None
    provenance: dict[str, Any] = Field(default_factory=dict)


class FetchedUrl(BaseModel):
    model_config = ConfigDict(frozen=True, arbitrary_types_allowed=True)

    content: bytes
    final_url: HttpUrl
    mime_type: str
    file_name: str
