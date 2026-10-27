"""Topics, documents, figures and the job queue of document search

Revision ID: 0001
Revises:
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import ARRAY, JSONB

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None

SCHEMA = "mcp"
DOCUMENT = f"{SCHEMA}.documents.id"
TOPIC = f"{SCHEMA}.topics.id"


def _timestamps() -> list[sa.Column]:
    return [
        sa.Column(
            name,
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        )
        for name in ("created_at", "updated_at")
    ]


def upgrade() -> None:
    op.create_table(
        "topics",
        sa.Column("id", sa.Text, primary_key=True),
        sa.Column("name", sa.Text, nullable=False),
        sa.Column(
            "aliases", ARRAY(sa.Text), server_default=sa.text("'{}'"), nullable=False
        ),
        sa.Column("place_id", sa.Text),
        schema=SCHEMA,
    )
    op.create_table(
        "documents",
        sa.Column("id", sa.Text, primary_key=True),
        sa.Column("type", sa.Text, nullable=False),
        sa.Column("title", sa.Text, nullable=False),
        sa.Column("origin", sa.Text, nullable=False),
        sa.Column("authors_year", sa.Text, server_default="", nullable=False),
        sa.Column("status", sa.Text, server_default="pending", nullable=False),
        sa.Column("error_message", sa.Text, server_default="", nullable=False),
        sa.Column("chunk_count", sa.Integer, server_default="0", nullable=False),
        sa.Column("figure_count", sa.Integer, server_default="0", nullable=False),
        sa.Column("summary", sa.Text, server_default="", nullable=False),
        sa.Column("summary_status", sa.Text, server_default="none", nullable=False),
        *_timestamps(),
        sa.CheckConstraint("type IN ('pdf', 'web')", name="documents_type"),
        sa.CheckConstraint(
            "status IN ('pending', 'processing', 'indexed', 'error')",
            name="documents_status",
        ),
        sa.CheckConstraint(
            "summary_status IN ('none', 'pending_review', 'approved')",
            name="documents_summary_status",
        ),
        schema=SCHEMA,
    )
    op.create_table(
        "document_topics",
        sa.Column(
            "document_id",
            sa.Text,
            sa.ForeignKey(DOCUMENT, ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "topic_id",
            sa.Text,
            sa.ForeignKey(TOPIC, ondelete="CASCADE"),
            primary_key=True,
        ),
        schema=SCHEMA,
    )
    op.create_index(
        f"ix_{SCHEMA}_document_topics_topic_id",
        "document_topics",
        ["topic_id"],
        schema=SCHEMA,
    )
    op.create_table(
        "figures",
        sa.Column(
            "document_id",
            sa.Text,
            sa.ForeignKey(DOCUMENT, ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column("figure_id", sa.Text, primary_key=True),
        sa.Column("ordinal", sa.Integer, nullable=False),
        sa.Column("image_path", sa.Text, nullable=False),
        sa.Column("image_hash", sa.Text, nullable=False),
        sa.Column("section_path", sa.Text, server_default="", nullable=False),
        sa.Column("page", sa.Integer),
        sa.Column("context", sa.Text, server_default="", nullable=False),
        sa.Column("generated_description", sa.Text, server_default="", nullable=False),
        sa.Column("final_description", sa.Text, server_default="", nullable=False),
        sa.Column(
            "review_status", sa.Text, server_default="pending_review", nullable=False
        ),
        sa.Column("width", sa.Integer, server_default="0", nullable=False),
        sa.Column("height", sa.Integer, server_default="0", nullable=False),
        sa.Column("ocr_text", sa.Text),
        *_timestamps(),
        sa.CheckConstraint(
            "review_status IN ('pending_review', 'approved', 'discarded')",
            name="figures_review_status",
        ),
        schema=SCHEMA,
    )
    op.create_table(
        "jobs",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("kind", sa.Text, nullable=False),
        sa.Column("document_id", sa.Text, nullable=False),
        sa.Column(
            "payload",
            JSONB,
            server_default=sa.text("'{}'::jsonb"),
            nullable=False,
        ),
        sa.Column("status", sa.Text, server_default="queued", nullable=False),
        sa.Column("progress", sa.Integer, server_default="0", nullable=False),
        sa.Column("total", sa.Integer, server_default="0", nullable=False),
        sa.Column("error_message", sa.Text, server_default="", nullable=False),
        *_timestamps(),
        sa.CheckConstraint(
            "status IN ('queued', 'running', 'done', 'error')", name="jobs_status"
        ),
        schema=SCHEMA,
    )
    op.create_index("ix_mcp_jobs_status_id", "jobs", ["status", "id"], schema=SCHEMA)
    op.create_index(
        f"ix_{SCHEMA}_jobs_document_id", "jobs", ["document_id"], schema=SCHEMA
    )


def downgrade() -> None:
    for table in ("jobs", "figures", "document_topics", "documents", "topics"):
        op.drop_table(table, schema=SCHEMA)
