from tests.conftest import HEADERS
from tests.utils import test_client

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
