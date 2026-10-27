import logging

import anyio

from mcp_server.documents.ingest.pipeline import Pipeline
from mcp_server.documents.store import DocumentStore

logger = logging.getLogger(__name__)

POLL_SECONDS = 1.0
ERROR_PAUSE_SECONDS = 5.0


class Worker:
    """Runs one job at a time: extraction and OCR models are too heavy to share
    memory with a second job."""

    def __init__(
        self,
        store: DocumentStore,
        pipeline: Pipeline,
        poll_seconds: float = POLL_SECONDS,
        error_pause: float = ERROR_PAUSE_SECONDS,
    ) -> None:
        self._store = store
        self._pipeline = pipeline
        self._poll_seconds = poll_seconds
        self._error_pause = error_pause

    async def run_once(self) -> bool:
        job = await self._store.claim_next()
        if job is None:
            return False

        async def progress(done: int, total: int) -> None:
            await self._store.set_progress(job.id, done, total)

        try:
            await self._pipeline.run(job, progress)
        except Exception as error:
            logger.exception("job %s (%s) failed", job.id, job.kind)
            await self._store.fail(job.id, str(error) or type(error).__name__)
        else:
            await self._store.finish(job.id)
        return True

    async def run_forever(self, stop: anyio.Event) -> None:
        # A job left running by a stopped process never resumes by itself.
        await self._store.recover_interrupted()
        await self._pipeline.clean_stale_files()
        while not stop.is_set():
            try:
                ran = await self.run_once()
            except Exception:
                # A database blip must not stop the worker: uploads would sit queued
                # while the back office stays up. A job whose finish or fail was lost
                # stays running until a restart marks it interrupted.
                logger.exception("worker could not reach the job queue")
                pause = self._error_pause
            else:
                pause = 0.0 if ran else self._poll_seconds
            if pause:
                with anyio.move_on_after(pause):
                    await stop.wait()
