from collections.abc import Sequence
from dataclasses import replace
from typing import Any

from sqlalchemy import delete, func, insert, select, text, update
from sqlalchemy.dialects.postgresql import distinct_on
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from mcp_server.documents.models import (
    DOCUMENT_STATUSES,
    DOCUMENT_TYPES,
    FIGURE_STATUSES,
    JOB_KINDS,
    SUMMARY_STATUSES,
    Document,
    Figure,
    Job,
    Topic,
)
from mcp_server.documents.tables import (
    DocumentRow,
    DocumentTopicRow,
    FigureRow,
    JobRow,
    TopicRow,
)

DECORATIVE = "DECORATIVE"
INTERRUPTED = "Interrupted: document search stopped while this job ran. Re-run it."

_FIGURE_FIELDS = (
    "figure_id",
    "document_id",
    "image_path",
    "image_hash",
    "section_path",
    "page",
    "context",
    "generated_description",
    "final_description",
    "review_status",
    "width",
    "height",
    "ocr_text",
)
_DOCUMENT_FIELDS = (
    "type",
    "title",
    "origin",
    "authors_year",
    "status",
    "error_message",
    "chunk_count",
    "figure_count",
    "summary",
    "summary_status",
)


class DocumentStore:
    """Topics, documents, figure reviews and the job queue, in Postgres. Passages
    and vectors live in the vector index."""

    def __init__(self, sessions: async_sessionmaker[AsyncSession]) -> None:
        self._sessions = sessions

    async def upsert_topic(self, topic: Topic) -> None:
        values = {
            "name": topic.name,
            "aliases": list(topic.aliases),
            "place_id": topic.place_id,
        }
        async with self._sessions() as session:
            await session.execute(
                pg_insert(TopicRow)
                .values(id=topic.id, **values)
                .on_conflict_do_update(index_elements=[TopicRow.id], set_=values)
            )
            await session.commit()

    async def delete_topic(self, topic_id: str) -> None:
        async with self._sessions() as session:
            await session.execute(delete(TopicRow).where(TopicRow.id == topic_id))
            await session.commit()

    async def get_topic(self, topic_id: str) -> Topic | None:
        async with self._sessions() as session:
            row = await session.get(TopicRow, topic_id)
        return _topic(row) if row else None

    async def list_topics(self) -> list[Topic]:
        async with self._sessions() as session:
            rows = await session.scalars(select(TopicRow).order_by(TopicRow.id))
            return [_topic(row) for row in rows]

    async def upsert_document(self, document: Document) -> None:
        _check(document.type, DOCUMENT_TYPES, "document type")
        _check(document.status, DOCUMENT_STATUSES, "document status")
        _check(document.summary_status, SUMMARY_STATUSES, "summary status")
        values = {name: getattr(document, name) for name in _DOCUMENT_FIELDS}
        async with self._sessions() as session:
            await session.execute(
                pg_insert(DocumentRow)
                .values(id=document.id, **values)
                .on_conflict_do_update(
                    index_elements=[DocumentRow.id],
                    set_={**values, "updated_at": func.now()},
                )
            )
            await _link_topics(session, document.id, document.topic_ids)
            await session.commit()

    async def get_document(self, document_id: str) -> Document | None:
        documents = await self._documents(DocumentRow.id == document_id)
        return documents[0] if documents else None

    async def list_documents(self, topic_id: str | None = None) -> list[Document]:
        if topic_id is None:
            return await self._documents()
        tagged = select(DocumentTopicRow.document_id).where(
            DocumentTopicRow.topic_id == topic_id
        )
        return await self._documents(DocumentRow.id.in_(tagged))

    async def set_document_topics(
        self, document_id: str, topic_ids: Sequence[str]
    ) -> None:
        async with self._sessions() as session:
            await _link_topics(session, document_id, topic_ids)
            await session.commit()

    async def set_status(self, document_id: str, status: str, error: str = "") -> None:
        _check(status, DOCUMENT_STATUSES, "document status")
        await self._update_document(document_id, status=status, error_message=error)

    async def set_counts(self, document_id: str, chunks: int, figures: int) -> None:
        await self._update_document(
            document_id, chunk_count=chunks, figure_count=figures
        )

    async def set_details(
        self, document_id: str, title: str, authors_year: str
    ) -> None:
        """Only what the owner edits, so a running job's status is not overwritten."""
        await self._update_document(document_id, title=title, authors_year=authors_year)

    async def set_summary(self, document_id: str, text: str, status: str) -> None:
        _check(status, SUMMARY_STATUSES, "summary status")
        await self._update_document(document_id, summary=text, summary_status=status)

    async def delete_document(self, document_id: str) -> None:
        async with self._sessions() as session:
            await session.execute(
                delete(DocumentRow).where(DocumentRow.id == document_id)
            )
            await session.commit()

    async def replace_figures(
        self, document_id: str, figures: Sequence[Figure]
    ) -> None:
        async with self._sessions() as session:
            rows = await session.scalars(
                select(FigureRow).where(FigureRow.document_id == document_id)
            )
            # Matched by image hash: a re-run may renumber figures but not redraw them.
            previous = {row.image_hash: _figure(row) for row in rows}
            merged = [_merge(f, previous.get(f.image_hash)) for f in figures]
            await session.execute(
                delete(FigureRow).where(FigureRow.document_id == document_id)
            )
            if merged:
                await session.execute(
                    insert(FigureRow),
                    [
                        {
                            "ordinal": ordinal,
                            **{n: getattr(f, n) for n in _FIGURE_FIELDS},
                            "document_id": document_id,
                        }
                        for ordinal, f in enumerate(merged)
                    ],
                )
            await session.commit()

    async def list_figures(self, document_id: str) -> list[Figure]:
        async with self._sessions() as session:
            rows = await session.scalars(
                select(FigureRow)
                .where(FigureRow.document_id == document_id)
                .order_by(FigureRow.ordinal)
            )
            return [_figure(row) for row in rows]

    async def get_figure(self, document_id: str, figure_id: str) -> Figure | None:
        async with self._sessions() as session:
            row = await session.get(FigureRow, (document_id, figure_id))
        return _figure(row) if row else None

    async def set_generated(self, document_id: str, figure_id: str, text: str) -> None:
        figure = await self._require_figure(document_id, figure_id)
        status = figure.review_status
        if text.strip() == DECORATIVE and status == "pending_review":
            status = "discarded"
        await self._update_figure(
            document_id,
            figure_id,
            generated_description=text,
            final_description=(
                figure.final_description if _is_owner_edit(figure) else text
            ),
            review_status=status,
        )

    async def set_ocr(self, document_id: str, figure_id: str, text: str) -> None:
        await self._require_figure(document_id, figure_id)
        await self._update_figure(document_id, figure_id, ocr_text=text)

    async def review(
        self,
        document_id: str,
        figure_id: str,
        description: str | None,
        status: str,
    ) -> None:
        """`description` None keeps the current final description."""
        _check(status, FIGURE_STATUSES, "review status")
        figure = await self._require_figure(document_id, figure_id)
        await self._update_figure(
            document_id,
            figure_id,
            review_status=status,
            final_description=(
                figure.final_description if description is None else description
            ),
        )

    async def approved_figures(self, document_id: str) -> list[Figure]:
        return [
            f
            for f in await self.list_figures(document_id)
            if f.review_status == "approved" and f.final_description.strip()
        ]

    async def enqueue(
        self, kind: str, document_id: str, payload: dict[str, Any] | None = None
    ) -> Job:
        _check(kind, JOB_KINDS, "job kind")
        async with self._sessions() as session:
            # A queued job of the same kind will see the latest state when it runs;
            # it takes the newest payload (e.g. the file uploaded last). The partial
            # unique index lets only one of two concurrent requests insert; the
            # loser selects the winner's row on the next pass.
            while True:
                row = await session.scalar(
                    select(JobRow)
                    .where(
                        JobRow.kind == kind,
                        JobRow.document_id == document_id,
                        JobRow.status == "queued",
                    )
                    .with_for_update()
                )
                if row is not None:
                    if payload is not None:
                        row.payload = payload
                    break
                row = (
                    await session.execute(
                        pg_insert(JobRow)
                        .values(
                            kind=kind, document_id=document_id, payload=payload or {}
                        )
                        .on_conflict_do_nothing(
                            index_elements=[JobRow.kind, JobRow.document_id],
                            index_where=text("status = 'queued'"),
                        )
                        .returning(JobRow)
                    )
                ).scalar_one_or_none()
                if row is not None:
                    break
            job = _job(row)
            await session.commit()
        return job

    async def claim_next(self) -> Job | None:
        async with self._sessions() as session:
            row = await session.scalar(
                select(JobRow)
                .where(JobRow.status == "queued")
                .order_by(JobRow.id)
                .limit(1)
                .with_for_update(skip_locked=True)
            )
            if row is None:
                return None
            row.status = "running"
            job = _job(row)
            await session.commit()
        return job

    async def get_job(self, job_id: int) -> Job | None:
        async with self._sessions() as session:
            row = await session.get(JobRow, job_id)
        return _job(row) if row else None

    async def set_progress(self, job_id: int, progress: int, total: int) -> None:
        await self._update_job(job_id, progress=progress, total=total)

    async def finish(self, job_id: int) -> None:
        await self._update_job(job_id, status="done")

    async def fail(self, job_id: int, message: str) -> None:
        await self._update_job(job_id, status="error", error_message=message)

    async def active_jobs(self, document_id: str | None = None) -> list[Job]:
        query = select(JobRow).where(JobRow.status.in_(("queued", "running")))
        if document_id is not None:
            query = query.where(JobRow.document_id == document_id)
        async with self._sessions() as session:
            rows = await session.scalars(query.order_by(JobRow.id))
            return [_job(row) for row in rows]

    async def latest_jobs(self, document_ids: Sequence[str]) -> dict[str, list[Job]]:
        """The newest job of each kind, per document: a later job of another kind
        must not hide that figure descriptions failed."""
        if not document_ids:
            return {}
        async with self._sessions() as session:
            rows = await session.scalars(
                select(JobRow)
                .where(JobRow.document_id.in_(list(document_ids)))
                .ext(distinct_on(JobRow.document_id, JobRow.kind))
                .order_by(JobRow.document_id, JobRow.kind, JobRow.id.desc())
            )
            latest: dict[str, list[Job]] = {}
            for row in rows:
                latest.setdefault(row.document_id, []).append(_job(row))
        for jobs in latest.values():
            jobs.sort(key=lambda job: job.id)
        return latest

    async def recover_interrupted(self) -> int:
        """Fails the jobs a stopped process left running, and the documents they
        left processing, so neither looks busy forever."""
        async with self._sessions() as session:
            document_ids = (
                await session.scalars(
                    update(JobRow)
                    .where(JobRow.status == "running")
                    .values(status="error", error_message=INTERRUPTED)
                    .returning(JobRow.document_id)
                )
            ).all()
            await session.execute(
                update(DocumentRow)
                .where(
                    DocumentRow.id.in_(document_ids),
                    DocumentRow.status == "processing",
                )
                .values(status="error", error_message=INTERRUPTED)
            )
            await session.commit()
        return len(document_ids)

    async def _documents(self, *where: Any) -> list[Document]:
        async with self._sessions() as session:
            rows = (
                await session.scalars(
                    select(DocumentRow).where(*where).order_by(DocumentRow.id)
                )
            ).all()
            tags = await session.execute(
                select(DocumentTopicRow.document_id, DocumentTopicRow.topic_id)
                .where(DocumentTopicRow.document_id.in_([r.id for r in rows]))
                .order_by(DocumentTopicRow.topic_id)
            )
            topics: dict[str, list[str]] = {}
            for document_id, topic_id in tags:
                topics.setdefault(document_id, []).append(topic_id)
        return [_document(row, tuple(topics.get(row.id, ()))) for row in rows]

    async def _update_document(self, document_id: str, **values: Any) -> None:
        async with self._sessions() as session:
            await session.execute(
                update(DocumentRow)
                .where(DocumentRow.id == document_id)
                .values(**values)
            )
            await session.commit()

    async def _update_figure(
        self, document_id: str, figure_id: str, **values: Any
    ) -> None:
        async with self._sessions() as session:
            await session.execute(
                update(FigureRow)
                .where(
                    FigureRow.document_id == document_id,
                    FigureRow.figure_id == figure_id,
                )
                .values(**values)
            )
            await session.commit()

    async def _update_job(self, job_id: int, **values: Any) -> None:
        async with self._sessions() as session:
            await session.execute(
                update(JobRow).where(JobRow.id == job_id).values(**values)
            )
            await session.commit()

    async def _require_figure(self, document_id: str, figure_id: str) -> Figure:
        figure = await self.get_figure(document_id, figure_id)
        if figure is None:
            raise KeyError(f"Unknown figure {figure_id!r} in {document_id!r}")
        return figure


async def _link_topics(
    session: AsyncSession, document_id: str, topic_ids: Sequence[str]
) -> None:
    wanted = sorted(set(topic_ids))
    known = set(
        await session.scalars(select(TopicRow.id).where(TopicRow.id.in_(wanted)))
    )
    if missing := [t for t in wanted if t not in known]:
        raise ValueError(f"Unknown topics: {missing}")
    if await session.get(DocumentRow, document_id) is None:
        raise ValueError(f"Unknown document: {document_id!r}")
    await session.execute(
        delete(DocumentTopicRow).where(DocumentTopicRow.document_id == document_id)
    )
    if wanted:
        await session.execute(
            insert(DocumentTopicRow),
            [{"document_id": document_id, "topic_id": t} for t in wanted],
        )


def _check(value: str, allowed: tuple[str, ...], what: str) -> None:
    if value not in allowed:
        raise ValueError(f"Invalid {what} {value!r}; expected one of {allowed}")


def _merge(figure: Figure, reviewed: Figure | None) -> Figure:
    # Reviewer decisions survive re-ingestion; everything else is regenerated.
    if reviewed and not figure.generated_description:
        # Same image hash, same picture: re-describing it would only cost model time.
        figure = replace(figure, generated_description=reviewed.generated_description)
    if reviewed and figure.ocr_text is None:
        figure = replace(figure, ocr_text=reviewed.ocr_text)
    if reviewed and _is_decision(reviewed):
        figure = replace(
            figure,
            final_description=reviewed.final_description,
            review_status=reviewed.review_status,
        )
    elif figure.generated_description.strip() == DECORATIVE:
        figure = replace(figure, review_status="discarded")
    if reviewed and _is_owner_edit(reviewed):
        figure = replace(figure, final_description=reviewed.final_description)
    if not figure.final_description:
        figure = replace(figure, final_description=figure.generated_description)
    return figure


def _is_decision(figure: Figure) -> bool:
    auto_discarded = (
        figure.review_status == "discarded"
        and figure.final_description.strip() == DECORATIVE
    )
    return figure.review_status != "pending_review" and not auto_discarded


def _is_owner_edit(figure: Figure) -> bool:
    final = figure.final_description.strip()
    return bool(final) and final != figure.generated_description.strip()


def _topic(row: TopicRow) -> Topic:
    return Topic(row.id, row.name, tuple(row.aliases), row.place_id)


def _document(row: DocumentRow, topic_ids: tuple[str, ...]) -> Document:
    values = {name: getattr(row, name) for name in _DOCUMENT_FIELDS}
    return Document(id=row.id, topic_ids=topic_ids, **values)


def _figure(row: FigureRow) -> Figure:
    return Figure(**{name: getattr(row, name) for name in _FIGURE_FIELDS})


def _job(row: JobRow) -> Job:
    return Job(
        id=row.id,
        kind=row.kind,
        document_id=row.document_id,
        payload=dict(row.payload),
        status=row.status,
        progress=row.progress,
        total=row.total,
        error_message=row.error_message,
    )
