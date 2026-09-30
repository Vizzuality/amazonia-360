from typing import Any

import pytest

from mcp_server.places import Places, normalise
from mcp_server.places.models import Place, PlacesSnapshot

ADMIN1 = "https://example.test/admin1/FeatureServer"
ADMIN2 = "https://example.test/admin2/FeatureServer"
SNAP = "https://example.test/snap/FeatureServer"


def place(
    id: str, name: str, kind: str, province: str | None = None, **extra: Any
) -> dict[str, Any]:
    url = {"province": ADMIN1, "canton": ADMIN2, "protected_area": SNAP}[kind]
    return {
        "id": id,
        "name": name,
        "kind": kind,
        "province": province,
        "category": extra.get("category"),
        "area_ha": extra.get("area_ha", 1000.0),
        "bbox": [-78.0, -1.1, -77.7, -0.9],
        "source": {"url": url, "layer_id": 0, "where": f"name = '{name}'"},
    }


SNAPSHOT = PlacesSnapshot.model_validate(
    {
        "generated_at": "2026-09-30T10:00:00Z",
        "places": [
            place("province:Pastaza", "Pastaza", "province"),
            place("province:Napo", "Napo", "province"),
            place("canton:Napo/Tena", "Tena", "canton", "Napo"),
            place("canton:Pastaza/Pastaza", "Pastaza", "canton", "Pastaza"),
            place("canton:Pastaza/Mejía", "Mejía", "canton", "Pastaza"),
            place("canton:Pichincha/Mejía", "Mejía", "canton", "Pichincha"),
            place("province:Zamora Chinchipe", "Zamora Chinchipe", "province"),
            place(
                "canton:Zamora Chinchipe/Zamora",
                "Zamora",
                "canton",
                "Zamora Chinchipe",
            ),
            place(
                "protected_area:Yasuní",
                "Yasuní",
                "protected_area",
                category="Parque Nacional",
            ),
            place(
                "protected_area:Sumaco Napo-Galeras",
                "Sumaco Napo-Galeras",
                "protected_area",
                category="Parque Nacional",
            ),
        ],
    }
)


@pytest.fixture
def places() -> Places:
    return Places(SNAPSHOT)


def ids(places: Places, query: str, kind: Any = None) -> list[str]:
    return [p.id for p in places.find(query, kind).places]


def test_normalise() -> None:
    assert normalise("  Yasuní\tNational  ") == "yasuni national"


def test_one_canton(places: Places) -> None:
    matches = places.find("Tena")
    assert [p.id for p in matches.places] == ["canton:Napo/Tena"]
    assert matches.note is None


def test_a_province_and_a_canton_share_a_name(places: Places) -> None:
    assert ids(places, "Pastaza") == ["province:Pastaza", "canton:Pastaza/Pastaza"]


def test_two_cantons_in_two_provinces(places: Places) -> None:
    assert ids(places, "Mejia") == ["canton:Pastaza/Mejía", "canton:Pichincha/Mejía"]


def test_match_ignores_case_accents_and_spaces(places: Places) -> None:
    assert ids(places, "  TENA ") == ["canton:Napo/Tena"]
    assert ids(places, "yasuni") == ["protected_area:Yasuní"]


def test_whole_word_matches_come_after_whole_name_matches(places: Places) -> None:
    assert ids(places, "sumaco") == ["protected_area:Sumaco Napo-Galeras"]
    assert ids(places, "napo") == [
        "province:Napo",
        "protected_area:Sumaco Napo-Galeras",
    ]


def test_a_canton_does_not_hide_the_province_that_contains_its_name(
    places: Places,
) -> None:
    # The canton is the whole name, so it comes first.
    assert ids(places, "Zamora") == [
        "canton:Zamora Chinchipe/Zamora",
        "province:Zamora Chinchipe",
    ]


def test_kind_filter_applies_to_whole_name_and_whole_word_matches(
    places: Places,
) -> None:
    assert ids(places, "Pastaza", "canton") == ["canton:Pastaza/Pastaza"]
    assert ids(places, "zamora", "province") == ["province:Zamora Chinchipe"]
    assert ids(places, "napo", "protected_area") == [
        "protected_area:Sumaco Napo-Galeras"
    ]


def test_a_protected_area_named_with_its_category(places: Places) -> None:
    assert ids(places, "Parque Nacional Yasuni") == ["protected_area:Yasuní"]


def test_a_leading_kind_word_is_ignored(places: Places) -> None:
    assert ids(places, "Provincia de Napo")[0] == "province:Napo"
    assert ids(places, "Canton Tena") == ["canton:Napo/Tena"]
    assert ids(places, "Cantón Tena") == ["canton:Napo/Tena"]
    assert ids(places, "provincia del Pastaza")[0] == "province:Pastaza"


def test_no_part_word_match(places: Places) -> None:
    assert ids(places, "ten") == []


def test_several_matches_carry_a_note_to_ask(places: Places) -> None:
    note = places.find("Pastaza").note
    assert note is not None and "ask the user" in note


def test_no_match_names_the_kinds_covered(places: Places) -> None:
    matches = places.find("Guayaquil")
    assert matches.places == []
    assert matches.note is not None
    for kind in ("province", "canton", "protected area"):
        assert kind in matches.note


def test_summary_leaves_the_source_out(places: Places) -> None:
    summary = places.find("Tena").places[0]
    assert "source" not in summary.model_dump()


def test_get(places: Places) -> None:
    found = places.get("canton:Napo/Tena")
    assert isinstance(found, Place) and found.name == "Tena"
    assert places.get("canton:Napo/Nowhere") is None


def test_the_committed_snapshot_loads_with_every_kind() -> None:
    from mcp_server.places import load_places

    loaded = load_places()
    kinds = {p.kind for p in loaded.snapshot.places}
    assert kinds == {"province", "canton", "protected_area"}
