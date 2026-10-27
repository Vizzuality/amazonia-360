from dataclasses import dataclass, field
from typing import Any, Literal

DocumentType = Literal["pdf", "web"]
SummaryStatus = Literal["none", "pending_review", "approved"]

DOCUMENT_TYPES = ("pdf", "web")
DOCUMENT_STATUSES = ("pending", "processing", "indexed", "error")
SUMMARY_STATUSES = ("none", "pending_review", "approved")
FIGURE_STATUSES = ("pending_review", "approved", "discarded")
JOB_STATUSES = ("queued", "running", "done", "error")
JOB_KINDS = (
    "ingest_pdf",
    "ingest_web",
    "describe_figures",
    "index_figures",
    "write_summary",
    "index_summary",
    "delete_document",
)


@dataclass(frozen=True)
class Topic:
    id: str
    name: str
    aliases: tuple[str, ...] = ()
    place_id: str | None = None


@dataclass(frozen=True)
class Document:
    id: str
    type: DocumentType
    title: str
    origin: str
    authors_year: str = ""
    status: str = "pending"
    error_message: str = ""
    chunk_count: int = 0
    figure_count: int = 0
    summary: str = ""
    summary_status: SummaryStatus = "none"
    topic_ids: tuple[str, ...] = ()


@dataclass
class Figure:
    figure_id: str
    document_id: str
    image_path: str
    image_hash: str
    section_path: str = ""
    page: int | None = None
    context: str = ""
    generated_description: str = ""
    final_description: str = ""
    review_status: str = "pending_review"
    width: int = 0
    height: int = 0
    ocr_text: str | None = None


@dataclass(frozen=True)
class Job:
    id: int
    kind: str
    document_id: str
    payload: dict[str, Any] = field(default_factory=dict)
    status: str = "queued"
    progress: int = 0
    total: int = 0
    error_message: str = ""
