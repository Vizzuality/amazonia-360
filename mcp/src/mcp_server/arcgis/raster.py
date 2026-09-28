"""Classed rasters of the regional platform: what to ask the image service, and how to
read its answer.

The classes and colours are the front end's, from the catalogue's imagery resource.
atlas.iadb.org sends CORS headers only to the front end's own origins, so a map page
cannot load its images; the server asks for one image of the area and hands it over.
"""

import json
import math
from typing import Any

from shapely.geometry.base import BaseGeometry

from mcp_server.arcgis.client import ArcGISError
from mcp_server.catalogue.models import Raster

_R = 6378137.0
_LONGEST_SIDE_PX = 1024
# The image covers the area and as much again on each side: cut at the area's edge, the
# raster read as a square of pixels on a basemap rather than as a map.
_MARGIN = 1.5


def to_rest(function: Any) -> Any:
    """The front end stores the JS SDK's form of a raster function; REST wants its own.

    Sent as is, the service ignores it without an error and returns plain greyscale.
    """
    if not isinstance(function, dict) or "functionName" not in function:
        return function
    arguments = {
        key[0].upper() + key[1:]: to_rest(value)
        for key, value in (function.get("functionArguments") or {}).items()
    }
    rest: dict[str, Any] = {
        "rasterFunction": function["functionName"],
        "rasterFunctionArguments": arguments,
    }
    if "outputPixelType" in function:
        rest["outputPixelType"] = function["outputPixelType"]
    return rest


def class_rule(raster: Raster) -> dict[str, Any]:
    """The classification under the colormap, as integers, so pixels count per class.

    Left as floats, or as the stored 16-bit integers (slope), the histogram comes in
    256 bins between the lowest and highest value, and the classes are hard to tell
    apart. Where the colormap reads the stored values directly, an identity Remap is
    what makes the service return integers: outputPixelType alone is ignored. Its
    ranges are whole numbers because on integer pixels the service truncates them:
    [1.5, 2.5) read as [1, 2), and every class came out one too high.
    """
    inner = raster.classified
    if isinstance(inner, dict):
        return to_rest({**inner, "outputPixelType": "U8"})
    ranges = [bound for v in raster.values for bound in (v, v + 1)]
    return {
        "rasterFunction": "Remap",
        "rasterFunctionArguments": {
            "InputRanges": ranges,
            "OutputValues": raster.values,
            "Raster": "$$",
        },
        "outputPixelType": "U8",
    }


def class_counts(histogram: dict[str, Any], values: list[int]) -> list[int]:
    """Pixels of each class, from a histogram of class_rule's output."""
    if not histogram["counts"]:
        return [0] * len(values)
    width = (histogram["max"] - histogram["min"]) / histogram["size"]
    if abs(width - 1) > 1e-6:
        raise ArcGISError("Expected one histogram bin per class")
    counts = histogram["counts"]
    out = []
    for value in values:
        index = math.floor(value - histogram["min"])
        out.append(counts[index] if 0 <= index < len(counts) else 0)
    return out


def _mercator(lon: float, lat: float) -> tuple[float, float]:
    return (
        math.radians(lon) * _R,
        math.log(math.tan(math.pi / 4 + math.radians(lat) / 2)) * _R,
    )


def image_request(
    raster: Raster, aoi: BaseGeometry
) -> tuple[dict[str, str], list[list[float]]]:
    """exportImage parameters for the area and its surroundings, and the image's
    corners: top left, top right, bottom right, bottom left, as MapLibre wants them."""
    ax0, ay0, ax1, ay1 = aoi.bounds
    dx, dy = (ax1 - ax0) * _MARGIN, (ay1 - ay0) * _MARGIN
    x0, y0 = max(ax0 - dx, -180.0), max(ay0 - dy, -85.0)
    x1, y1 = min(ax1 + dx, 180.0), min(ay1 + dy, 85.0)
    mx0, my0 = _mercator(x0, y0)
    mx1, my1 = _mercator(x1, y1)
    scale = _LONGEST_SIDE_PX / max(mx1 - mx0, my1 - my0)
    width = max(1, round((mx1 - mx0) * scale))
    height = max(1, round((my1 - my0) * scale))
    params = {
        "bbox": f"{mx0},{my0},{mx1},{my1}",
        "bboxSR": "3857",
        "imageSR": "3857",
        "size": f"{width},{height}",
        "format": "png32",
        "transparent": "true",
        # The pixels are 250 m to 1 km; smoothing them would invent detail.
        "interpolation": "RSP_NearestNeighbor",
        "renderingRule": json.dumps(to_rest(raster.raster_function)),
        "f": "image",
    }
    return params, [[x0, y1], [x1, y1], [x1, y0], [x0, y0]]
