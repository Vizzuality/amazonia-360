import asyncio

import pytest
from mcp.shared.auth import OAuthClientInformationFull
from pydantic import AnyUrl

from mcp_server.auth.store import AuthStore, Grant
from mcp_server.db import create_engine, session_maker
from mcp_server.db.migrate import main
from tests.auth_helpers import ANA, CLAUDE

pytestmark = pytest.mark.db


@pytest.fixture
def db(clean_database: str, monkeypatch: pytest.MonkeyPatch) -> str:
    monkeypatch.setenv("MCP_DATABASE_URL", clean_database)
    return clean_database


def run(capsys: pytest.CaptureFixture, *argv: str) -> str:
    main(list(argv))
    return capsys.readouterr().out


def issue_tokens(url: str, email: str) -> None:
    async def go() -> None:
        engine = create_engine(url)
        store = AuthStore(session_maker(engine))
        await store.save_client(
            OAuthClientInformationFull(
                client_id="client-1",
                redirect_uris=[AnyUrl(CLAUDE)],
                token_endpoint_auth_method="none",
            )
        )
        await store.issue(Grant("client-1", email, ["mcp"], None))
        await engine.dispose()

    asyncio.run(go())


def test_allow_adds_a_normalised_email_once(
    db: str, capsys: pytest.CaptureFixture
) -> None:
    out = run(capsys, "allow", " Ana@Example.org ", "--by", "miguel")
    assert out == f"Added {ANA}.\n"
    out = run(capsys, "allow", ANA)
    assert out == f"{ANA} was already on the allowlist.\n"
    [line] = run(capsys, "list").splitlines()
    email, added_by, added_at = line.split("\t")
    assert (email, added_by) == (ANA, "miguel")
    assert added_at.startswith("20")


def test_allow_records_the_os_user_by_default(
    db: str, capsys: pytest.CaptureFixture, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr("getpass.getuser", lambda: "ops")
    run(capsys, "allow", ANA)
    [line] = run(capsys, "list").splitlines()
    assert line.split("\t")[1] == "ops"


def test_allow_refuses_what_is_not_an_email(
    db: str, capsys: pytest.CaptureFixture
) -> None:
    with pytest.raises(SystemExit) as exc:
        main(["allow", "ana@example"])
    assert "not an email address" in str(exc.value.code)
    assert run(capsys, "list") == "The allowlist is empty.\n"


def test_revoke_removes_the_email_and_says_its_tokens_are_gone(
    db: str, capsys: pytest.CaptureFixture
) -> None:
    run(capsys, "allow", ANA)
    issue_tokens(db, ANA)
    out = run(capsys, "revoke", "ANA@example.org")
    assert out == (
        f"Removed {ANA}; deleted 2 tokens and 0 codes, so access ends now.\n"
    )
    assert run(capsys, "list") == "The allowlist is empty.\n"


def test_revoking_an_email_off_the_list_says_so(
    db: str, capsys: pytest.CaptureFixture
) -> None:
    out = run(capsys, "revoke", ANA)
    assert out == f"{ANA} was not on the allowlist; deleted 0 tokens and 0 codes.\n"


def test_the_commands_need_the_database_url(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.delenv("MCP_DATABASE_URL", raising=False)
    with pytest.raises(SystemExit, match="MCP_DATABASE_URL"):
        main(["list"])
