import io
import threading
from pathlib import Path

import anyio
import anyio.to_thread
import pytest

from mcp_server.documents.ingest.jobs import Worker
from mcp_server.documents.ingest.pipeline import incoming_dir
from mcp_server.documents.models import Document

from .conftest import DOCUMENT_ID, FIRST_VERSION, Env, FakeFigure, FakeOcr

pytestmark = [
    pytest.mark.db,
    pytest.mark.anyio,
    pytest.mark.filterwarnings("ignore:Payload indexes have no effect"),
]


async def no_progress(done: int, total: int) -> None:
    pass


async def latest_job(env: Env, kind: str) -> tuple[str, str]:
    job = await env.store.latest_job(kind)
    return job.status, job.error_message


async def document(env: Env) -> Document:
    found = await env.store.get_document(DOCUMENT_ID)
    assert found is not None
    return found


async def test_old_passages_stay_searchable_until_the_new_ingest_finishes(
    env: Env,
) -> None:
    await env.add_pdf()
    env.extractor.sections = {"Results": "Oil blocks opened the forest to mining."}
    entered, release = threading.Event(), threading.Event()
    env.extractor.hold = (entered, release)
    await env.store.enqueue(
        "ingest_pdf", DOCUMENT_ID, {"path": str(env.upload(b"%PDF-1.7 second"))}
    )
    job = await env.store.claim_next()
    assert job is not None

    async with anyio.create_task_group() as tasks:
        tasks.start_soon(env.pipeline.run, job, no_progress)
        await anyio.to_thread.run_sync(entered.wait)
        assert FIRST_VERSION["Results"] in await env.searched("roads Napo forest")
        assert (await document(env)).status == "processing"
        release.set()

    texts = [p.text for p in await env.passages("text")]
    assert texts == ["Oil blocks opened the forest to mining."]
    assert len({p.ingest_id for p in await env.passages("text")}) == 1
    stored = env.settings.uploads_dir / f"{DOCUMENT_ID}.pdf"
    assert stored.read_bytes() == b"%PDF-1.7 second"
    assert (await document(env)).status == "indexed"


async def test_a_failed_ingest_keeps_the_previous_version(env: Env) -> None:
    await env.add_pdf()
    before = await document(env)
    env.extractor.error = RuntimeError("Docling could not open the file")
    upload = env.upload(b"%PDF-1.7 broken")
    await env.store.enqueue("ingest_pdf", DOCUMENT_ID, {"path": str(upload)})
    await env.run_all()

    status, message = await latest_job(env, "ingest_pdf")
    assert (status, message) == ("error", "Docling could not open the file")
    after = await document(env)
    assert (after.status, after.error_message) == (
        "error",
        "Docling could not open the file",
    )
    assert after.chunk_count == before.chunk_count
    assert sorted(p.text for p in await env.passages("text")) == sorted(
        FIRST_VERSION.values()
    )
    assert FIRST_VERSION["Results"] in await env.searched("roads Napo forest")
    stored = env.settings.uploads_dir / f"{DOCUMENT_ID}.pdf"
    assert stored.read_bytes() == b"%PDF-1.7 first"
    assert not upload.exists()


async def test_an_ingest_without_text_fails(env: Env) -> None:
    env.extractor.sections = {}
    await env.add_pdf()
    status, message = await latest_job(env, "ingest_pdf")
    assert status == "error"
    assert "No text extracted" in message


async def test_ingest_tags_passages_and_queues_descriptions_and_summary(
    env: Env,
) -> None:
    await env.add_pdf()
    passages = await env.passages("text")
    assert {p.topic_ids for p in passages} == {("forests",)}
    doc = await document(env)
    assert (doc.status, doc.chunk_count, doc.figure_count) == ("indexed", 2, 1)
    assert await latest_job(env, "describe_figures") == ("done", "")
    assert await latest_job(env, "write_summary") == ("done", "")
    assert env.describer.seen == ["f1"]
    [figure] = await env.store.list_figures(DOCUMENT_ID)
    assert figure.ocr_text == "BLOCK 31"
    assert figure.generated_description == "Map of roads and clearings in Results"


async def test_figures_are_searchable_only_after_approval_and_index_figures(
    env: Env,
) -> None:
    await env.add_pdf()
    assert await env.passages("figure") == []

    await env.store.review(DOCUMENT_ID, "f1", None, "approved")
    assert await env.passages("figure") == []

    await env.store.enqueue("index_figures", DOCUMENT_ID)
    await env.run_all()
    [passage] = await env.passages("figure")
    assert passage.text == (
        "Map of roads and clearings in Results\n\nText in the figure: BLOCK 31"
    )
    assert passage.figure_path is not None
    assert passage.figure_path.endswith("f1.png")
    assert passage.topic_ids == ("forests",)
    assert (await document(env)).chunk_count == 3

    # Running it twice never duplicates the figure passage.
    await env.store.enqueue("index_figures", DOCUMENT_ID)
    await env.run_all()
    assert len(await env.passages("figure")) == 1


async def test_a_reingest_keeps_approved_figures_without_describing_them_again(
    env: Env,
) -> None:
    await env.add_pdf()
    await env.store.review(DOCUMENT_ID, "f1", "Roads and clearings, 2010", "approved")
    await env.store.enqueue("index_figures", DOCUMENT_ID)
    await env.run_all()

    await env.ingest(b"%PDF-1.7 second")

    [figure] = await env.store.list_figures(DOCUMENT_ID)
    assert (figure.review_status, figure.final_description) == (
        "approved",
        "Roads and clearings, 2010",
    )
    assert env.describer.seen == ["f1"]
    [passage] = await env.passages("figure")
    assert passage.text.startswith("Roads and clearings, 2010")


async def test_a_failed_description_leaves_the_figure_for_the_next_run(
    env: Env,
) -> None:
    env.extractor.figures = [FakeFigure("f1", "Results"), FakeFigure("f2", "Results")]
    env.describer.failing = {"f1"}
    await env.add_pdf()

    status, message = await latest_job(env, "describe_figures")
    assert status == "error"
    assert "1 of 2 figures could not be described" in message
    figures = {f.figure_id: f for f in await env.store.list_figures(DOCUMENT_ID)}
    assert figures["f1"].generated_description == ""
    assert figures["f2"].generated_description != ""
    assert (await document(env)).status == "indexed"

    env.describer.failing = set()
    await env.store.enqueue("describe_figures", DOCUMENT_ID)
    await env.run_all()
    assert env.describer.seen == ["f1", "f2", "f1"]


async def test_a_figure_that_cannot_be_read_is_left_for_the_next_run(
    env: Env,
) -> None:
    env.extractor.figures = [FakeFigure("f1", "Results"), FakeFigure("f2", "Results")]
    env.ocr_failing = {"f1"}
    await env.add_pdf()

    status, message = await latest_job(env, "describe_figures")
    assert status == "error"
    assert "1 of 2 figures could not be described" in message
    assert "onnxruntime could not run" in message
    figures = {f.figure_id: f for f in await env.store.list_figures(DOCUMENT_ID)}
    assert (figures["f1"].ocr_text, figures["f1"].generated_description) == (None, "")
    assert figures["f2"].ocr_text == "BLOCK 31"
    assert figures["f2"].generated_description != ""
    assert env.describer.seen == ["f2"]

    env.ocr_failing = set()
    await env.store.enqueue("describe_figures", DOCUMENT_ID)
    await env.run_all()
    assert env.describer.seen == ["f2", "f1"]
    assert (await latest_job(env, "describe_figures"))[0] == "done"


async def test_summary_is_related_only_after_approval_and_index_summary(
    env: Env,
) -> None:
    await env.add_pdf()
    doc = await document(env)
    assert doc.summary_status == "pending_review"
    assert doc.summary.startswith("Forest loss along roads")
    [(headings, opening, captions)] = env.summary_writer.calls
    assert headings == ["Abstract", "Results"]
    assert opening == FIRST_VERSION["Abstract"]
    assert captions == ["Figure 1. Roads and clearings"]

    await env.store.enqueue("index_summary", DOCUMENT_ID)
    await env.run_all()
    assert await env.related("forest loss roads Napo", None) == []

    await env.store.set_summary(DOCUMENT_ID, doc.summary, "approved")
    assert await env.related("forest loss roads Napo", None) == []

    await env.store.enqueue("index_summary", DOCUMENT_ID)
    await env.run_all()
    assert await env.related("forest loss roads Napo", None) == [DOCUMENT_ID]


async def test_an_approved_summary_survives_a_reingest(env: Env) -> None:
    await env.add_pdf()
    doc = await document(env)
    await env.store.set_summary(DOCUMENT_ID, "Owner's summary.", "approved")
    await env.store.enqueue("index_summary", DOCUMENT_ID)
    await env.run_all()

    await env.ingest(b"%PDF-1.7 second")

    after = await document(env)
    assert (after.summary, after.summary_status) == ("Owner's summary.", "approved")
    assert len(env.summary_writer.calls) == 1
    assert await env.related("owner summary", None) == [doc.id]


async def test_topic_change_updates_passages_and_summary_payloads(env: Env) -> None:
    await env.add_pdf()
    await env.store.review(DOCUMENT_ID, "f1", None, "approved")
    await env.store.set_summary(DOCUMENT_ID, "Forest loss summary.", "approved")
    for kind in ("index_figures", "index_summary"):
        await env.store.enqueue(kind, DOCUMENT_ID)
    await env.run_all()
    calls = env.embedder.calls

    await env.pipeline.set_topics(DOCUMENT_ID, ["yasuni"])

    assert (await document(env)).topic_ids == ("yasuni",)
    assert {p.topic_ids for p in await env.passages()} == {("yasuni",)}
    assert await env.related("forest loss", ["yasuni"]) == [DOCUMENT_ID]
    assert await env.related("forest loss", ["forests"]) == []
    # The searches above embed their query once each; nothing else was embedded.
    assert env.embedder.calls == calls + 2


async def test_delete_document_removes_passages_summary_file_and_row(
    env: Env,
) -> None:
    await env.add_pdf()
    await env.store.set_summary(DOCUMENT_ID, "Forest loss summary.", "approved")
    await env.store.enqueue("index_summary", DOCUMENT_ID)
    await env.run_all()

    await env.store.enqueue("delete_document", DOCUMENT_ID)
    await env.run_all()

    assert await env.passages() == []
    assert await env.related("forest loss", None) == []
    assert not (env.settings.uploads_dir / f"{DOCUMENT_ID}.pdf").exists()
    assert await env.store.get_document(DOCUMENT_ID) is None
    assert await env.store.list_figures(DOCUMENT_ID) == []


async def test_rerun_without_an_upload_reads_the_stored_copy(env: Env) -> None:
    await env.add_pdf()
    stored = env.settings.uploads_dir / f"{DOCUMENT_ID}.pdf"
    await env.store.enqueue("ingest_pdf", DOCUMENT_ID)
    await env.run_all()
    assert await latest_job(env, "ingest_pdf") == ("done", "")
    assert stored.read_bytes() == b"%PDF-1.7 first"


async def test_stale_uploads_go_except_those_of_queued_jobs(env: Env) -> None:
    await env.add_pdf()
    kept = env.upload(b"%PDF-1.7 waiting")
    orphan = env.upload(b"%PDF-1.7 orphan")
    await env.store.enqueue("ingest_pdf", DOCUMENT_ID, {"path": str(kept)})
    assert await env.pipeline.clean_stale_files() == 1
    assert kept.exists()
    assert not orphan.exists()
    assert list(incoming_dir(env.settings).iterdir()) == [kept]


async def test_web_ingest_reads_sections_and_page_images(
    env: Env, tmp_path: Path
) -> None:
    pytest.importorskip("bs4")
    pytest.importorskip("lxml")
    image = pytest.importorskip("PIL.Image")
    from mcp_server.documents.ingest.pipeline import Pipeline
    from mcp_server.documents.ingest.web import Page

    url = "https://example.org/forest-loss/"
    html = (Path(__file__).parent.parent / "fixtures" / "forest-page.html").read_text()
    buffer = io.BytesIO()
    image.new("RGB", (400, 300), "white").save(buffer, format="PNG")
    fetched: list[tuple[str, str]] = []

    def fetch_image(image_url: str, page_url: str) -> bytes:
        fetched.append((image_url, page_url))
        return buffer.getvalue()

    env.pipeline = Pipeline(
        env.store,
        env.index,
        env.embedder,
        env.describer,
        env.summary_writer,
        env.settings,
        page_fetcher=lambda _: Page(url, "Forest loss", html),
        image_fetcher=fetch_image,
        ocr_factory=lambda: FakeOcr("ZONE A"),
    )
    env.worker = Worker(env.store, env.pipeline)
    await env.store.upsert_document(
        Document(id="maap", type="web", title="", origin=url)
    )
    await env.store.enqueue("ingest_web", "maap")
    await env.run_all()

    doc = await env.store.get_document("maap")
    assert doc is not None
    assert (doc.status, doc.title) == ("indexed", "Forest loss in the Western Amazon")
    passages = await env.index.list_document("maap")
    assert {p.anchor for p in passages} == {"causes", "protection"}
    assert fetched == [(url + "chart.png", url)]
    [figure] = await env.store.list_figures("maap")
    assert figure.section_path.endswith("Causes")
    assert figure.context.startswith("Forest loss by zone")
    assert Path(figure.image_path).parent == env.settings.figures_dir
    assert figure.generated_description != ""
