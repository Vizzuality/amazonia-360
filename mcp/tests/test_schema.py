import json
from importlib.resources import files

from mcp_server.catalogue.cli import SCHEMA_FILE, indicator_schema


def test_the_committed_schema_matches_the_model() -> None:
    committed = json.loads(
        files("mcp_server.catalogue").joinpath(SCHEMA_FILE).read_text("utf-8")
    )
    assert committed == indicator_schema(), (
        "indicator.schema.json is stale: run `uv run amazonia360-mcp-catalogue schema`"
    )


def test_proposals_are_marked_for_the_cms_team() -> None:
    schema = indicator_schema()
    properties = schema["properties"]
    for field in ("category_field", "documented_count"):
        assert "Proposal" in properties[field]["description"]
    sync = schema["$defs"]["Sync"]["properties"]
    assert "Proposal" in sync["published_count"]["description"]


def test_computed_fields_are_not_asked_of_the_cms() -> None:
    schema = indicator_schema()
    assert "available" not in schema["properties"]
    assert schema["additionalProperties"] is False


def test_the_schema_declares_its_draft_and_what_it_describes() -> None:
    schema = indicator_schema()
    assert schema["$schema"] == "https://json-schema.org/draft/2020-12/schema"
    assert "publish" in schema["description"]
