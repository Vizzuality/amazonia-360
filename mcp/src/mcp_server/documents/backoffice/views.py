"""What the back office pages show, computed from the store's records."""

import re
from collections import Counter
from dataclasses import dataclass, field
from urllib.parse import urlsplit

from mcp_server.documents.ingest.triage import BUCKETS, bucket
from mcp_server.documents.links import passage_link
from mcp_server.documents.models import Document, Figure, Job, Passage
from mcp_server.documents.settings import DocsSettings
from mcp_server.places import normalise

JOB_LABELS = {
    "ingest_pdf": "Indexing the PDF",
    "ingest_web": "Fetching and indexing the page",
    "describe_figures": "Describing figures",
    "index_figures": "Indexing approved figures",
    "write_summary": "Writing the summary",
    "index_summary": "Indexing the summary",
    "delete_document": "Deleting",
}
BUCKET_LABELS = {
    "needs_review": "Needs review",
    "covered": "Covered by text",
    "small": "Small (icons, screens)",
    "undescribed": "Not described yet",
    "approved": "Approved",
    "discarded": "Discarded",
}
BUCKET_HELP = {
    "needs_review": "Start here: the document's text does not already say this.",
    "covered": "The section text already says most of what these descriptions say.",
    "small": "Small crops, mostly logos and icons: the model's weakest.",
    "undescribed": "The vision model has not described these yet.",
    "approved": "Searchable. Editing or discarding one re-indexes the document.",
    "discarded": "Never searched.",
}
BULK_BUCKETS = ("needs_review", "covered", "small")
SUMMARY_LABELS = {
    "none": "Not written yet",
    "pending_review": "Waiting for review",
    "approved": "Approved: related-document search uses it",
}
TYPE_LABELS = {"pdf": "PDF", "web": "Web page"}
MAX_ID_CHARS = 60
SLUG = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")


@dataclass(frozen=True)
class SectionView:
    path: str
    link: str | None
    passages: list[Passage]


@dataclass
class DocumentRow:
    document: Document
    active: Job | None = None
    errors: list[str] = field(default_factory=list)
    approved: int = 0
    discarded: int = 0
    to_review: int = 0

    @property
    def job_text(self) -> str:
        job = self.active
        if job is None:
            return ""
        label = JOB_LABELS[job.kind]
        if job.status == "queued":
            return f"Waiting: {label[0].lower()}{label[1:]}"
        if job.total:
            return f"{label} {job.progress}/{job.total}"
        return f"{label}…"

    @property
    def has_figures(self) -> bool:
        return bool(self.approved or self.discarded or self.to_review)


def document_row(
    document: Document, jobs: list[Job], figures: list[Figure]
) -> DocumentRow:
    counts = Counter(bucket(f) for f in figures)
    approved, discarded = counts.pop("approved", 0), counts.pop("discarded", 0)
    active = [j for j in jobs if j.status in ("queued", "running")]
    running = [j for j in active if j.status == "running"]
    errors = [
        f"{JOB_LABELS[j.kind]} failed: {j.error_message}"
        for j in jobs
        if j.status == "error"
    ]
    if document.status == "error" and document.error_message and not errors:
        errors.append(document.error_message)
    return DocumentRow(
        document=document,
        active=(running or active or [None])[0],
        errors=errors,
        approved=approved,
        discarded=discarded,
        to_review=sum(counts.values()),
    )


def section_views(
    passages: list[Passage], document: Document, settings: DocsSettings
) -> list[SectionView]:
    """Text passages grouped by section, in the order the document presents them."""
    grouped: dict[str, list[Passage]] = {}
    for passage in passages:
        if passage.origin == "text":
            grouped.setdefault(passage.section_path, []).append(passage)
    return [
        SectionView(path, passage_link(group[0], document, settings), group)
        for path, group in grouped.items()
    ]


def by_bucket(figures: list[Figure]) -> dict[str, list[Figure]]:
    grouped: dict[str, list[Figure]] = {b: [] for b in BUCKETS}
    for figure in figures:
        grouped[bucket(figure)].append(figure)
    return grouped


def slugify(text: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", normalise(text)).strip("-")
    return slug[:MAX_ID_CHARS].rstrip("-")


def web_slug(url: str) -> str:
    parts = urlsplit(url)
    return slugify(f"{parts.netloc} {parts.path}")


def is_slug(text: str) -> bool:
    return bool(SLUG.match(text))


def split_aliases(text: str) -> tuple[str, ...]:
    return tuple(dict.fromkeys(a.strip() for a in text.split(",") if a.strip()))


def is_web_address(url: str) -> bool:
    parts = urlsplit(url)
    return parts.scheme in ("http", "https") and bool(parts.netloc)
