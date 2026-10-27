from datetime import datetime
from typing import Any

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    MetaData,
    Text,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

SCHEMA = "mcp"
_DOCUMENT = f"{SCHEMA}.documents.id"
_TOPIC = f"{SCHEMA}.topics.id"


class DocumentsBase(DeclarativeBase):
    # Its own metadata: the MCP's migrations and these never see each other's tables.
    metadata = MetaData(schema=SCHEMA)


def _created() -> Mapped[datetime]:
    return mapped_column(DateTime(timezone=True), server_default=func.now())


def _updated() -> Mapped[datetime]:
    return mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class TopicRow(DocumentsBase):
    __tablename__ = "topics"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    name: Mapped[str] = mapped_column(Text)
    aliases: Mapped[list[str]] = mapped_column(ARRAY(Text), server_default=text("'{}'"))
    place_id: Mapped[str | None] = mapped_column(Text)


class DocumentRow(DocumentsBase):
    __tablename__ = "documents"
    __table_args__ = (
        CheckConstraint("type IN ('pdf', 'web')", name="documents_type"),
        CheckConstraint(
            "status IN ('pending', 'processing', 'indexed', 'error')",
            name="documents_status",
        ),
        CheckConstraint(
            "summary_status IN ('none', 'pending_review', 'approved')",
            name="documents_summary_status",
        ),
    )

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    type: Mapped[str] = mapped_column(Text)
    title: Mapped[str] = mapped_column(Text)
    origin: Mapped[str] = mapped_column(Text)
    authors_year: Mapped[str] = mapped_column(Text, server_default="")
    status: Mapped[str] = mapped_column(Text, server_default="pending")
    error_message: Mapped[str] = mapped_column(Text, server_default="")
    chunk_count: Mapped[int] = mapped_column(server_default="0")
    figure_count: Mapped[int] = mapped_column(server_default="0")
    summary: Mapped[str] = mapped_column(Text, server_default="")
    summary_status: Mapped[str] = mapped_column(Text, server_default="none")
    created_at: Mapped[datetime] = _created()
    updated_at: Mapped[datetime] = _updated()


class DocumentTopicRow(DocumentsBase):
    __tablename__ = "document_topics"

    document_id: Mapped[str] = mapped_column(
        ForeignKey(_DOCUMENT, ondelete="CASCADE"), primary_key=True
    )
    topic_id: Mapped[str] = mapped_column(
        ForeignKey(_TOPIC, ondelete="CASCADE"), primary_key=True, index=True
    )


class FigureRow(DocumentsBase):
    __tablename__ = "figures"
    __table_args__ = (
        CheckConstraint(
            "review_status IN ('pending_review', 'approved', 'discarded')",
            name="figures_review_status",
        ),
    )

    document_id: Mapped[str] = mapped_column(
        ForeignKey(_DOCUMENT, ondelete="CASCADE"), primary_key=True
    )
    figure_id: Mapped[str] = mapped_column(Text, primary_key=True)
    ordinal: Mapped[int]
    image_path: Mapped[str] = mapped_column(Text)
    image_hash: Mapped[str] = mapped_column(Text)
    section_path: Mapped[str] = mapped_column(Text, server_default="")
    page: Mapped[int | None]
    context: Mapped[str] = mapped_column(Text, server_default="")
    generated_description: Mapped[str] = mapped_column(Text, server_default="")
    final_description: Mapped[str] = mapped_column(Text, server_default="")
    review_status: Mapped[str] = mapped_column(Text, server_default="pending_review")
    width: Mapped[int] = mapped_column(server_default="0")
    height: Mapped[int] = mapped_column(server_default="0")
    ocr_text: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = _created()
    updated_at: Mapped[datetime] = _updated()


class JobRow(DocumentsBase):
    __tablename__ = "jobs"
    __table_args__ = (
        CheckConstraint(
            "status IN ('queued', 'running', 'done', 'error')", name="jobs_status"
        ),
        Index("ix_mcp_jobs_status_id", "status", "id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    kind: Mapped[str] = mapped_column(Text)
    # No foreign key: a delete_document job outlives the row it deletes.
    document_id: Mapped[str] = mapped_column(Text, index=True)
    payload: Mapped[dict[str, Any]] = mapped_column(
        JSONB, server_default=text("'{}'::jsonb")
    )
    status: Mapped[str] = mapped_column(Text, server_default="queued")
    progress: Mapped[int] = mapped_column(server_default="0")
    total: Mapped[int] = mapped_column(server_default="0")
    error_message: Mapped[str] = mapped_column(Text, server_default="")
    created_at: Mapped[datetime] = _created()
    updated_at: Mapped[datetime] = _updated()
