from typing import Any

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


def test_the_legend_colour_drops_alpha_as_the_front_end_does() -> None:
    # Layer 210's symbols have an alpha of 2 of 255.
    faint = {"type": "esriSFS", "color": [209, 108, 196, 2]}
    renderer = unique("Ecosistema", [("Bosque", "Bosque", faint)])
    styles = category_styles(renderer, "Ecosistema", ["Bosque"])
    assert styles["Bosque"]["fill"] == "rgba(209,108,196,0.008)"
    assert styles["Bosque"]["swatch"] == "#d16cc4"
