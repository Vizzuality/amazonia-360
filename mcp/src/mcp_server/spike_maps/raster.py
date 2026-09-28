"""Spike: a raster of the regional platform drawn in the map view.

atlas.iadb.org sends CORS headers only to the front end's own origins, so the page
cannot load its images; the server asks for one image of the area and hands it over.
The rendering and legend are the front end's, copied from client/datum/indicators.json.
"""

import base64
import json
import math
from typing import Any

import httpx
from shapely.geometry.base import BaseGeometry

from mcp_server.arcgis.client import (  # pyright: ignore[reportPrivateUsage]
    ArcGISError,
    _esri_polygon,
)

# Indicator 129 of the front end, read on 28 September 2026.
RASTERS: dict[str, dict[str, Any]] = {
    "canopy_height": {
        "name": "Canopy height",
        "url": "https://atlas.iadb.org/image/rest/services/Imagery/Canopy_height/ImageServer",
        "raster_function": {
            "functionName": "Colormap",
            "functionArguments": {
                "colormap": [
                    [1, 237, 248, 233],
                    [2, 186, 228, 179],
                    [3, 116, 196, 118],
                    [4, 49, 163, 84],
                    [5, 0, 109, 44],
                ],
                "raster": {
                    "functionName": "Remap",
                    "functionArguments": {
                        "inputRanges": [0, 5, 5, 15, 15, 30, 30, 45, 45, 100],
                        "outputValues": [1, 2, 3, 4, 5],
                        "raster": "$$",
                    },
                },
            },
            "outputPixelType": "U8",
        },
        "legend": [
            {"label": "Low", "color": "#EDF8E9"},
            {"label": "Medium", "color": "#BAE4B3"},
            {"label": "Medium-High", "color": "#74C476"},
            {"label": "High", "color": "#31A354"},
            {"label": "Very High", "color": "#006D2C"},
        ],
    }
}

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


def class_function(function: dict[str, Any]) -> dict[str, Any]:
    """The classification under the colormap, so pixels are counted per class.

    As integers: left as floats, the histogram comes in 256 bins between the lowest
    and highest class, and the classes land on bins that are hard to tell apart.
    """
    return {**function["functionArguments"]["raster"], "outputPixelType": "U8"}


def _mercator(lon: float, lat: float) -> tuple[float, float]:
    return (
        math.radians(lon) * _R,
        math.log(math.tan(math.pi / 4 + math.radians(lat) / 2)) * _R,
    )


async def _post(
    http: httpx.AsyncClient, url: str, data: dict[str, str]
) -> httpx.Response:
    try:
        response = await http.post(url, data=data)
        response.raise_for_status()
    except httpx.HTTPError as exc:
        raise ArcGISError(f"ArcGIS request failed: {exc}") from exc
    return response


async def class_pixels(
    http: httpx.AsyncClient, raster: dict[str, Any], aoi: BaseGeometry
) -> list[int]:
    """Pixels of each class inside the area, as the image server counts them."""
    response = await _post(
        http,
        f"{raster['url']}/computeHistograms",
        {
            "geometry": _esri_polygon(aoi),
            "geometryType": "esriGeometryPolygon",
            "renderingRule": json.dumps(
                to_rest(class_function(raster["raster_function"]))
            ),
            "f": "json",
        },
    )
    body = response.json()
    if "error" in body or not body.get("histograms"):
        raise ArcGISError(f"No histogram from {raster['url']}: {body.get('error')}")
    histogram = body["histograms"][0]
    width = (histogram["max"] - histogram["min"]) / histogram["size"]
    if abs(width - 1) > 1e-6:
        raise ArcGISError(f"Expected one bin per class from {raster['url']}")
    counts = histogram["counts"]
    pixels = []
    for value in range(1, len(raster["legend"]) + 1):
        index = math.floor(value - histogram["min"])
        pixels.append(counts[index] if 0 <= index < len(counts) else 0)
    return pixels


async def area_image(
    http: httpx.AsyncClient, raster: dict[str, Any], aoi: BaseGeometry
) -> dict[str, Any]:
    """One PNG of the area and its surroundings, in the front end's colours."""
    ax0, ay0, ax1, ay1 = aoi.bounds
    dx, dy = (ax1 - ax0) * _MARGIN, (ay1 - ay0) * _MARGIN
    x0, y0 = max(ax0 - dx, -180.0), max(ay0 - dy, -85.0)
    x1, y1 = min(ax1 + dx, 180.0), min(ay1 + dy, 85.0)
    mx0, my0 = _mercator(x0, y0)
    mx1, my1 = _mercator(x1, y1)
    scale = _LONGEST_SIDE_PX / max(mx1 - mx0, my1 - my0)
    width = max(1, round((mx1 - mx0) * scale))
    height = max(1, round((my1 - my0) * scale))
    response = await _post(
        http,
        f"{raster['url']}/exportImage",
        {
            "bbox": f"{mx0},{my0},{mx1},{my1}",
            "bboxSR": "3857",
            "imageSR": "3857",
            "size": f"{width},{height}",
            "format": "png32",
            "transparent": "true",
            # The pixels are about 1 km; smoothing them would invent detail.
            "interpolation": "RSP_NearestNeighbor",
            "renderingRule": json.dumps(to_rest(raster["raster_function"])),
            "f": "image",
        },
    )
    if not response.headers.get("content-type", "").startswith("image/"):
        raise ArcGISError(f"No image from {raster['url']}: {response.text[:200]}")
    return {
        "image": "data:image/png;base64," + base64.b64encode(response.content).decode(),
        # Top left, top right, bottom right, bottom left, as MapLibre wants them.
        "corners": [[x0, y1], [x1, y1], [x1, y0], [x0, y0]],
        "bytes": len(response.content),
        "size": [width, height],
    }
