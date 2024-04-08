import os
import shutil

import numpy as np
import pytest
import rasterio
from app.config.config import get_settings

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
    os.mkdir(get_settings().tif_path)

    yield

    os.rmdir(get_settings().tif_path)


@pytest.fixture()
def tif_file(setup_data_folder):
    data = np.array([[0, 1, 0], [1, 9, 1], [0, 1, 0]])
    transform = rasterio.transform.from_origin(0, 10, 1, 1)  # upper left corner at 0E, 10N and 1 degree pixel size
    with rasterio.open(
        f"{get_settings().tif_path}/raster.tif",
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

    os.remove(f"{get_settings().tif_path}/raster.tif")


@pytest.fixture()
def setup_files(setup_data_folder):
    test_tif_path = get_settings().tif_path

    for file in FILES:
        with open(f"{test_tif_path}/{file}", "w") as f:
            f.write("test data")

    yield

    for file in FILES:
        os.remove(f"{test_tif_path}/{file}")


@pytest.fixture()
def setup_tif():
    os.mkdir(get_settings().tif_path)
    shutil.copy("/opt/api/tests/test.tif", get_settings().tif_path)

    yield

    os.remove(f"{get_settings().tif_path}/test.tif")
    os.rmdir(get_settings().tif_path)


def test_no_token():
    response = test_client.get("/tifs")
    assert response.status_code == 401
    assert response.text == "Unauthorized"


def test_with_token(setup_data_folder):
    response = test_client.get("/tifs", headers=HEADERS)
    assert response.status_code == 200


def test_list_files_empty(setup_data_folder):
    response = test_client.get("/tifs", headers=HEADERS)
    assert response.status_code == 200
    assert response.json() == {"files": []}


def test_list_files(setup_files):
    response = test_client.get("/tifs", headers=HEADERS)
    assert response.status_code == 200
    assert response.json() == {"files": FILES}


def test_wrong_file_name_raises_404(setup_data_folder):
    response = test_client.post(
        "/exact_zonal_stats", headers=HEADERS, params={"raster_filename": "wrong.tif"}, json=GEOJSON
    )
    assert response.status_code == 404


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
