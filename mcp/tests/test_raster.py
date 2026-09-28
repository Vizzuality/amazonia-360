import httpx
import pytest
from shapely.geometry import box

from mcp_server.arcgis.client import ArcGISError
from mcp_server.arcgis.raster import RASTERS, class_function, class_pixels, to_rest

CANOPY = RASTERS["canopy_height"]


def test_the_front_end_function_becomes_the_rest_form() -> None:
    rest = to_rest(CANOPY["raster_function"])
    assert rest["rasterFunction"] == "Colormap"
    assert rest["outputPixelType"] == "U8"
    remap = rest["rasterFunctionArguments"]["Raster"]
    assert remap["rasterFunction"] == "Remap"
    assert remap["rasterFunctionArguments"]["OutputValues"] == [1, 2, 3, 4, 5]
    assert remap["rasterFunctionArguments"]["Raster"] == "$$"


def test_classes_are_counted_as_integers() -> None:
    assert to_rest(class_function(CANOPY["raster_function"]))["outputPixelType"] == "U8"


@pytest.mark.anyio
async def test_class_pixels_read_one_bin_per_class() -> None:
    # The histogram the service returned over the Puyo box on 28 September 2026.
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path.endswith("/computeHistograms")
        body = {
            "histograms": [
                {
                    "size": 6,
                    "min": -0.5,
                    "max": 5.5,
                    "counts": [0, 29, 125, 130, 94, 22],
                }
            ]
        }
        return httpx.Response(200, json=body)

    http = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    pixels = await class_pixels(http, CANOPY, box(-78.09, -1.58, -77.91, -1.4))
    assert pixels == [29, 125, 130, 94, 22]


@pytest.mark.anyio
async def test_float_bins_are_refused_rather_than_misread() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        body = {
            "histograms": [
                {"size": 256, "min": 1, "max": 5, "counts": [29] + [0] * 255}
            ]
        }
        return httpx.Response(200, json=body)

    http = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    with pytest.raises(ArcGISError):
        await class_pixels(http, CANOPY, box(-78.09, -1.58, -77.91, -1.4))
