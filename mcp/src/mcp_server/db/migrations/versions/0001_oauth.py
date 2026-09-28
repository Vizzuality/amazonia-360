"""OAuth clients, pending authorizations, codes and tokens

Revision ID: 0001
Revises:
"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None

SCHEMA = "mcp"
CLIENT = f"{SCHEMA}.clients.client_id"


def _client_fk() -> sa.Column:
    return sa.Column(
        "client_id",
        sa.String(64),
        sa.ForeignKey(CLIENT, ondelete="CASCADE"),
        nullable=False,
    )


def _expiry(table: str) -> None:
    op.create_index(
        f"ix_{SCHEMA}_{table}_expires_at", table, ["expires_at"], schema=SCHEMA
    )


def upgrade() -> None:
    op.create_table(
        "clients",
        sa.Column("client_id", sa.String(64), primary_key=True),
        sa.Column("client_info", JSONB, nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        schema=SCHEMA,
    )
    op.create_table(
        "pending_authorizations",
        sa.Column("id_hash", sa.String(64), primary_key=True),
        _client_fk(),
        sa.Column("redirect_uri", sa.Text, nullable=False),
        sa.Column("redirect_uri_provided_explicitly", sa.Boolean, nullable=False),
        sa.Column("code_challenge", sa.String(128), nullable=False),
        sa.Column("scopes", JSONB, nullable=False),
        sa.Column("resource", sa.Text),
        sa.Column("client_state", sa.Text),
        sa.Column("email", sa.Text),
        sa.Column("csrf_hash", sa.String(64)),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        schema=SCHEMA,
    )
    _expiry("pending_authorizations")
    op.create_table(
        "codes",
        sa.Column("code_hash", sa.String(64), primary_key=True),
        _client_fk(),
        sa.Column("redirect_uri", sa.Text, nullable=False),
        sa.Column("redirect_uri_provided_explicitly", sa.Boolean, nullable=False),
        sa.Column("code_challenge", sa.String(128), nullable=False),
        sa.Column("scopes", JSONB, nullable=False),
        sa.Column("resource", sa.Text),
        sa.Column("email", sa.Text, nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        schema=SCHEMA,
    )
    _expiry("codes")
    op.create_table(
        "tokens",
        sa.Column("token_hash", sa.String(64), primary_key=True),
        sa.Column("kind", sa.String(7), nullable=False),
        sa.Column("family", sa.String(32), nullable=False),
        _client_fk(),
        sa.Column("email", sa.Text, nullable=False),
        sa.Column("scopes", JSONB, nullable=False),
        sa.Column("resource", sa.Text),
        sa.Column("used_at", sa.DateTime(timezone=True)),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("kind IN ('access', 'refresh')", name="tokens_kind"),
        schema=SCHEMA,
    )
    _expiry("tokens")
    op.create_index(f"ix_{SCHEMA}_tokens_family", "tokens", ["family"], schema=SCHEMA)


def downgrade() -> None:
    for table in ("tokens", "codes", "pending_authorizations", "clients"):
        op.drop_table(table, schema=SCHEMA)
