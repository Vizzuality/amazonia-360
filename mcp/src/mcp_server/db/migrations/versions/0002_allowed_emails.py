"""The email allowlist, managed with amazonia360-mcp-db allow and revoke

Revision ID: 0002
Revises: 0001
"""

import sqlalchemy as sa
from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None

SCHEMA = "mcp"


def upgrade() -> None:
    op.create_table(
        "allowed_emails",
        sa.Column("email", sa.Text, primary_key=True),
        sa.Column("added_by", sa.Text),
        sa.Column(
            "added_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.CheckConstraint(
            "email = lower(btrim(email))", name="allowed_emails_normalised"
        ),
        schema=SCHEMA,
    )


def downgrade() -> None:
    op.drop_table("allowed_emails", schema=SCHEMA)
