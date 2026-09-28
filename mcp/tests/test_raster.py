from typing import Any

import pytest
from shapely.geometry import box

from mcp_server.arcgis.client import ArcGISError
from mcp_server.arcgis.raster import class_counts, class_rule, image_request, to_rest
from mcp_server.catalogue.models import Raster
from tests.test_models import raster_indicator

PUYO = box(-78.09, -1.58, -77.91, -1.4)


def canopy() -> Raster:
    raster = raster_indicator().raster()
    assert raster is not None
    return raster


def slope() -> Raster:
    # Indicator 7: the colormap reads the stored 16-bit values directly.
    return Raster(
        url="https://example.test/Slope/ImageServer",
        raster_function={
            "functionName": "Colormap",
            "functionArguments": {
                "colormap": [[1, 0, 0, 0], [2, 0, 0, 0], [3, 0, 0, 0]],
                "raster": "$$",
            },
            "outputPixelType": "U8",
        },
        values=[1, 2, 3],
        legend=[],
    )


def test_the_front_end_function_becomes_the_rest_form() -> None:
    rest = to_rest(canopy().raster_function)
    assert rest["rasterFunction"] == "Colormap"
    assert rest["outputPixelType"] == "U8"
    remap = rest["rasterFunctionArguments"]["Raster"]
    assert remap["rasterFunction"] == "Remap"
    assert remap["rasterFunctionArguments"]["OutputValues"] == [1, 2, 3, 4, 5]
    assert remap["rasterFunctionArguments"]["Raster"] == "$$"


def test_a_remapped_raster_is_counted_on_its_remap_as_integers() -> None:
    rule = class_rule(canopy())
    assert rule["rasterFunction"] == "Remap"
    assert rule["outputPixelType"] == "U8"


def test_a_raster_read_directly_is_counted_through_an_identity_remap() -> None:
    # Measured on 28 September 2026: without a function, the service ignores
    # outputPixelType and returns slope in 256 fractional bins. And on integer
    # pixels it truncates the ranges, so [1.5, 2.5) read as [1, 2) and every class
    # came out one too high.
    rule = class_rule(slope())
    args = rule["rasterFunctionArguments"]
    assert args["InputRanges"] == [1, 2, 2, 3, 3, 4]
    assert args["OutputValues"] == [1, 2, 3]
    assert rule["outputPixelType"] == "U8"


def test_class_counts_read_one_bin_per_class() -> None:
    # The histogram the service returned over the Puyo box on 28 September 2026.
    histogram = {
        "size": 6,
        "min": -0.5,
        "max": 5.5,
        "counts": [0, 29, 125, 130, 94, 22],
    }
    assert class_counts(histogram, [1, 2, 3, 4, 5]) == [29, 125, 130, 94, 22]


def test_class_counts_read_sparse_class_values() -> None:
    # Land cover (13) codes its classes 10, 20 ... 100; the histogram stops at the
    # highest value present.
    counts: list[Any] = [0] * 81
    counts[10], counts[80] = 5908, 492
    histogram = {"size": 81, "min": -0.5, "max": 80.5, "counts": counts}
    assert class_counts(histogram, [10, 20, 80, 90]) == [5908, 0, 492, 0]


def test_fractional_bins_are_refused_rather_than_misread() -> None:
    histogram = {"size": 256, "min": 1, "max": 5, "counts": [29] + [0] * 255}
    with pytest.raises(ArcGISError):
        class_counts(histogram, [1, 2, 3, 4, 5])


def test_the_image_covers_the_area_and_its_surroundings() -> None:
    params, corners = image_request(canopy(), PUYO)
    (x0, y1), _, (x1, y0), _ = corners
    assert x0 < -78.09 and x1 > -77.91 and y0 < -1.58 and y1 > -1.4
    assert max(int(n) for n in params["size"].split(",")) == 1024
    assert params["interpolation"] == "RSP_NearestNeighbor"
