from datetime import datetime
from typing import Any

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    MetaData,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

SCHEMA = "mcp"
_CLIENT = f"{SCHEMA}.clients.client_id"


class Base(DeclarativeBase):
    metadata = MetaData(schema=SCHEMA)


class Client(Base):
    __tablename__ = "clients"

    client_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    client_info: Mapped[dict[str, Any]] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class PendingAuthorization(Base):
    __tablename__ = "pending_authorizations"

    id_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    client_id: Mapped[str] = mapped_column(ForeignKey(_CLIENT, ondelete="CASCADE"))
    redirect_uri: Mapped[str] = mapped_column(Text)
    redirect_uri_provided_explicitly: Mapped[bool]
    code_challenge: Mapped[str] = mapped_column(String(128))
    scopes: Mapped[list[str]] = mapped_column(JSONB)
    resource: Mapped[str | None] = mapped_column(Text)
    client_state: Mapped[str | None] = mapped_column(Text)
    email: Mapped[str | None] = mapped_column(Text)
    csrf_hash: Mapped[str | None] = mapped_column(String(64))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)


class Code(Base):
    __tablename__ = "codes"

    code_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    client_id: Mapped[str] = mapped_column(ForeignKey(_CLIENT, ondelete="CASCADE"))
    redirect_uri: Mapped[str] = mapped_column(Text)
    redirect_uri_provided_explicitly: Mapped[bool]
    code_challenge: Mapped[str] = mapped_column(String(128))
    scopes: Mapped[list[str]] = mapped_column(JSONB)
    resource: Mapped[str | None] = mapped_column(Text)
    email: Mapped[str] = mapped_column(Text)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)


class Token(Base):
    __tablename__ = "tokens"
    __table_args__ = (
        CheckConstraint("kind IN ('access', 'refresh')", name="tokens_kind"),
    )

    token_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    kind: Mapped[str] = mapped_column(String(7))
    family: Mapped[str] = mapped_column(String(32), index=True)
    client_id: Mapped[str] = mapped_column(ForeignKey(_CLIENT, ondelete="CASCADE"))
    email: Mapped[str] = mapped_column(Text)
    scopes: Mapped[list[str]] = mapped_column(JSONB)
    resource: Mapped[str | None] = mapped_column(Text)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)


class AllowedEmail(Base):
    __tablename__ = "allowed_emails"
    # Tokens are matched to this table by exact email, so a row typed by hand in
    # SQL must be in the same form as the ones the CLI writes.
    __table_args__ = (
        CheckConstraint(
            "email = lower(btrim(email))", name="allowed_emails_normalised"
        ),
    )

    email: Mapped[str] = mapped_column(Text, primary_key=True)
    added_by: Mapped[str | None] = mapped_column(Text)
    added_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
