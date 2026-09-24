import json
from importlib.resources import files
from typing import Any

import pytest
from pydantic import ValidationError

from mcp_server.catalogue import (
    CatalogueError,
    build_catalogue,
    get_indicator_metadata,
    list_indicators,
)
from mcp_server.catalogue.models import IndicatorMetadata
from tests.test_models import curated

IN_SCOPE_IDS = {202, 203, 204, 206, 208, 209, 210, 211, 214, 217, 218, 219, 222}


def document(*indicators: dict[str, Any]) -> dict[str, Any]:
    return {"locale": "en", "indicators": list(indicators)}


def snapshot(**syncs: dict[str, Any]) -> dict[str, Any]:
    return {"generated_at": "2026-09-24T00:00:00Z", "indicators": syncs}


class TestBuildCatalogue:
    def test_joins_each_indicator_with_its_sync(self) -> None:
        [indicator] = build_catalogue(
            document(curated()), snapshot(**{"210": {"sync_status": "ok"}})
        )
        assert indicator.sync.sync_status == "ok"
        assert indicator.available is True

    def test_an_indicator_without_a_sync_entry_is_unavailable(self) -> None:
        [indicator] = build_catalogue(document(curated()), snapshot())
        assert indicator.available is False

    def test_rejects_a_curated_file_in_another_locale(self) -> None:
        doc = {**document(curated()), "locale": "es"}
        with pytest.raises(CatalogueError, match="locale"):
            build_catalogue(doc, snapshot())

    def test_rejects_duplicate_ids(self) -> None:
        with pytest.raises(CatalogueError, match="210"):
            build_catalogue(document(curated(), curated()), snapshot())

    def test_rejects_a_sync_entry_with_no_indicator(self) -> None:
        with pytest.raises(CatalogueError, match="999"):
            build_catalogue(document(curated()), snapshot(**{"999": {}}))

    def test_names_the_indicator_that_fails_validation(self) -> None:
        with pytest.raises(ValidationError, match="value_type"):
            build_catalogue(
                document(curated(value_type="hectares")), snapshot(**{"210": {}})
            )


class TestRepositoryData:
    """The committed ecuador.json and snapshot, as the server loads them."""

    def test_lists_the_thirteen_in_scope_layers(self) -> None:
        assert {i.id for i in list_indicators()} == IN_SCOPE_IDS

    def test_filters_by_subtopic(self) -> None:
        assert {i.id for i in list_indicators(subtopic_id=1)} == {209, 211, 222}

    def test_unknown_indicator_is_none(self) -> None:
        assert get_indicator_metadata(999) is None

    def test_every_curated_indicator_has_a_sync_entry(self) -> None:
        raw = json.loads(
            files("mcp_server.catalogue").joinpath("ecuador.snapshot.json").read_text()
        )
        assert set(raw["indicators"]) == {str(i) for i in IN_SCOPE_IDS}

    @pytest.mark.parametrize("indicator", list_indicators(), ids=lambda i: str(i.id))
    def test_every_indicator_is_complete_for_its_tools(
        self, indicator: IndicatorMetadata
    ) -> None:
        missing = [
            field
            for field, ok in [
                ("resource", indicator.resource is not None),
                ("unit", bool(indicator.unit)),
                ("ai_answerable", indicator.ai_answerable),
                ("category_field", indicator.category_field is not None),
            ]
            if not ok
        ]
        assert missing == []

    @pytest.mark.parametrize(
        "indicator",
        [i for i in list_indicators() if i.available],
        ids=lambda i: str(i.id),
    )
    def test_the_category_field_exists_in_the_published_layer(
        self, indicator: IndicatorMetadata
    ) -> None:
        assert indicator.sync.queryable_fields is not None
        assert indicator.category_field in indicator.sync.queryable_fields
