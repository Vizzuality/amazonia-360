from pathlib import Path

from mcp_server.documents.settings import DocsSettings

BASE_ENV = {"DOCS_DATABASE_URL": "postgresql://x/y", "DOCS_QDRANT_URL": "http://q:6343"}


def test_without_database_or_qdrant_there_are_no_settings() -> None:
    assert DocsSettings.from_env({}) is None
    assert DocsSettings.from_env({"DOCS_DATABASE_URL": "postgresql://x/y"}) is None
    assert DocsSettings.from_env({"DOCS_QDRANT_URL": "http://q:6343"}) is None


def test_defaults() -> None:
    settings = DocsSettings.from_env(BASE_ENV)
    assert settings is not None
    assert settings.database_url == "postgresql://x/y"
    assert settings.qdrant_url == "http://q:6343"
    assert settings.public_url == "http://127.0.0.1:8770"
    assert settings.port == 8770
    assert settings.data_dir == Path("var/documents")
    assert settings.uploads_dir == Path("var/documents/uploads")
    assert settings.figures_dir == Path("var/documents/figures")


def test_public_url_loses_its_trailing_slash() -> None:
    settings = DocsSettings.from_env(
        {**BASE_ENV, "DOCS_PUBLIC_URL": "https://docs.example.org/"}
    )
    assert settings is not None
    assert settings.public_url == "https://docs.example.org"


def test_overrides() -> None:
    settings = DocsSettings.from_env(
        {**BASE_ENV, "DOCS_DATA_DIR": "/srv/docs", "DOCS_PORT": "9000"}
    )
    assert settings is not None
    assert settings.data_dir == Path("/srv/docs")
    assert settings.port == 9000
    assert settings.figures_dir == Path("/srv/docs/figures")
