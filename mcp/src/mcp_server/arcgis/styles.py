"""Class colours from the layer's ArcGIS renderer, the same source the front end reads.

The renderer does not always colour by the field the MCP reports classes by. On the
Ecuador layers, as of 28 September 2026, it goes one of four ways:

- the same field (214, 203...): a class is a renderer value;
- a code field whose labels are the class names (210, 218): a class is a label;
- a coarser field, one value per class (219 colours by region): the class takes the
  colour of its value, read per class from the layer;
- a different grouping (211 colours by macrorelief, which splits each relief class):
  no single colour per class, so the class falls back to the palette.

A simple renderer (206, 209) gives every class the same colour, as on the front end.

The legend shows the colour alone, as the front end does (its legend calls
Color.toHex(), which drops alpha). The map fills with the renderer's alpha, except where
that alpha leaves the fill invisible: on 210 it is 2 of 255, and a legend with colours
that the map does not show read as a fault in the trials (AM-729). Such a fill takes the
legend colour at FAINT_FILL_ALPHA.
"""

import math
from typing import Any

Style = dict[str, Any]

# Used only where the renderer gives no single colour for a class.
PALETTE = [
    "#1b9e77", "#d95f02", "#7570b3", "#e7298a", "#66a61e", "#e6ab02",
    "#a6761d", "#1f78b4", "#b2df8a", "#fb9a99", "#cab2d6", "#ffff99",
]  # fmt: skip

_PT_TO_PX = 4 / 3
# Below this the fill cannot be seen over the basemap.
MIN_FILL_ALPHA = 0.1
FAINT_FILL_ALPHA = 0.6


def _channels(color: Any) -> list[int] | None:
    # The renderer is a third party's JSON: anything but 3 or 4 numbers from 0 to 255
    # is treated as no colour, so the class falls back to the palette.
    if not isinstance(color, list) or len(color) not in (3, 4):
        return None
    channels = []
    for c in color:
        if isinstance(c, bool) or not isinstance(c, int | float):
            return None
        if not math.isfinite(c) or not 0 <= c <= 255:
            return None
        channels.append(int(c))
    return channels


def _rgba(color: Any, min_alpha: float = 0.0) -> str | None:
    channels = _channels(color)
    if channels is None:
        return None
    r, g, b = channels[:3]
    a = channels[3] / 255 if len(channels) > 3 else 1.0
    if a < min_alpha:
        a = FAINT_FILL_ALPHA
    return f"rgba({r},{g},{b},{a:.3f})"


def _hex(color: Any) -> str | None:
    channels = _channels(color)
    if channels is None:
        return None
    return "#" + "".join(f"{c:02x}" for c in channels[:3])


def _width(value: Any) -> float:
    if isinstance(value, bool) or not isinstance(value, int | float):
        return 0.0
    return round(float(value) * _PT_TO_PX, 2) if math.isfinite(value) else 0.0


def _symbol_style(symbol: Any) -> Style | None:
    if not isinstance(symbol, dict):
        return None
    color = symbol.get("color")
    # A null colour is Esri's "no fill"; anything else that is not a colour falls
    # back to the palette, so the class stays visible.
    if color is not None and _channels(color) is None:
        return None
    outline = symbol.get("outline")
    outline = outline if isinstance(outline, dict) else {}
    return {
        "fill": _rgba(symbol.get("color"), MIN_FILL_ALPHA) or "rgba(0,0,0,0)",
        "swatch": _hex(symbol.get("color")),
        "outline": _rgba(outline.get("color")) or "rgba(0,0,0,0)",
        "outline_width": _width(outline.get("width")),
        "from_layer": True,
    }


def _infos(renderer: dict[str, Any]) -> list[dict[str, Any]]:
    infos = renderer.get("uniqueValueInfos")
    return infos if isinstance(infos, list) else []


def join_field(
    renderer: dict[str, Any] | None, category_field: str, categories: list[str]
) -> str | None:
    """The renderer's field, when its values have to be read per class to colour it."""
    if not renderer or renderer.get("type") != "uniqueValue":
        return None
    field = renderer.get("field1")
    if not field or field == category_field:
        return None
    labels = {str(i.get("label")) for i in _infos(renderer)}
    if all(c in labels for c in categories):
        return None
    return str(field)


def category_styles(
    renderer: dict[str, Any] | None,
    category_field: str,
    categories: list[str],
    pairs: dict[str, set[str]] | None = None,
) -> dict[str, Style]:
    """One style per class: the renderer's where it gives one, the palette otherwise."""
    found: dict[str, Style | None] = dict.fromkeys(categories)
    kind = (renderer or {}).get("type")
    if renderer and kind == "simple":
        style = _symbol_style(renderer.get("symbol"))
        found = dict.fromkeys(categories, style)
    elif renderer and kind == "uniqueValue":
        by_value = {
            str(i.get("value")): _symbol_style(i.get("symbol"))
            for i in _infos(renderer)
        }
        by_label = {
            str(i.get("label")): _symbol_style(i.get("symbol"))
            for i in _infos(renderer)
        }
        same_field = renderer.get("field1") == category_field
        for c in categories:
            if same_field:
                found[c] = by_value.get(c)
            elif c in by_label:
                found[c] = by_label[c]
            elif pairs and len(pairs.get(c, set())) == 1:
                found[c] = by_value.get(next(iter(pairs[c])))
    styles: dict[str, Style] = {}
    fallback = 0
    for c in categories:
        style = found[c]
        if style is None:
            colour = PALETTE[fallback % len(PALETTE)]
            fallback += 1
            style = {
                "fill": colour,
                "swatch": colour,
                "outline": "rgba(0,0,0,0.25)",
                "outline_width": 0.5,
                "from_layer": False,
            }
        styles[c] = style
    return styles
