from typing import Any

import pytest

from mcp_server.arcgis.styles import PALETTE, category_styles, join_field


def symbol(r: int, g: int, b: int) -> dict[str, Any]:
    return {
        "type": "esriSFS",
        "color": [r, g, b, 255],
        "outline": {"color": [110, 110, 110, 255], "width": 0.75},
    }


def unique(field: str, infos: list[tuple[str, str, dict[str, Any]]]) -> dict[str, Any]:
    return {
        "type": "uniqueValue",
        "field1": field,
        "uniqueValueInfos": [
            {"value": v, "label": label, "symbol": s} for v, label, s in infos
        ],
    }


# The shape of layer 214's renderer, read on 28 September 2026.
FLOODING = unique(
    "Regimen",
    [
        ("Zonas Inundables", "Zonas Inundables", symbol(227, 26, 28)),
        ("Zonas Inundadas", "Zonas Inundadas", symbol(51, 160, 44)),
    ],
)


def test_a_class_named_by_the_renderer_field_takes_its_symbol() -> None:
    styles = category_styles(FLOODING, "Regimen", ["Zonas Inundadas"])
    assert styles["Zonas Inundadas"] == {
        "fill": "rgba(51,160,44,1.000)",
        "swatch": "#33a02c",
        "outline": "rgba(110,110,110,1.000)",
        "outline_width": 1.0,
        "from_layer": True,
    }


def test_a_class_named_by_a_label_takes_its_symbol() -> None:
    # 210 colours by Codigo_ecosistema, whose labels are the ecosystem names.
    renderer = unique("Codigo", [("E01", "Bosque", symbol(1, 2, 3))])
    assert join_field(renderer, "Ecosistema", ["Bosque"]) is None
    styles = category_styles(renderer, "Ecosistema", ["Bosque"])
    assert styles["Bosque"]["fill"] == "rgba(1,2,3,1.000)"


def test_a_class_with_one_value_of_a_coarser_field_takes_that_colour() -> None:
    # 219 colours biogeographic sectors by region.
    renderer = unique("Region", [("Andes", "Andes", symbol(9, 9, 9))])
    assert join_field(renderer, "Sector", ["Norte"]) == "Region"
    styles = category_styles(renderer, "Sector", ["Norte"], {"Norte": {"Andes"}})
    assert styles["Norte"]["fill"] == "rgba(9,9,9,1.000)"


def test_a_class_split_across_renderer_values_falls_back_to_the_palette() -> None:
    # 211 colours by macrorelief, and each relief class spans several.
    renderer = unique(
        "Macrorel", [("A", "A", symbol(1, 1, 1)), ("B", "B", symbol(2, 2, 2))]
    )
    styles = category_styles(
        renderer, "Relieve", ["Colinado"], {"Colinado": {"A", "B"}}
    )
    assert styles["Colinado"]["from_layer"] is False
    assert styles["Colinado"]["fill"] == PALETTE[0]


def test_a_simple_renderer_gives_every_class_the_same_colour() -> None:
    renderer = {"type": "simple", "symbol": symbol(5, 6, 7)}
    styles = category_styles(renderer, "Estrato", ["Alto", "Bajo"])
    assert styles["Alto"] == styles["Bajo"]
    assert styles["Alto"]["from_layer"] is True


def test_without_a_renderer_each_class_gets_its_own_palette_colour() -> None:
    styles = category_styles(None, "Regimen", ["a", "b"])
    assert [styles["a"]["fill"], styles["b"]["fill"]] == PALETTE[:2]


def test_an_invisible_fill_takes_the_legend_colour() -> None:
    # Layer 210's symbols have an alpha of 2 of 255 (AM-729).
    faint = {"type": "esriSFS", "color": [209, 108, 196, 2]}
    renderer = unique("Ecosistema", [("Bosque", "Bosque", faint)])
    styles = category_styles(renderer, "Ecosistema", ["Bosque"])
    assert styles["Bosque"]["fill"] == "rgba(209,108,196,0.600)"
    assert styles["Bosque"]["swatch"] == "#d16cc4"


def test_a_visible_fill_keeps_the_renderer_alpha() -> None:
    half = {"type": "esriSFS", "color": [209, 108, 196, 128]}
    renderer = unique("Ecosistema", [("Bosque", "Bosque", half)])
    styles = category_styles(renderer, "Ecosistema", ["Bosque"])
    assert styles["Bosque"]["fill"] == "rgba(209,108,196,0.502)"


def one_class(symbol: Any) -> dict[str, Any]:
    renderer = {
        "type": "uniqueValue",
        "field1": "Clase",
        "uniqueValueInfos": [{"value": "A", "label": "A", "symbol": symbol}],
    }
    return category_styles(renderer, "Clase", ["A"])["A"]


@pytest.mark.parametrize(
    "outline", [[1], {"width": "x", "color": "red"}, {"width": float("inf")}]
)
def test_a_malformed_outline_is_drawn_as_none(outline: Any) -> None:
    # The renderer is a third party's JSON; each of these used to raise.
    style = one_class({"color": [0, 100, 0], "outline": outline})
    assert style["fill"] == "rgba(0,100,0,1.000)"
    assert style["outline"] == "rgba(0,0,0,0)"
    assert style["outline_width"] == 0.0


@pytest.mark.parametrize("symbol", [None, "esriSFS", 5])
def test_a_symbol_that_is_not_an_object_falls_back_to_the_palette(
    symbol: Any,
) -> None:
    style = one_class(symbol)
    assert (style["fill"], style["from_layer"]) == (PALETTE[0], False)


@pytest.mark.parametrize(
    "color",
    [
        [None, 0, 0],
        [float("nan"), 0, 0, 255],
        ["12", 0, 0],
        [300, 0, 0],
        {"r": 1},
    ],
)
def test_a_malformed_colour_falls_back_to_the_palette(color: Any) -> None:
    # What _channels promises: anything but 3 or 4 numbers from 0 to 255 is no
    # colour, and the class takes a palette colour the map and the legend both show.
    style = one_class({"color": color})
    assert (style["fill"], style["from_layer"]) == (PALETTE[0], False)
