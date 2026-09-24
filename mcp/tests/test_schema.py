import json
from importlib.resources import files
from pathlib import Path

import pytest
from pydantic import ValidationError

from mcp_server.catalogue import load_document
from mcp_server.catalogue.cli import (
    EXAMPLE_FILE,
    SCHEMA_FILE,
    catalogue_schema,
    exported_catalogue,
)
from tests.test_models import curated

EXAMPLE = Path(__file__).parents[1] / "examples" / "catalogue.json"


def test_the_cli_writes_the_example_where_the_tests_read_it() -> None:
    assert EXAMPLE_FILE.resolve() == EXAMPLE.resolve()


def test_the_committed_schema_matches_the_model() -> None:
    committed = json.loads(
        files("mcp_server.catalogue").joinpath(SCHEMA_FILE).read_text("utf-8")
    )
    assert committed == catalogue_schema(), (
        f"{SCHEMA_FILE} is stale: run `uv run amazonia360-mcp-catalogue schema`"
    )


def test_the_schema_describes_the_whole_catalogue_export() -> None:
    schema = catalogue_schema()
    assert schema["$schema"] == "https://json-schema.org/draft/2020-12/schema"
    assert set(schema["required"]) == {"locale", "generated_at", "indicators"}
    assert "every change" in schema["description"]
    assert schema["additionalProperties"] is False


def test_proposals_are_marked_for_the_cms_team() -> None:
    defs = catalogue_schema()["$defs"]
    indicator = defs["IndicatorMetadata"]["properties"]
    for field in ("category_field", "documented_count"):
        assert "Proposal" in indicator[field]["description"]
    assert "Proposal" in defs["Sync"]["properties"]["published_count"]["description"]


def test_computed_fields_are_not_asked_of_the_cms() -> None:
    indicator = catalogue_schema()["$defs"]["IndicatorMetadata"]
    assert "available" not in indicator["properties"]
    assert indicator["additionalProperties"] is False


def test_the_committed_example_is_the_current_export() -> None:
    committed = json.loads(EXAMPLE.read_text("utf-8"))
    assert committed == exported_catalogue(), (
        "examples/catalogue.json is stale: run "
        "`uv run amazonia360-mcp-catalogue sync` (or `export --out` after hand edits)"
    )


def test_the_example_loads_as_the_cms_export_will() -> None:
    document = load_document(json.loads(EXAMPLE.read_text("utf-8")))
    assert len(document.indicators) == 13


def test_a_document_with_duplicate_ids_is_rejected() -> None:
    raw = {
        "locale": "en",
        "generated_at": "2026-09-24T00:00:00Z",
        "indicators": [curated(), curated()],
    }
    with pytest.raises(ValidationError, match="210"):
        load_document(raw)


def test_a_document_in_another_locale_is_rejected() -> None:
    raw = {"locale": "es", "generated_at": "2026-09-24T00:00:00Z", "indicators": []}
    with pytest.raises(ValidationError, match="locale"):
        load_document(raw)
