import pytest

from mcp_server.catalogue import get_indicator_metadata, list_indicators
from mcp_server.catalogue.models import ALLOWED_OPERATIONS

IN_SCOPE_IDS = {202, 203, 204, 206, 208, 209, 210, 211, 214, 217, 218, 219, 222}
MISCOUNTED_IDS = {204, 208, 214, 217, 219}


def test_lists_the_thirteen_in_scope_layers() -> None:
    assert {i.id for i in list_indicators()} == IN_SCOPE_IDS


def test_filters_by_subtopic() -> None:
    assert {i.id for i in list_indicators(subtopic_id=1)} == {209, 211, 222}


def test_unknown_indicator_is_none() -> None:
    assert get_indicator_metadata(999) is None


def test_carbon_is_listed_as_unavailable() -> None:
    carbon = get_indicator_metadata(206)
    assert carbon is not None
    assert carbon.available is False
    assert carbon.layer is None
    assert carbon.caveats


@pytest.mark.parametrize("indicator_id", sorted(MISCOUNTED_IDS))
def test_miscounted_layers_carry_a_caveat(indicator_id: int) -> None:
    indicator = get_indicator_metadata(indicator_id)
    assert indicator is not None
    assert any("records" in c for c in indicator.caveats)


def test_every_available_layer_is_complete() -> None:
    missing = []
    for i in list_indicators():
        if not i.available:
            continue
        if i.layer is None:
            missing.append((i.id, "layer"))
        if not i.unit:
            missing.append((i.id, "unit"))
        if not i.ai_answerable:
            missing.append((i.id, "ai_answerable"))
    assert missing == []


def test_count_layers_do_not_allow_area() -> None:
    assert "area" not in ALLOWED_OPERATIONS["count"]
    restoration = get_indicator_metadata(202)
    assert restoration is not None
    assert restoration.allows("count")
    assert not restoration.allows("area")


def test_categorical_layers_allow_presence_and_area() -> None:
    ecosystems = get_indicator_metadata(210)
    assert ecosystems is not None
    assert ecosystems.allows("presence")
    assert ecosystems.allows("area")
    assert not ecosystems.allows("count")
