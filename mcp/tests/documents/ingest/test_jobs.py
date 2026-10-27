import anyio
import pytest

from mcp_server.documents.ingest.jobs import Worker
from mcp_server.documents.ingest.pipeline import Progress
from mcp_server.documents.models import Job
from mcp_server.documents.store import INTERRUPTED

from .conftest import DOCUMENT_ID, Env

pytestmark = [
    pytest.mark.db,
    pytest.mark.anyio,
    pytest.mark.filterwarnings("ignore:Payload indexes have no effect"),
]


async def test_interrupted_job_is_failed_with_a_rerun_message(env: Env) -> None:
    await env.add_pdf()
    upload = env.upload(b"%PDF-1.7 second")
    await env.store.enqueue("ingest_pdf", DOCUMENT_ID, {"path": str(upload)})
    job = await env.store.claim_next()
    assert job is not None
    await env.store.set_status(DOCUMENT_ID, "processing")

    stop = anyio.Event()
    stop.set()
    await Worker(env.store, env.pipeline).run_forever(stop)

    interrupted = await env.store.get_job(job.id)
    assert interrupted is not None
    assert (interrupted.status, interrupted.error_message) == ("error", INTERRUPTED)
    assert "Re-run" in INTERRUPTED
    document = await env.store.get_document(DOCUMENT_ID)
    assert document is not None
    assert (document.status, document.error_message) == ("error", INTERRUPTED)
    # Its upload is a leftover now: nothing queued will read it.
    assert not upload.exists()


async def test_worker_runs_queued_jobs_until_stopped(env: Env) -> None:
    await env.add_pdf()
    await env.store.review(DOCUMENT_ID, "f1", None, "approved")
    job = await env.store.enqueue("index_figures", DOCUMENT_ID)
    stop = anyio.Event()

    async with anyio.create_task_group() as tasks:
        tasks.start_soon(env.worker.run_forever, stop)
        with anyio.fail_after(5):
            while (done := await env.store.get_job(job.id)) and done.status != "done":
                await anyio.sleep(0.01)
        stop.set()

    assert len(await env.passages("figure")) == 1


async def test_worker_records_the_error_and_moves_on(env: Env) -> None:
    failing = await env.store.enqueue("index_figures", "missing")
    assert await env.worker.run_once()
    failed = await env.store.get_job(failing.id)
    assert failed is not None
    assert (failed.status, failed.error_message) == (
        "error",
        "Unknown document 'missing'",
    )
    assert not await env.worker.run_once()


async def test_worker_reports_progress(env: Env) -> None:
    seen: list[tuple[int, int]] = []

    class Recording:
        async def run(self, job: Job, progress: Progress) -> None:
            await progress(1, 2)
            seen.append((1, 2))

        async def clean_stale_files(self) -> int:
            return 0

    job = await env.store.enqueue("index_summary", DOCUMENT_ID)
    worker = Worker(env.store, Recording())  # type: ignore[arg-type]
    assert await worker.run_once()
    done = await env.store.get_job(job.id)
    assert done is not None
    assert (done.status, done.progress, done.total) == ("done", 1, 2)
    assert seen == [(1, 2)]
