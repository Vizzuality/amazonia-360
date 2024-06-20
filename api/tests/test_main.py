import os
from pathlib import Path

import numpy as np
import pytest
import rasterio
from app.config.config import get_settings
from fastapi.routing import APIRoute

from tests.utils import test_client

TOKEN = get_settings().auth_token
FILES = ["raster.tif", "raster2.tif", "raster3.tif"]
GEOJSON = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "type": "Polygon",
                "coordinates": [
                    [
                        [3.0, 7.0],
                        [3.0, 10.0],
                        [0.0, 10.0],
                        [0.0, 7.0],
                        [3.0, 7.0],
                    ],
                ],
            },
        }
    ],
}

HEADERS = {"Authorization": f"Bearer {TOKEN}"}


@pytest.fixture()
def setup_data_folder():
    os.mkdir(get_settings().tiff_path)

    yield

    os.rmdir(get_settings().tiff_path)


@pytest.fixture()
def tif_file(setup_data_folder):
    """Create a test raster file.

        [[0, 1, 0],
        [1, 9, 1],
        [0, 1, 0]]

    The raster is a 3x3 grid with the upper left corner at 0E, 10N and 1 degree pixel size.
    The bbox is BoundingBox(left=0.0, bottom=7.0, right=3.0, top=10.0)
    """
    data = np.array([[0, 1, 0], [1, 9, 1], [0, 1, 0]])
    transform = rasterio.transform.from_origin(0, 10, 1, 1)
    with rasterio.open(
        f"{get_settings().tiff_path}/raster.tif",
        "w",
        driver="GTiff",
        width=data.shape[1],
        height=data.shape[0],
        count=1,
        dtype="uint8",
        crs="+proj=latlong",
        transform=transform,
    ) as dst:
        dst.write(data, 1)

    yield

    os.remove(f"{get_settings().tiff_path}/raster.tif")


@pytest.fixture()
def h3_dataset(setup_data_folder) -> str:
    """Create an empty binary file to be used as grid dataset stub
    for a level 0 tile. like:
           data
            └── grid
                ├── 0
                │   └── 84395c9ffffffff.arrow
                └── meta.json
    """
    level = "4"
    h3_index = "84395c9ffffffff"

    grid_dataset_path = Path(get_settings().grid_tiles_path)
    level_path = grid_dataset_path / level
    level_path.mkdir(parents=True)
    tile_path = level_path / f"{h3_index}.arrow"

    with open(grid_dataset_path / "meta.json", "w") as f:
        f.write("Not a json")

    with open(tile_path, "wb") as f:
        f.write(b"I am an arrow file!")

    yield h3_index

    tile_path.unlink()
    level_path.rmdir()
    (grid_dataset_path / "meta.json").unlink()
    grid_dataset_path.rmdir()


@pytest.fixture()
def setup_empty_files(setup_data_folder):
    test_tiff_path = get_settings().tiff_path

    for file in FILES:
        # Create empty files writing nothing
        with open(f"{test_tiff_path}/{file}", "w") as f:
            f.write("")

    yield

    for file in FILES:
        os.remove(f"{test_tiff_path}/{file}")


def test_no_token_is_unauthorized():
    response = test_client.get("/tifs")
    response2 = test_client.post("/exact_zonal_stats")
    assert response.status_code == 401
    assert response2.status_code == 401
    assert response.json() == {"detail": "Unauthorized"}
    assert response2.json() == {"detail": "Unauthorized"}


def test_wrong_token_is_unauthorized():
    response = test_client.get("/tifs", headers={"Authorization": "Bearer BAD-TOKKI-123"})
    assert response.status_code == 401
    assert response.json() == {"detail": "Unauthorized"}


def test_health_is_public():
    response = test_client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_options_request_is_allowed_with_correct_headers():
    headers = {"Access-Control-Request-Method": "GET", "Origin": "http://example.com"}
    response = test_client.options("/tifs", headers=headers)
    response2 = test_client.options("/exact_zonal_stats", headers=headers)
    assert response.status_code == 200
    assert response2.status_code == 200
    assert "DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT" in response.headers["Access-Control-Allow-Methods"]
    assert "*" in response.headers["Access-Control-Allow-Origin"]


def test_with_token(setup_data_folder):
    response = test_client.get("/tifs", headers=HEADERS)
    assert response.status_code == 200


def test_list_files_empty(setup_data_folder):
    response = test_client.get("/tifs", headers=HEADERS)
    assert response.status_code == 200
    assert response.json() == {"files": []}


def test_list_files(setup_empty_files):
    response = test_client.get("/tifs", headers=HEADERS)
    assert response.status_code == 200
    assert response.json() == {"files": FILES}


def test_wrong_file_name_raises_404(setup_data_folder):
    response = test_client.post(
        "/exact_zonal_stats", headers=HEADERS, params={"raster_filename": "wrong.tif"}, json=GEOJSON
    )
    assert response.status_code == 404
    assert response.json() == {"detail": "Raster file wrong.tif does not exist."}


def test_no_geojson_raises_422(tif_file):
    response = test_client.post("/exact_zonal_stats", headers=HEADERS, params={"raster_filename": "raster.tif"})
    assert response.status_code == 422
    assert response.json() == {
        "detail": [
            {
                "input": None,
                "loc": ["body"],
                "msg": "Field required",
                "type": "missing",
                "url": "https://errors.pydantic.dev/2.6/v/missing",
            }
        ]
    }


def test_default_zonal_stats(tif_file):
    response = test_client.post(
        "/exact_zonal_stats", headers=HEADERS, params={"raster_filename": "raster.tif"}, json=GEOJSON
    )
    assert response.status_code == 200
    assert response.json() == {"features": [{"properties": {"max": 9.0, "min": 0.0}, "type": "Feature"}]}


def test_custom_zonal_stats(tif_file):
    response = test_client.post(
        "/exact_zonal_stats",
        headers=HEADERS,
        params={"raster_filename": "raster.tif", "statistics": ["count"]},
        json=GEOJSON,
    )
    assert response.status_code == 200
    assert response.json() == {"features": [{"properties": {"count": 9}, "type": "Feature"}]}


def test_nonexistent_statistic_raises_422(tif_file):
    response = test_client.post(
        "/exact_zonal_stats",
        headers=HEADERS,
        params={"raster_filename": "raster.tif", "statistics": ["nonexistent"]},
        json=GEOJSON,
    )
    assert response.status_code == 422


def test_h3grid(h3_dataset):
    response = test_client.get(f"/grid/tile/{h3_dataset}", headers=HEADERS)

    assert response.status_code == 200
    assert response.read() == b"I am an arrow file!"


def test_h3grid_404(h3_dataset):
    response = test_client.get("/grid/tile/8439181ffffffff", headers=HEADERS)

    assert response.status_code == 404


def test_h3grid_bad_index(h3_dataset):
    response = test_client.get("/grid/tile/123", headers=HEADERS)

    assert response.status_code == 422
    assert response.json() == {"detail": "Tile index is not a valid H3 cell"}


def test_h3grid_metadata_fails_gracefully(h3_dataset):
    res = test_client.get("/grid/meta", headers=HEADERS)

    assert res.status_code == 500
    assert res.json() == {"detail": "Metadata file is malformed. Please contact developer."}


def test_all_api_routes_require_token():
    api_routes = {r.path: r.methods for r in test_client.app.routes if isinstance(r, APIRoute)}

    # public endpoints that do not need auth:
    del api_routes["/health"]

    for route, method in api_routes.items():
        res = test_client.request(method.pop(), route)
        assert res.status_code == 401
