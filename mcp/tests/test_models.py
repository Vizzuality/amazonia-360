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
        "aggregation": "none",
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


def test_nothing_beyond_identity_is_required_as_in_the_contract() -> None:
    minimal = CuratedIndicator.model_validate(
        {"id": 210, "name": "Ecosystems", "subtopic": 5}
    )
    assert minimal.value_type is None
    assert minimal.resource is None


@pytest.mark.parametrize(
    ("overrides", "sync", "reason"),
    [
        ({"resource": None}, None, "no published resource"),
        ({}, {}, "not synced"),
        ({}, {"sync_status": "error"}, "sync status is error"),
        ({"value_type": None}, None, "no value_type"),
        ({"category_field": None}, None, "no category_field"),
    ],
)
def test_an_incomplete_indicator_says_why_it_is_unavailable(
    overrides: dict[str, Any], sync: dict[str, Any] | None, reason: str
) -> None:
    incomplete = indicator(sync=sync, **overrides)
    assert incomplete.available is False
    assert incomplete.unavailable_reason() == reason
    assert indicator().unavailable_reason() is None


def test_integer_ids_are_not_coerced_from_strings() -> None:
    with pytest.raises(ValidationError, match="id"):
        CuratedIndicator.model_validate(curated(id="210"))
    with pytest.raises(ValidationError, match="layer_id"):
        CuratedIndicator.model_validate(
            curated(resource={"type": "feature", "url": "https://x", "layer_id": "0"})
        )


def test_country_codes_follow_the_client_list() -> None:
    assert CuratedIndicator.model_validate(curated(country=None)).country is None
    with pytest.raises(ValidationError, match="country"):
        CuratedIndicator.model_validate(curated(country="Ecuador"))
    with pytest.raises(ValidationError, match="spatial_coverage"):
        CuratedIndicator.model_validate(curated(spatial_coverage=["XXX"]))


def test_decimals_are_bounded_as_in_the_contract() -> None:
    with pytest.raises(ValidationError, match="decimals"):
        CuratedIndicator.model_validate(curated(decimals=7))


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


def test_record_counts_only_when_documented_and_published_differ() -> None:
    mismatched = indicator(
        documented_count=7, sync={"sync_status": "ok", "published_count": 14137}
    )
    counts = mismatched.record_counts()
    assert counts is not None
    assert (counts.documented, counts.published) == (7, 14137)
    matching = indicator(
        documented_count=7, sync={"sync_status": "ok", "published_count": 7}
    )
    assert matching.record_counts() is None
    assert indicator(sync={"sync_status": "ok"}).record_counts() is None


def test_available_is_serialised_for_tools() -> None:
    assert indicator().model_dump()["available"] is True


def test_sync_dates_parse_from_iso_strings() -> None:
    sync = Sync.model_validate({"layer_last_edit": "2026-08-18T12:37:43.622000Z"})
    assert sync.layer_last_edit is not None
    assert sync.layer_last_edit.year == 2026
