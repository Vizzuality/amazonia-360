from pathlib import PurePosixPath

from mcp_server.documents.models import Document, Passage
from mcp_server.documents.settings import DocsSettings

FILES_ROUTE = "files"


def passage_link(passage: Passage, doc: Document, settings: DocsSettings) -> str | None:
    """Where a passage can be read: figure crop, PDF page or web page section."""
    if passage.figure_path:
        # Crops always live in figures_dir; the stored path's prefix depends on how
        # data_dir was spelled at ingest time.
        name = PurePosixPath(passage.figure_path).name
        return f"{_base(settings)}/{FILES_ROUTE}/figures/{name}"
    if doc.type == "web":
        if not doc.origin:
            return None
        return f"{doc.origin}#{passage.anchor}" if passage.anchor else doc.origin
    url = _pdf_url(doc, settings)
    if url and passage.page:
        url += f"#page={passage.page}"
    return url


def document_link(doc: Document, settings: DocsSettings) -> str | None:
    if doc.type == "web":
        return doc.origin or None
    return _pdf_url(doc, settings)


def file_url(path: str, settings: DocsSettings) -> str | None:
    relative = PurePosixPath(path)
    if relative.is_absolute() or ".." in relative.parts:
        return None
    return f"{_base(settings)}/{FILES_ROUTE}/{relative.as_posix()}"


def _pdf_url(doc: Document, settings: DocsSettings) -> str | None:
    return file_url(f"uploads/{PurePosixPath(doc.origin).name}", settings)


def _base(settings: DocsSettings) -> str:
    return settings.public_url.rstrip("/")
