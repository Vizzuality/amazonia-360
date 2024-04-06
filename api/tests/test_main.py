import os
import pytest
from app.config.config import get_settings
from tests.utils import test_client
import shutil

token = get_settings().auth_token
test_tif_path = get_settings().tif_path
files = ["raster.tif", "raster2.tif", "raster3.tif"]
geojson = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "type": "Polygon",
                "coordinates": [
                    [
                        [115.0870, -8.3455],
                        [115.0870, -8.3355],
                        [115.0970, -8.3355],
                        [115.0970, -8.3455],
                        [115.0870, -8.3455]
                    ]
                ]
            }
        }
    ]
}

headers = {"Authorization": f"Bearer {token}"}


def test_no_token():
    response = test_client.get("/tifs")
    assert response.status_code == 401
    assert response.text == 'Unauthorized'


def test_with_token(setup_data_folder):
    response = test_client.get("/tifs", headers=headers)
    assert response.status_code == 200


def test_list_files_empty(setup_data_folder):
    response = test_client.get("/tifs", headers=headers)
    assert response.status_code == 200
    assert response.json() == {"files": []}


def test_list_files(setup_files):
    response = test_client.get("/tifs", headers=headers)
    assert response.status_code == 200
    assert response.json() == {"files": files}



# TODO: Activate this test once having a test tif file

# def test_exact_zonal_stats(setup_tif):
#     response = test_client.post("/exact_zonal_stats", headers=headers, params={"raster_name": "test.tif"}, json=geojson)
#     assert response.status_code == 200
#     assert response.json() == {"mean": 0.0, "min": 0.0, "max": 0.0, "count": 0, "sum": 0.0}
#

@pytest.fixture()
def setup_data_folder():
    os.mkdir(get_settings().tif_path)

    yield

    os.rmdir(get_settings().tif_path)


@pytest.fixture()
def setup_files():
    os.mkdir(get_settings().tif_path)
    for file in files:
        with open(f'{test_tif_path}/{file}', 'w') as f:
            f.write('test data')

    yield

    for file in files:
        os.remove(f'{test_tif_path}/{file}')
    os.rmdir(test_tif_path)


@pytest.fixture()
def setup_tif():
    os.mkdir(get_settings().tif_path)
    shutil.copy('/opt/api/tests/test.tif', get_settings().tif_path)

    yield

    os.remove(f'{get_settings().tif_path}/test.tif')
    os.rmdir(get_settings().tif_path)
