"""The back office: upload and review documents, manage topics, test a question.

It runs on 127.0.0.1 next to the job worker and serves the stored files that the
links in search results point at."""

import uuid
from collections import Counter
from collections.abc import Awaitable, Callable
from contextlib import AbstractAsyncContextManager
from pathlib import Path, PurePosixPath
from typing import Annotated, Any
from urllib.parse import urlsplit

from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse, HTMLResponse, PlainTextResponse, Response
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from mcp_server.documents.backoffice.views import (
    BUCKET_HELP,
    BUCKET_LABELS,
    BULK_BUCKETS,
    SUMMARY_LABELS,
    TYPE_LABELS,
    by_bucket,
    document_row,
    is_slug,
    is_web_address,
    section_views,
    slugify,
    split_aliases,
    web_slug,
)
from mcp_server.documents.index import DocumentIndex
from mcp_server.documents.ingest.pipeline import Pipeline, incoming_dir, stored_pdf
from mcp_server.documents.ingest.triage import BUCKETS
from mcp_server.documents.ingest.triage import bucket as figure_bucket
from mcp_server.documents.links import document_link
from mcp_server.documents.models import Document, Topic
from mcp_server.documents.search import DocumentSearch
from mcp_server.documents.settings import DocsSettings
from mcp_server.documents.store import DocumentStore
from mcp_server.places import Places, load_places

HERE = Path(__file__).parent
STATIC_DIR = HERE / "static"
LOCAL_HOSTS = ("127.0.0.1", "localhost")
SAFE_METHODS = ("GET", "HEAD", "OPTIONS")
TRUSTED_FETCH_SITES = ("same-origin", "none")
MAX_TITLE_CHARS = 200
REVIEW_ACTIONS = ("approve", "discard", "reset")
KIND_LABELS = {
    "province": "Province",
    "canton": "Canton",
    "protected_area": "Protected area",
}
NOT_A_PDF = "Not a PDF: choose the document's .pdf file."
NOT_A_WEB_ADDRESS = "Not a web address: paste a page link like https://…."
NEVER_STORED = (
    "The PDF was never stored, so there is nothing to re-run: upload it again "
    "with Replace the PDF on the document page."
)

templates = Jinja2Templates(directory=HERE / "templates")
templates.env.globals.update(
    type_labels=TYPE_LABELS, kind_labels=KIND_LABELS, max_title=MAX_TITLE_CHARS
)

QdrantCheck = Callable[[], Awaitable[bool]]
Lifespan = Callable[[FastAPI], AbstractAsyncContextManager[None]]
FormText = Annotated[str, Form()]
FormList = Annotated[list[str] | None, Form()]


async def _always_up() -> bool:
    return True


ROUTES = (
    ("GET", "/", "documents"),
    ("GET", "/document-rows", "document_rows"),
    ("POST", "/documents/pdf", "upload_pdf"),
    ("POST", "/documents/web", "add_web"),
    ("GET", "/documents/{document_id}", "document_page"),
    ("POST", "/documents/{document_id}", "save_details"),
    ("POST", "/documents/{document_id}/summary", "save_summary"),
    ("POST", "/documents/{document_id}/rerun", "rerun"),
    ("POST", "/documents/{document_id}/delete", "delete_document"),
    ("GET", "/documents/{document_id}/figures", "figures_page"),
    ("POST", "/documents/{document_id}/figures/bulk", "bulk_review"),
    ("POST", "/documents/{document_id}/figures/{figure_id}", "review_figure"),
    ("GET", "/topics", "topics_page"),
    ("POST", "/topics", "create_topic"),
    ("POST", "/topics/{topic_id}", "update_topic"),
    ("POST", "/topics/{topic_id}/delete", "delete_topic"),
    ("POST", "/ask", "ask"),
)


def create_backoffice(
    settings: DocsSettings,
    store: DocumentStore,
    index: DocumentIndex,
    search: DocumentSearch,
    pipeline: Pipeline,
    *,
    places: Places | None = None,
    qdrant_ok: QdrantCheck = _always_up,
    lifespan: Lifespan | None = None,
    allowed_hosts: tuple[str, ...] = LOCAL_HOSTS,
) -> FastAPI:
    app = FastAPI(
        title="Amazonia 360 documents",
        lifespan=lifespan,
        docs_url=None,
        redoc_url=None,
        openapi_url=None,
    )

    @app.middleware("http")
    async def local_only(
        request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        # Other sites can reach 127.0.0.1 from the owner's browser: refuse
        # DNS-rebound hosts and cross-site writes (CSRF).
        host = request.headers.get("host", "")
        if urlsplit(f"//{host}").hostname not in allowed_hosts:
            return PlainTextResponse("Unknown host", status_code=400)
        if request.method not in SAFE_METHODS and not _same_origin(request, host):
            return PlainTextResponse("Cross-site request refused", status_code=403)
        return await call_next(request)

    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
    roots = {"uploads": settings.uploads_dir, "figures": settings.figures_dir}

    @app.get("/files/{kind}/{name}")
    async def get_file(kind: str, name: str) -> FileResponse:
        root = roots.get(kind)
        path = _inside(root, name) if root is not None else None
        if path is None:
            raise HTTPException(status_code=404)
        return FileResponse(path)

    handlers = _Handlers(
        settings, store, index, search, pipeline, places or load_places(), qdrant_ok
    )
    for method, path, name in ROUTES:
        app.add_api_route(path, getattr(handlers, name), methods=[method])
    return app


class _Handlers:
    """The pages and form posts; create_backoffice maps ROUTES onto them."""

    def __init__(
        self,
        settings: DocsSettings,
        store: DocumentStore,
        index: DocumentIndex,
        search: DocumentSearch,
        pipeline: Pipeline,
        places: Places,
        qdrant_ok: QdrantCheck,
    ) -> None:
        self.settings = settings
        self.store = store
        self.index = index
        self.search = search
        self.pipeline = pipeline
        self.places = places
        self.qdrant_ok = qdrant_ok

    async def page(
        self, request: Request, name: str, current: str = "", **context: object
    ) -> HTMLResponse:
        documents = await self.store.list_documents()
        return templates.TemplateResponse(
            request,
            name,
            {
                "topics": await self.store.list_topics(),
                "topic_counts": Counter(t for d in documents for t in d.topic_ids),
                "document_total": len(documents),
                "current": current,
                "qdrant_down": not await self.qdrant_ok(),
                **context,
            },
        )

    def partial(
        self, request: Request, name: str, status_code: int = 200, **context: object
    ) -> HTMLResponse:
        return templates.TemplateResponse(
            request, name, context, status_code=status_code
        )

    async def document_or_404(self, document_id: str) -> Document:
        document = await self.store.get_document(document_id)
        if document is None:
            raise HTTPException(404, detail=f"No document {document_id!r}")
        return document

    async def topic_or_404(self, topic_id: str) -> Topic:
        topic = await self.store.get_topic(topic_id)
        if topic is None:
            raise HTTPException(404, detail=f"No topic {topic_id!r}")
        return topic

    async def view_topic(self, topic_id: str) -> Topic | None:
        """The topic a documents list is filtered to; '' is all documents."""
        return await self.topic_or_404(topic_id) if topic_id else None

    async def rows_context(self, view: Topic | None, error: str = "") -> dict[str, Any]:
        documents = await self.store.list_documents(view.id if view else None)
        jobs = await self.store.latest_jobs([d.id for d in documents])
        rows = [
            document_row(d, jobs.get(d.id, []), await self.store.list_figures(d.id))
            for d in documents
        ]
        return {
            "view": view,
            "rows": rows,
            "polling": any(r.active for r in rows),
            "topics": await self.store.list_topics(),
            "error": error,
        }

    async def documents_partial(
        self,
        request: Request,
        view: Topic | None,
        error: str = "",
        status_code: int = 200,
    ) -> HTMLResponse:
        return self.partial(
            request,
            "_documents.html",
            status_code,
            **await self.rows_context(view, error),
        )

    async def refused(
        self, request: Request, view: Topic | None, back: str, message: str, status: int
    ) -> HTMLResponse:
        if back == "document":
            return self.partial(request, "_notice.html", status, message=message)
        return await self.documents_partial(request, view, message, status)

    async def topics_error(self, topic_ids: list[str]) -> str:
        known = {t.id for t in await self.store.list_topics()}
        missing = [t for t in topic_ids if t not in known]
        return f"Unknown topics: {', '.join(missing)}." if missing else ""

    async def new_document_id(self, base: str) -> str:
        base = base or "document"
        candidate, n = base, 2
        while await self.store.get_document(candidate) is not None:
            candidate, n = f"{base}-{n}", n + 1
        return candidate

    async def enqueue_ingest(self, document_id: str, upload: Path) -> None:
        previous = next(
            (
                j
                for j in await self.store.active_jobs(document_id)
                if j.kind == "ingest_pdf" and j.status == "queued"
            ),
            None,
        )
        job = await self.store.enqueue("ingest_pdf", document_id, {"path": str(upload)})
        # The waiting job now ingests `upload`; the file it pointed at is orphaned.
        # Unless the worker claimed it meanwhile: then it is reading that file.
        if previous is not None and job.id == previous.id:
            old = Path(previous.payload.get("path", ""))
            if old != upload and _is_incoming(old, self.settings):
                old.unlink(missing_ok=True)

    def original_link(self, document: Document) -> str | None:
        """None for a PDF whose first ingest failed: no copy was ever stored."""
        if document.type == "pdf" and not stored_pdf(document, self.settings).is_file():
            return None
        return document_link(document, self.settings)

    # Documents

    async def documents(self, request: Request, topic: str = "") -> HTMLResponse:
        view = await self.view_topic(topic)
        place = self.places.get(view.place_id) if view and view.place_id else None
        return await self.page(
            request,
            "documents.html",
            current=view.id if view else "all",
            place=place,
            **await self.rows_context(view),
        )

    async def document_rows(self, request: Request, topic: str = "") -> HTMLResponse:
        context = await self.rows_context(await self.view_topic(topic))
        return self.partial(request, "_document_rows.html", **context)

    async def upload_pdf(
        self,
        request: Request,
        file: Annotated[UploadFile | None, File()] = None,
        title: FormText = "",
        authors_year: FormText = "",
        topic_ids: FormList = None,
        document_id: FormText = "",
        topic: FormText = "",
        back: FormText = "",
    ) -> HTMLResponse:
        view = await self.view_topic(topic)
        content = await file.read() if file else b""
        filename = PurePosixPath((file.filename or "") if file else "").name
        if not filename.lower().endswith(".pdf") or not content.startswith(b"%PDF-"):
            return await self.refused(request, view, back, NOT_A_PDF, 422)
        if document_id:
            document = await self.document_or_404(document_id)
            if document.type != "pdf":
                raise HTTPException(400, detail="Only a PDF document takes a file")
        else:
            title = title.strip() or PurePosixPath(filename).stem.strip()
            wanted = sorted(set(topic_ids or []))
            error = _title_error(title) or await self.topics_error(wanted)
            if error:
                return await self.refused(request, view, back, error, 422)
            new_id = await self.new_document_id(slugify(title))
            document = Document(
                id=new_id,
                type="pdf",
                title=title,
                origin=f"uploads/{new_id}.pdf",
                authors_year=authors_year.strip(),
                topic_ids=tuple(wanted),
            )
            await self.store.upsert_document(document)
        upload = incoming_dir(self.settings) / f"{uuid.uuid4().hex}.pdf"
        upload.parent.mkdir(parents=True, exist_ok=True)
        upload.write_bytes(content)
        await self.enqueue_ingest(document.id, upload)
        if back == "document":
            return _redirect(f"/documents/{document.id}")
        return await self.documents_partial(request, view)

    async def add_web(
        self,
        request: Request,
        url: FormText = "",
        title: FormText = "",
        authors_year: FormText = "",
        topic_ids: FormList = None,
        topic: FormText = "",
    ) -> HTMLResponse:
        view = await self.view_topic(topic)
        url, title = url.strip(), title.strip()
        wanted = sorted(set(topic_ids or []))
        error = "" if is_web_address(url) else NOT_A_WEB_ADDRESS
        error = (
            error or (title and _title_error(title)) or await self.topics_error(wanted)
        )
        if not error:
            same = [
                d
                for d in await self.store.list_documents()
                if d.type == "web" and d.origin == url
            ]
            if same:
                error = f"This page is already added as {same[0].title or same[0].id}."
        if error:
            return await self.documents_partial(request, view, error, 422)
        document = Document(
            id=await self.new_document_id(slugify(title) or web_slug(url)),
            type="web",
            title=title,
            origin=url,
            authors_year=authors_year.strip(),
            topic_ids=tuple(wanted),
        )
        await self.store.upsert_document(document)
        await self.store.enqueue("ingest_web", document.id)
        return await self.documents_partial(request, view)

    async def document_page(self, request: Request, document_id: str) -> HTMLResponse:
        document = await self.document_or_404(document_id)
        jobs = await self.store.latest_jobs([document.id])
        figures = await self.store.list_figures(document.id)
        passages = await self.index.list_document(document.id)
        return await self.page(
            request,
            "document.html",
            row=document_row(document, jobs.get(document.id, []), figures),
            d=document,
            original=self.original_link(document),
            sections=section_views(passages, document, self.settings),
            form=_details(document),
            summary=_summary_context(document),
        )

    async def save_details(
        self,
        request: Request,
        document_id: str,
        title: FormText = "",
        authors_year: FormText = "",
        topic_ids: FormList = None,
    ) -> HTMLResponse:
        document = await self.document_or_404(document_id)
        title, authors_year = title.strip(), authors_year.strip()
        wanted = sorted(set(topic_ids or []))
        error = _title_error(title) or await self.topics_error(wanted)
        if error:
            return self.partial(
                request,
                "_document_form.html",
                422,
                d=document,
                form={
                    "title": title,
                    "authors_year": authors_year,
                    "topic_ids": wanted,
                },
                topics=await self.store.list_topics(),
                error=error,
            )
        await self.store.set_details(document.id, title, authors_year)
        if wanted != sorted(document.topic_ids):
            await self.pipeline.set_topics(document.id, wanted)
        cited = (title, authors_year) != (document.title, document.authors_year)
        if cited and document.summary_status == "approved":
            # The summary point carries the title and citation shown as related.
            await self.store.enqueue("index_summary", document.id)
        return _redirect(f"/documents/{document.id}")

    async def save_summary(
        self,
        request: Request,
        document_id: str,
        text: FormText = "",
        approve: Annotated[bool, Form()] = False,
    ) -> HTMLResponse:
        document = await self.document_or_404(document_id)
        text = text.strip()
        if approve and not text:
            return self.partial(
                request,
                "_summary_card.html",
                422,
                d=document,
                summary={
                    **_summary_context(document),
                    "text": text,
                    "error": "Write a summary before approving it.",
                },
            )
        status = "approved" if approve else "pending_review" if text else "none"
        await self.store.set_summary(document.id, text, status)
        if approve or document.summary_status == "approved":
            # Indexing an unapproved summary removes it from related-document search.
            await self.store.enqueue("index_summary", document.id)
        document = await self.document_or_404(document_id)
        return self.partial(
            request,
            "_summary_card.html",
            d=document,
            summary=_summary_context(document),
        )

    async def rerun(
        self,
        request: Request,
        document_id: str,
        topic: FormText = "",
        back: FormText = "",
    ) -> HTMLResponse:
        document = await self.document_or_404(document_id)
        view = await self.view_topic(topic)
        if document.type == "web":
            await self.store.enqueue("ingest_web", document.id)
        else:
            ingesting = any(
                j.kind == "ingest_pdf"
                for j in await self.store.active_jobs(document.id)
            )
            if not ingesting and not stored_pdf(document, self.settings).is_file():
                return await self.refused(request, view, back, NEVER_STORED, 409)
            # No payload: a waiting upload stays; otherwise the stored copy is read.
            await self.store.enqueue("ingest_pdf", document.id)
        if back == "document":
            return _redirect(f"/documents/{document.id}")
        return await self.documents_partial(request, view)

    async def delete_document(
        self,
        request: Request,
        document_id: str,
        topic: FormText = "",
        back: FormText = "",
    ) -> HTMLResponse:
        document = await self.document_or_404(document_id)
        view = await self.view_topic(topic)
        await self.store.enqueue("delete_document", document.id)
        if back == "document":
            return _redirect("/")
        return await self.documents_partial(request, view)

    # Figures

    async def figures_page(
        self, request: Request, document_id: str, bucket: str = "needs_review"
    ) -> HTMLResponse:
        document = await self.document_or_404(document_id)
        if bucket not in BUCKETS:
            raise HTTPException(400, detail=f"Unknown bucket {bucket!r}")
        grouped = by_bucket(await self.store.list_figures(document.id))
        return await self.page(
            request,
            "figures.html",
            d=document,
            bucket=bucket,
            buckets=BUCKETS,
            labels=BUCKET_LABELS,
            help=BUCKET_HELP[bucket],
            counts={b: len(grouped[b]) for b in BUCKETS},
            figures=grouped[bucket],
            bulk=bucket in BULK_BUCKETS,
        )

    async def bulk_review(
        self,
        document_id: str,
        bucket: FormText = "",
        action: FormText = "",
        figure_ids: FormText = "",
    ) -> HTMLResponse:
        document = await self.document_or_404(document_id)
        if bucket not in BULK_BUCKETS or action not in ("approve", "discard"):
            raise HTTPException(400, detail="Bulk review not allowed here")
        shown = {i for i in figure_ids.split(",") if i}
        if not shown:
            raise HTTPException(400, detail="No figures were shown")
        # Only what the owner saw: a running describe job may have added figures.
        grouped = by_bucket(await self.store.list_figures(document.id))
        chosen = [f for f in grouped[bucket] if f.figure_id in shown]
        status = "approved" if action == "approve" else "discarded"
        for figure in chosen:
            await self.store.review(document.id, figure.figure_id, None, status)
        if status == "approved" and chosen:
            await self.store.enqueue("index_figures", document.id)
        return _redirect(f"/documents/{document.id}/figures?bucket={bucket}")

    async def review_figure(
        self,
        request: Request,
        document_id: str,
        figure_id: str,
        action: FormText = "",
        description: Annotated[str | None, Form()] = None,
    ) -> HTMLResponse:
        document = await self.document_or_404(document_id)
        figure = await self.store.get_figure(document.id, figure_id)
        if figure is None:
            raise HTTPException(404, detail=f"No figure {figure_id!r}")
        if action not in REVIEW_ACTIONS:
            raise HTTPException(400, detail=f"Unknown action {action!r}")
        text = figure.final_description if description is None else description
        if action == "approve" and not text.strip():
            return self.partial(
                request,
                "_figure_card.html",
                422,
                d=document,
                f=figure,
                error="Write a description before approving this figure.",
            )
        was_approved = figure.review_status == "approved"
        if action == "reset":
            await self.store.review(
                document.id,
                figure_id,
                figure.generated_description,
                "pending_review",
            )
        else:
            status = "approved" if action == "approve" else "discarded"
            await self.store.review(document.id, figure_id, description, status)
        if was_approved or action == "approve":
            await self.store.enqueue("index_figures", document.id)
        updated = await self.store.get_figure(document.id, figure_id)
        assert updated is not None
        return self.partial(
            request,
            "_figure_moved.html",
            d=document,
            figure=updated,
            label=BUCKET_LABELS[figure_bucket(updated)],
        )

    # Topics

    async def topic_cards(self) -> list[dict[str, Any]]:
        documents = await self.store.list_documents()
        counts = Counter(t for d in documents for t in d.topic_ids)
        return [
            _topic_context(t, self.places, count=counts[t.id])
            for t in await self.store.list_topics()
        ]

    def topic_form(
        self, request: Request, form: dict[str, str], creating: bool, error: str
    ) -> HTMLResponse:
        return self.partial(
            request,
            "_topic_form.html",
            422,
            card={"form": form, "place": None, "count": 0},
            creating=creating,
            error=error,
        )

    async def topics_page(self, request: Request) -> HTMLResponse:
        return await self.page(
            request,
            "topics.html",
            current="topics",
            cards=await self.topic_cards(),
            new={"form": _topic_values("", "", "", ""), "place": None, "count": 0},
        )

    async def create_topic(
        self,
        request: Request,
        id: FormText = "",
        name: FormText = "",
        aliases: FormText = "",
        place_id: FormText = "",
    ) -> HTMLResponse:
        form = _topic_values(id, name, aliases, place_id)
        form["id"] = form["id"] or slugify(form["name"])
        error = _topic_error(form, self.places)
        if not error and await self.store.get_topic(form["id"]) is not None:
            error = f"A topic with id {form['id']!r} already exists."
        if error:
            return self.topic_form(request, form, creating=True, error=error)
        await self.store.upsert_topic(_topic(form))
        return _redirect("/topics")

    async def update_topic(
        self,
        request: Request,
        topic_id: str,
        name: FormText = "",
        aliases: FormText = "",
        place_id: FormText = "",
    ) -> HTMLResponse:
        await self.topic_or_404(topic_id)
        form = _topic_values(topic_id, name, aliases, place_id)
        error = _topic_error(form, self.places)
        if error:
            return self.topic_form(request, form, creating=False, error=error)
        await self.store.upsert_topic(_topic(form))
        return _redirect("/topics")

    async def delete_topic(self, topic_id: str) -> HTMLResponse:
        await self.topic_or_404(topic_id)
        # The topic goes from the passages too, or a topic filter would still match.
        for document in await self.store.list_documents(topic_id):
            remaining = [t for t in document.topic_ids if t != topic_id]
            await self.pipeline.set_topics(document.id, remaining)
        await self.store.delete_topic(topic_id)
        return _redirect("/topics")

    # Test a question

    async def ask(
        self,
        request: Request,
        query: FormText = "",
        topic: FormText = "",
        place_id: FormText = "",
    ) -> HTMLResponse:
        try:
            result = await self.search.search(
                query, topic=topic.strip() or None, place_id=place_id.strip() or None
            )
        except Exception as error:
            # What the owner sees is what the MCP tool would have failed with.
            return self.partial(
                request,
                "_ask_results.html",
                result=None,
                error=f"{type(error).__name__}: {error}",
            )
        return self.partial(
            request,
            "_ask_results.html",
            result=result,
            raw=result.model_dump_json(indent=2),
            error="",
        )


def _inside(root: Path, name: str) -> Path | None:
    resolved_root = root.resolve()
    path = (resolved_root / name).resolve()
    if path.parent != resolved_root or not path.is_file():
        return None
    return path


def _is_incoming(path: Path, settings: DocsSettings) -> bool:
    return path.resolve().parent == incoming_dir(settings).resolve()


def _same_origin(request: Request, host: str) -> bool:
    fetch_site = request.headers.get("sec-fetch-site")
    if fetch_site is not None and fetch_site not in TRUSTED_FETCH_SITES:
        return False
    origin = request.headers.get("origin")
    return origin is None or urlsplit(origin).netloc == host


def _redirect(url: str) -> HTMLResponse:
    return HTMLResponse("", headers={"HX-Redirect": url})


def _title_error(title: str) -> str:
    if not title:
        return "A title can't be empty."
    if len(title) > MAX_TITLE_CHARS:
        return f"Keep the title under {MAX_TITLE_CHARS} characters."
    return ""


def _details(document: Document) -> dict[str, Any]:
    return {
        "title": document.title,
        "authors_year": document.authors_year,
        "topic_ids": list(document.topic_ids),
    }


def _summary_context(document: Document) -> dict[str, str]:
    return {
        "text": document.summary,
        "status": document.summary_status,
        "label": SUMMARY_LABELS[document.summary_status],
        "error": "",
    }


def _topic_values(
    topic_id: str, name: str, aliases: str, place_id: str
) -> dict[str, str]:
    return {
        "id": topic_id.strip(),
        "name": name.strip(),
        "aliases": ", ".join(split_aliases(aliases)),
        "place_id": place_id.strip(),
    }


def _topic_error(form: dict[str, str], places: Places) -> str:
    if not form["name"]:
        return "A topic needs a name."
    if not is_slug(form["id"]):
        return (
            f"Invalid topic id {form['id']!r}: use lowercase letters, digits and "
            "hyphens, such as oil-and-gas."
        )
    if form["place_id"] and places.get(form["place_id"]) is None:
        return (
            f"No place of the Ecuador module has the id {form['place_id']!r}. "
            "Use a place_id as find_places returns it, such as protected_area:Yasuní."
        )
    return ""


def _topic(form: dict[str, str]) -> Topic:
    return Topic(
        id=form["id"],
        name=form["name"],
        aliases=split_aliases(form["aliases"]),
        place_id=form["place_id"] or None,
    )


def _topic_context(topic: Topic, places: Places, count: int) -> dict[str, Any]:
    return {
        "form": {
            "id": topic.id,
            "name": topic.name,
            "aliases": ", ".join(topic.aliases),
            "place_id": topic.place_id or "",
        },
        "place": places.get(topic.place_id) if topic.place_id else None,
        "count": count,
    }
