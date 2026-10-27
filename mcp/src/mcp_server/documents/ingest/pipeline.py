"""Job handlers: extraction, figure descriptions, summaries and their indexing.

Docling, bs4 and RapidOCR are imported only when a job needs them, so this module
loads in the base install."""

import hashlib
import io
import logging
import shutil
import uuid
from collections.abc import Awaitable, Callable
from dataclasses import dataclass, replace
from pathlib import Path, PurePosixPath
from typing import TYPE_CHECKING, Protocol

import anyio.to_thread

from mcp_server.documents.embedding import Embedder
from mcp_server.documents.index import DocumentIndex
from mcp_server.documents.ingest.sections import sections_to_chunks
from mcp_server.documents.links import document_link
from mcp_server.documents.models import Document, Figure, Job, Passage, make_passage_id
from mcp_server.documents.settings import DocsSettings
from mcp_server.documents.store import DocumentStore

if TYPE_CHECKING:
    from mcp_server.documents.ingest.web import Page, PageImage

logger = logging.getLogger(__name__)

Progress = Callable[[int, int], Awaitable[None]]

# Logos, buttons and spacer images; real figures on web pages are far larger.
MIN_WEB_IMAGE_SIDE = 100
MAX_CAPTIONS = 20
CAPTION_CHARS = 200
ABSTRACT = "abstract"


class IngestError(Exception):
    pass


class Extraction(Protocol):
    chunks: list[Passage]
    figures: list[Figure]


@dataclass
class _Extracted:
    chunks: list[Passage]
    figures: list[Figure]
    title: str = ""
    # Some image could not be read: its previous figure row is kept.
    incomplete: bool = False


class Describer(Protocol):
    async def describe(self, figure: Figure, document: Document) -> str: ...


class SummaryWriting(Protocol):
    async def write(
        self,
        document: Document,
        headings: list[str],
        opening: str,
        captions: list[str],
    ) -> str: ...


class OcrReader(Protocol):
    def read(self, image_path: str) -> str: ...


PdfExtractor = Callable[[Path, str, str, Path], Extraction]
PageFetcher = Callable[[str], "Page"]
ImageFetcher = Callable[[str, str], bytes]


def incoming_dir(settings: DocsSettings) -> Path:
    """Where the back office drops an upload before its ingest job runs."""
    return settings.data_dir / "incoming"


def stored_pdf(document: Document, settings: DocsSettings) -> Path:
    """The copy that PDF links serve (see links.py), named after the origin."""
    name = PurePosixPath(document.origin).name
    if not name:
        raise IngestError(f"Document {document.id!r} has no stored file name")
    return settings.uploads_dir / name


class Pipeline:
    def __init__(
        self,
        store: DocumentStore,
        index: DocumentIndex,
        embedder: Embedder,
        describer: Describer,
        summary_writer: SummaryWriting,
        settings: DocsSettings,
        *,
        pdf_extractor: PdfExtractor | None = None,
        page_fetcher: PageFetcher | None = None,
        image_fetcher: ImageFetcher | None = None,
        ocr_factory: Callable[[], OcrReader] | None = None,
    ) -> None:
        self._store = store
        self._index = index
        self._embedder = embedder
        self._describer = describer
        self._summary_writer = summary_writer
        self._settings = settings
        self._pdf_extractor = pdf_extractor or _extract_pdf
        self._page_fetcher = page_fetcher or _fetch_page
        self._image_fetcher = image_fetcher or _fetch_image
        self._ocr_factory = ocr_factory or _figure_ocr
        self._handlers: dict[str, Callable[[Job, Progress], Awaitable[None]]] = {
            "ingest_pdf": self._ingest_pdf,
            "ingest_web": self._ingest_web,
            "describe_figures": self._describe_figures,
            "index_figures": self._index_figures,
            "write_summary": self._write_summary,
            "index_summary": self._index_summary,
            "delete_document": self._delete_document,
        }

    async def run(self, job: Job, progress: Progress) -> None:
        handler = self._handlers.get(job.kind)
        if handler is None:
            raise IngestError(f"Unknown job kind {job.kind!r}")
        await handler(job, progress)

    async def set_topics(self, document_id: str, topic_ids: list[str]) -> None:
        """Rewrites the topics on the stored points; nothing is embedded again."""
        await self._store.set_document_topics(document_id, topic_ids)
        await self._index.set_topics(document_id, sorted(set(topic_ids)))

    async def clean_stale_files(self) -> int:
        """Uploads left by jobs that died with the process; run after recovery."""
        incoming = incoming_dir(self._settings)
        if not incoming.is_dir():
            return 0
        waiting = {
            Path(job.payload["path"]).resolve()
            for job in await self._store.active_jobs()
            if job.status == "queued" and "path" in job.payload
        }
        removed = 0
        for path in incoming.iterdir():
            if path.is_file() and path.resolve() not in waiting:
                path.unlink()
                removed += 1
        return removed

    async def _ingest_pdf(self, job: Job, progress: Progress) -> None:
        document = await self._document(job.document_id)
        target = stored_pdf(document, self._settings)
        source = Path(job.payload["path"]) if "path" in job.payload else target
        try:

            async def extract(ingest_id: str) -> _Extracted:
                extracted = await anyio.to_thread.run_sync(
                    self._pdf_extractor,
                    source,
                    document.id,
                    ingest_id,
                    self._settings.figures_dir,
                )
                if not extracted.chunks:
                    raise IngestError("No text extracted; is it a scanned PDF?")
                return _Extracted(extracted.chunks, extracted.figures)

            def keep_file() -> None:
                # Links serve this copy, so it replaces the old file only now.
                if source.resolve() != target.resolve():
                    target.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copyfile(source, target)

            await self._replace(document, extract, keep_file)
        finally:
            if source.resolve().parent == incoming_dir(self._settings).resolve():
                source.unlink(missing_ok=True)

    async def _ingest_web(self, job: Job, progress: Progress) -> None:
        document = await self._document(job.document_id)

        async def extract(ingest_id: str) -> _Extracted:
            return await anyio.to_thread.run_sync(
                self._extract_web, document, ingest_id
            )

        await self._replace(document, extract, None)

    async def _replace(
        self,
        document: Document,
        extract: Callable[[str], Awaitable[_Extracted]],
        keep_file: Callable[[], None] | None,
    ) -> None:
        await self._store.set_status(document.id, "processing")
        ingest_id = uuid.uuid4().hex
        try:
            extracted = await extract(ingest_id)
            # Read again: topics may have changed while extraction ran.
            latest = await self._document(document.id)
            await self._index.upsert(
                [replace(p, topic_ids=latest.topic_ids) for p in extracted.chunks]
            )
            # Old passages go only after the new ones are in: a failed ingest loses
            # nothing.
            await self._index.delete_document(document.id, keep_ingest_id=ingest_id)
            if keep_file is not None:
                keep_file()
            figures = extracted.figures
            if extracted.incomplete:
                found = {f.figure_id for f in figures}
                figures += [
                    f
                    for f in await self._store.list_figures(document.id)
                    if f.figure_id not in found
                ]
            await self._store.replace_figures(document.id, figures)
            # The delete above dropped figure passages too; approvals survive by
            # image hash, so those figures come back now.
            approved = await self._index_approved_figures(latest)
            if extracted.title and not latest.title.strip():
                await self._store.upsert_document(
                    replace(latest, title=extracted.title)
                )
        except Exception as error:
            await self._store.set_status(
                document.id, "error", str(error) or type(error).__name__
            )
            raise
        await self._store.set_counts(
            document.id, len(extracted.chunks) + approved, len(figures)
        )
        await self._store.set_status(document.id, "indexed")
        await self._store.enqueue("describe_figures", document.id)
        if latest.summary_status != "approved":
            # An approved summary is the owner's decision; it survives a re-run.
            await self._store.enqueue("write_summary", document.id)

    def _extract_web(self, document: Document, ingest_id: str) -> _Extracted:
        from mcp_server.documents.ingest.web import page_images, parse_sections

        try:
            page = self._page_fetcher(document.origin)
        except Exception as error:
            raise IngestError(str(error) or type(error).__name__) from error
        title, sections = parse_sections(page.html)
        title = title or page.title or page.url
        chunks = sections_to_chunks(
            sections, document.title or title, document.id, "web", ingest_id
        )
        if not chunks:
            raise IngestError(f"No text found at {document.origin}")
        figures, incomplete = self._web_figures(
            page_images(page.html, page.url), document.id, page.url
        )
        return _Extracted(chunks, figures, title, incomplete)

    def _web_figures(
        self, images: list["PageImage"], document_id: str, page_url: str
    ) -> tuple[list[Figure], bool]:
        from PIL import Image

        figures_dir = self._settings.figures_dir
        figures_dir.mkdir(parents=True, exist_ok=True)
        found: dict[str, Figure] = {}
        incomplete = False
        for image in images:
            # Anything one image throws (HTTP, decoding, decompression bombs) costs
            # only that image, never the page's other figures.
            try:
                data = self._image_fetcher(image.url, page_url)
                with Image.open(io.BytesIO(data)) as opened:
                    if min(opened.size) < MIN_WEB_IMAGE_SIDE:
                        continue
                    frame = opened.convert(
                        "RGBA" if "A" in opened.getbands() else "RGB"
                    )
            except Exception as error:
                logger.warning("Could not read image %s: %s", image.url, error)
                incomplete = True
                continue
            buffer = io.BytesIO()
            frame.save(buffer, format="PNG")
            png = buffer.getvalue()
            image_hash = hashlib.sha256(png).hexdigest()
            figure_id = image_hash[:16]
            if figure_id in found:
                continue
            path = figures_dir / f"{figure_id}.png"
            path.write_bytes(png)
            found[figure_id] = Figure(
                figure_id=figure_id,
                document_id=document_id,
                image_path=str(path),
                image_hash=image_hash,
                section_path=image.section_path,
                context=image.context,
                width=frame.width,
                height=frame.height,
            )
        return list(found.values()), incomplete

    async def _describe_figures(self, job: Job, progress: Progress) -> None:
        """OCR first: the text read from a figure grounds its description."""
        document = await self._document(job.document_id)
        figures = await self._store.list_figures(document.id)
        to_read = [
            f for f in figures if f.ocr_text is None and f.review_status != "discarded"
        ]
        pending = [
            f
            for f in figures
            if not f.generated_description and f.review_status == "pending_review"
        ]
        total = len(to_read) + len(pending)
        read_text, unread = await self._read_figures(document, to_read, progress, total)
        failures = list(unread.values())
        done = len(to_read)
        for figure in pending:
            await progress(done, total)
            if figure.figure_id in unread:
                done += 1
                continue
            figure = await self._store.get_figure(document.id, figure.figure_id)
            if figure is None:
                continue
            try:
                text = await self._describer.describe(figure, document)
            except Exception as error:
                # The figure stays undescribed, so the next run picks it up again.
                logger.warning(
                    "Could not describe figure %s: %s", figure.figure_id, error
                )
                failures.append(f"{figure.figure_id}: {error or type(error).__name__}")
            else:
                await self._store.set_generated(document.id, figure.figure_id, text)
            done += 1
        await progress(done, total)
        approved = await self._store.approved_figures(document.id)
        if any(f.figure_id in read_text for f in approved):
            # Approved figures carry their OCR text into search.
            await self._store.enqueue("index_figures", document.id)
        if failures:
            tried = {f.figure_id for f in to_read} | {f.figure_id for f in pending}
            raise IngestError(
                f"{len(failures)} of {len(tried)} figures could not be described "
                f"and were left for the next run ({failures[0]})"
            )

    async def _read_figures(
        self, document: Document, to_read: list[Figure], progress: Progress, total: int
    ) -> tuple[set[str], dict[str, str]]:
        """The ids of the figures with text in them, and the error of each figure
        that could not be read."""
        read_text: set[str] = set()
        unread: dict[str, str] = {}
        if not to_read:
            return read_text, unread
        ocr = await anyio.to_thread.run_sync(self._ocr_factory)
        for done, figure in enumerate(to_read):
            await progress(done, total)
            try:
                text = await anyio.to_thread.run_sync(ocr.read, figure.image_path)
            except Exception as error:
                # Its OCR text stays unset, so the next run reads it again; it is not
                # described until then, as the text grounds the description.
                logger.warning("Could not read figure %s: %s", figure.figure_id, error)
                unread[figure.figure_id] = (
                    f"{figure.figure_id}: {error or type(error).__name__}"
                )
                continue
            await self._store.set_ocr(document.id, figure.figure_id, text)
            if text:
                read_text.add(figure.figure_id)
        return read_text, unread

    async def _index_figures(self, job: Job, progress: Progress) -> None:
        document = await self._document(job.document_id)
        await self._index_approved_figures(document)
        passages = await self._index.list_document(document.id)
        figures = await self._store.list_figures(document.id)
        await self._store.set_counts(document.id, len(passages), len(figures))

    async def _index_approved_figures(self, document: Document) -> int:
        figures = await self._store.approved_figures(document.id)
        await self._index.delete_origin(document.id, "figure")
        ingest_id = uuid.uuid4().hex
        await self._index.upsert(
            [
                Passage(
                    passage_id=make_passage_id(
                        document.id, f"figure-{ingest_id}", ordinal
                    ),
                    document_id=document.id,
                    document_type=document.type,
                    ingest_id=ingest_id,
                    section_path=figure.section_path,
                    text=_figure_text(figure),
                    # Shown to Claude, not embedded: OCR of big annotated maps is a
                    # long list of fragments that drowns the description in search.
                    embed_text=f"{figure.section_path}\n{figure.final_description}",
                    origin="figure",
                    page=figure.page,
                    figure_path=figure.image_path,
                    position=ordinal,
                    topic_ids=document.topic_ids,
                )
                for ordinal, figure in enumerate(figures)
            ]
        )
        return len(figures)

    async def _write_summary(self, job: Job, progress: Progress) -> None:
        document = await self._document(job.document_id)
        passages = [
            p
            for p in await self._index.list_document(document.id)
            if p.origin == "text"
        ]
        if not passages:
            raise IngestError("The document has no indexed text to summarize")
        figures = await self._store.list_figures(document.id)
        text = await self._summary_writer.write(
            document,
            _headings(passages),
            _opening(passages),
            _captions(figures),
        )
        await self._store.set_summary(document.id, text, "pending_review")
        # A new draft replaces whatever was approved: it waits for review again.
        await self._index.delete_summary(document.id)

    async def _index_summary(self, job: Job, progress: Progress) -> None:
        document = await self._document(job.document_id)
        if document.summary_status != "approved" or not document.summary.strip():
            await self._index.delete_summary(document.id)
            return
        (embedded,) = await self._embedder.embed_documents([document.summary])
        link = document_link(document, self._settings) or ""
        await self._index.upsert_summary(document, embedded.dense, link)

    async def _delete_document(self, job: Job, progress: Progress) -> None:
        document = await self._store.get_document(job.document_id)
        await self._index.delete_document(job.document_id)
        await self._index.delete_summary(job.document_id)
        if document is not None and document.type == "pdf" and document.origin:
            stored = stored_pdf(document, self._settings)
            if stored.resolve().parent == self._settings.uploads_dir.resolve():
                stored.unlink(missing_ok=True)
        # Figures and topic links go with the row (ON DELETE CASCADE).
        await self._store.delete_document(job.document_id)

    async def _document(self, document_id: str) -> Document:
        document = await self._store.get_document(document_id)
        if document is None:
            raise IngestError(f"Unknown document {document_id!r}")
        return document


def _figure_text(figure: Figure) -> str:
    if not figure.ocr_text:
        return figure.final_description
    return f"{figure.final_description}\n\nText in the figure: {figure.ocr_text}"


def _headings(passages: list[Passage]) -> list[str]:
    return list(dict.fromkeys(p.section_path for p in passages if p.section_path))


def _opening(passages: list[Passage]) -> str:
    """The abstract when a section is named so, else the first passage."""
    ordered = sorted(passages, key=lambda p: p.position)
    for passage in ordered:
        last = passage.section_path.rsplit(" > ", 1)[-1]
        if last.strip().lower() == ABSTRACT:
            return passage.text
    return ordered[0].text


def _captions(figures: list[Figure]) -> list[str]:
    """First line of each figure's context: a web image's alt text, or the start
    of the section a PDF figure sits in. Extraction keeps no separate caption."""
    lines = (
        f.context.strip().split("\n", 1)[0][:CAPTION_CHARS]
        for f in figures
        if f.review_status != "discarded" and f.context.strip()
    )
    return list(dict.fromkeys(lines))[:MAX_CAPTIONS]


def _extract_pdf(
    path: Path, document_id: str, ingest_id: str, figures_dir: Path
) -> Extraction:
    from mcp_server.documents.ingest.pdf import extract_pdf

    return extract_pdf(path, document_id, ingest_id, figures_dir)


def _fetch_page(url: str) -> "Page":
    from mcp_server.documents.ingest.web import fetch_page

    return fetch_page(url)


def _fetch_image(url: str, page_url: str) -> bytes:
    from mcp_server.documents.ingest.web import fetch_image

    return fetch_image(url, page_url=page_url)


def _figure_ocr() -> OcrReader:
    from mcp_server.documents.ingest.ocr import FigureOcr

    return FigureOcr()
