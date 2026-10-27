from pathlib import Path

import pytest

from mcp_server.documents.ingest import cli

ENV = {
    "DOCS_DATABASE_URL": "postgresql://postgres:postgres@localhost:5433/docs",
    "DOCS_QDRANT_URL": "http://localhost:6343",
}


@pytest.fixture
def docs_env(monkeypatch: pytest.MonkeyPatch) -> None:
    for name, value in ENV.items():
        monkeypatch.setenv(name, value)


def test_migrate_upgrades_the_documents_database(
    docs_env: None, monkeypatch: pytest.MonkeyPatch
) -> None:
    upgraded: list[str] = []
    monkeypatch.setattr(cli, "upgrade", upgraded.append)
    cli.main(["migrate"])
    assert upgraded == [ENV["DOCS_DATABASE_URL"]]


def test_without_document_settings_it_says_what_to_set(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.delenv("DOCS_DATABASE_URL", raising=False)
    monkeypatch.delenv("DOCS_QDRANT_URL", raising=False)
    with pytest.raises(SystemExit) as stopped:
        cli.main(["migrate"])
    assert "DOCS_DATABASE_URL" in str(stopped.value)


def test_serve_needs_an_openai_key(
    docs_env: None, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    with pytest.raises(SystemExit) as stopped:
        cli.main(["serve"])
    assert "OPENAI_API_KEY" in str(stopped.value)


def test_serve_binds_to_loopback_on_the_configured_port(
    docs_env: None, monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    pytest.importorskip("fastapi")
    import uvicorn

    monkeypatch.setenv("OPENAI_API_KEY", "sk-test")
    monkeypatch.setenv("DOCS_PORT", "8899")
    monkeypatch.setenv("DOCS_DATA_DIR", str(tmp_path))
    ran: dict[str, object] = {}

    def fake_run(app: object, host: str, port: int, **kwargs: object) -> None:
        ran.update(app=app, host=host, port=port)

    monkeypatch.setattr(uvicorn, "run", fake_run)
    cli.main(["serve"])
    assert (ran["host"], ran["port"]) == ("127.0.0.1", 8899)


def test_a_second_serve_refuses_to_start(
    docs_env: None, monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    monkeypatch.setenv("OPENAI_API_KEY", "sk-test")
    monkeypatch.setenv("DOCS_DATA_DIR", str(tmp_path))
    held = cli.single_instance(tmp_path / cli.LOCK_FILE)
    assert held is not None
    try:
        with pytest.raises(SystemExit) as stopped:
            cli.main(["serve"])
        assert "already running" in str(stopped.value)
    finally:
        held.close()
