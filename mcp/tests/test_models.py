from typing import Any

import pytest
from pydantic import ValidationError

from mcp_server.catalogue.models import CuratedIndicator, IndicatorMetadata, Sync


def curated(**overrides: Any) -> dict[str, Any]:
    base: dict[str, Any] = {
        "id": 210,
        "name": "Ecosystems (Ecuador module)",
        "unit": "ha",
        "subtopic": 5,
        "country": "ECU",
        "resource": {
            "type": "feature",
            "url": "https://example.test/arcgis/rest/services/eco/FeatureServer",
            "layer_id": 0,
        },
        "value_type": "categorical",
        "aggregation": "sum",
        "ai_answerable": True,
        "category_field": "Ecosistema",
    }
    return {**base, **overrides}


def indicator(
    sync: dict[str, Any] | None = None, **overrides: Any
) -> IndicatorMetadata:
    ok = {"sync_status": "ok", "queryable_fields": ["Ecosistema"]}
    return IndicatorMetadata.model_validate(
        {**curated(**overrides), "sync": ok if sync is None else sync}
    )


def test_ai_answerable_defaults_to_false_as_in_the_contract() -> None:
    raw = curated()
    del raw["ai_answerable"]
    assert CuratedIndicator.model_validate(raw).ai_answerable is False


def test_unknown_fields_are_rejected() -> None:
    with pytest.raises(ValidationError, match="extra"):
        CuratedIndicator.model_validate(curated(valu_type="categorical"))


def test_the_curated_file_cannot_carry_sync_fields() -> None:
    with pytest.raises(ValidationError, match="sync"):
        CuratedIndicator.model_validate(curated(sync={"sync_status": "ok"}))


def test_values_outside_the_contract_vocabulary_are_rejected() -> None:
    with pytest.raises(ValidationError, match="value_type"):
        CuratedIndicator.model_validate(curated(value_type="hectares"))


def test_available_needs_a_resource_and_a_clean_sync() -> None:
    assert indicator().available is True
    assert indicator(resource=None).available is False
    assert indicator(sync={"sync_status": "error"}).available is False
    assert indicator(sync={}).available is False


def test_operations_follow_the_value_type() -> None:
    ecosystems = indicator()
    assert ecosystems.allows("presence")
    assert ecosystems.allows("area")
    assert not ecosystems.allows("count")
    restoration = indicator(value_type="count", category_field="Practica")
    assert restoration.allows("count")
    assert not restoration.allows("area")
    assert not indicator(value_type="ratio").allows("presence")


def test_query_layer_comes_from_resource_and_category_field() -> None:
    layer = indicator().query_layer()
    assert layer is not None
    assert layer.service_url.endswith("/eco/FeatureServer")
    assert layer.layer_id == 0
    assert layer.category_field == "Ecosistema"
    assert indicator(resource=None).query_layer() is None
    assert indicator(category_field=None).query_layer() is None


def test_count_mismatch_compares_documented_and_published() -> None:
    mismatched = indicator(
        documented_count=7, sync={"sync_status": "ok", "published_count": 14137}
    )
    warning = mismatched.count_mismatch()
    assert warning is not None
    assert "7" in warning
    assert "14137" in warning
    matching = indicator(
        documented_count=7, sync={"sync_status": "ok", "published_count": 7}
    )
    assert matching.count_mismatch() is None
    assert indicator(sync={"sync_status": "ok"}).count_mismatch() is None


def test_available_is_serialised_for_tools() -> None:
    assert indicator().model_dump()["available"] is True


def test_sync_dates_parse_from_iso_strings() -> None:
    sync = Sync.model_validate({"layer_last_edit": "2026-08-18T12:37:43.622000Z"})
    assert sync.layer_last_edit is not None
    assert sync.layer_last_edit.year == 2026
