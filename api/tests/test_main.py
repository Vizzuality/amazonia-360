import os

import pytest

from app.config.config import get_settings
from tests.utils import test_client

token = get_settings().auth_token
test_tif_path = get_settings().tif_path
files = ["raster.tif", "raster2.tif", "raster3.tif"]

headers = {"Authorization": f"Bearer {token}"}


def test_list_files_empty(setup_data_folder):
    response = test_client.get("/tifs", headers=headers)
    assert response.status_code == 200
    assert response.json() == {"files": []}


def test_list_files(setup_files):
    response = test_client.get("/tifs", headers=headers)
    assert response.status_code == 200
    assert response.json() == {"files": files}


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
