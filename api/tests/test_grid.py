import json

import polars as pl

from app.models.grid import TableFilters

from .conftest import HEADERS
from .utils import test_client


def test_grid_tile(grid_dataset):
    response = test_client.get(
        f"/grid/tile/{grid_dataset}",
        params={"columns": ["landcover", "population"]},
        headers=HEADERS,
    )
    assert response.status_code == 200
    assert pl.read_ipc(response.read()).to_dict(as_series=False) == {
        "cell": [
            "89395cd696fffff",
            "89395c8b69bffff",
            "89395cd6967ffff",
            "89395cd6963ffff",
            "89395c81e93ffff",
        ],
        "landcover": [1, 4, 3, 3, 4],
        "population": [100, 200, 1, 900, 900],
    }


def test_grid_tile_empty_column_param(grid_dataset):
    response = test_client.get(f"/grid/tile/{grid_dataset}", headers=HEADERS)

    assert response.status_code == 200
    assert pl.read_ipc(response.read()).to_dict(as_series=False) == {
        "cell": [
            "89395cd696fffff",
            "89395c8b69bffff",
            "89395cd6967ffff",
            "89395cd6963ffff",
            "89395c81e93ffff",
        ],
    }


def test_grid_tile_wrong_column(grid_dataset):
    response = test_client.get(f"/grid/tile/{grid_dataset}", params={"columns": ["NOEXIST"]}, headers=HEADERS)
    assert response.status_code == 400
    assert response.json() == {"detail": "One or more of the specified columns is not valid"}


def test_grid_tile_404(grid_dataset):
    response = test_client.get("/grid/tile/8439181ffffffff", headers=HEADERS)

    assert response.status_code == 404


def test_grid_tile_bad_index(grid_dataset):
    response = test_client.get("/grid/tile/123", headers=HEADERS)
    assert response.status_code == 400
    assert response.json() == {"detail": "Integer is not a valid H3 cell: 0x123"}


def test_grid_metadata(grid_dataset):
    res = test_client.get("/grid/meta", headers=HEADERS)

    assert res.status_code == 200
    assert len(res.json()["datasets"]) == 2


def test_table_filter_numerical_eq_to_sql():
    tf = TableFilters.model_validate(
        {
            "filters": [
                {
                    "filter_type": "numerical",
                    "column_name": "foo",
                    "operation": "eq",
                    "value": 10,
                }
            ],
            "limit": 10,
            "order_by": ["baz"],
        }
    )
    query = tf.to_sql_query("table")
    assert query.replace("\n", "") == 'SELECT * FROM "table" WHERE foo = 10.0 ORDER BY baz LIMIT 10'


def test_table_filter_numerical_gt_to_sql():
    tf = TableFilters.model_validate(
        {
            "filters": [
                {
                    "filter_type": "numerical",
                    "column_name": "foo",
                    "operation": "gt",
                    "value": 10,
                }
            ],
            "limit": 10,
            "order_by": ["baz"],
        }
    )
    query = tf.to_sql_query("table")
    assert query.replace("\n", "") == 'SELECT * FROM "table" WHERE foo > 10.0 ORDER BY baz LIMIT 10'


def test_table_filter_numerical_lt_to_sql():
    tf = TableFilters.model_validate(
        {
            "filters": [
                {
                    "filter_type": "numerical",
                    "column_name": "foo",
                    "operation": "lt",
                    "value": 10,
                }
            ],
            "limit": 10,
            "order_by": ["baz"],
        }
    )
    query = tf.to_sql_query("table")
    assert query.replace("\n", "") == 'SELECT * FROM "table" WHERE foo < 10.0 ORDER BY baz LIMIT 10'


def test_table_filter_numerical_gte_to_sql():
    tf = TableFilters.model_validate(
        {
            "filters": [
                {
                    "filter_type": "numerical",
                    "column_name": "foo",
                    "operation": "gte",
                    "value": 10,
                }
            ],
            "limit": 10,
            "order_by": ["baz"],
        }
    )
    query = tf.to_sql_query("table")
    assert query.replace("\n", "") == 'SELECT * FROM "table" WHERE foo >= 10.0 ORDER BY baz LIMIT 10'


def test_table_filter_numerical_lte_to_sql():
    tf = TableFilters.model_validate(
        {
            "filters": [
                {
                    "filter_type": "numerical",
                    "column_name": "foo",
                    "operation": "lte",
                    "value": 10,
                }
            ],
            "limit": 10,
            "order_by": ["baz"],
        }
    )
    query = tf.to_sql_query("table")
    assert query.replace("\n", "") == 'SELECT * FROM "table" WHERE foo <= 10.0 ORDER BY baz LIMIT 10'


def test_table_filter_numerical_not_eq_to_sql():
    tf = TableFilters.model_validate(
        {
            "filters": [
                {
                    "filter_type": "numerical",
                    "column_name": "foo",
                    "operation": "not_eq",
                    "value": 10,
                }
            ],
            "limit": 10,
            "order_by": ["baz"],
        }
    )
    query = tf.to_sql_query("table")
    assert query.replace("\n", "") == 'SELECT * FROM "table" WHERE foo != 10.0 ORDER BY baz LIMIT 10'


def test_table_filter_categorical_in_to_sql():
    tf = TableFilters.model_validate(
        {
            "filters": [
                {
                    "filter_type": "categorical",
                    "column_name": "foo",
                    "operation": "in",
                    "value": [1, 2, 3],
                }
            ],
            "limit": 10,
            "order_by": ["baz"],
        }
    )
    query = tf.to_sql_query("table")
    assert query.replace("\n", "") == 'SELECT * FROM "table" WHERE foo IN (1, 2, 3) ORDER BY baz LIMIT 10'


def test_table_filter_categorical_not_in_to_sql():
    tf = TableFilters.model_validate(
        {
            "filters": [
                {
                    "filter_type": "categorical",
                    "column_name": "foo",
                    "operation": "not_in",
                    "value": [1, 2, 3],
                }
            ],
            "limit": 10,
            "order_by": ["baz"],
        }
    )
    query = tf.to_sql_query("table")
    assert query.replace("\n", "") == 'SELECT * FROM "table" WHERE (foo NOT IN (1, 2, 3)) ORDER BY baz LIMIT 10'


def test_table_filters_order_by_desc():
    tf = TableFilters.model_validate(
        {
            "filters": [
                {
                    "filter_type": "numerical",
                    "column_name": "foo",
                    "operation": "gt",
                    "value": 10,
                }
            ],
            "limit": 100,
            "order_by": ["-baz"],
        }
    )
    query = tf.to_sql_query("table")
    assert query.replace("\n", "") == 'SELECT * FROM "table" WHERE foo > 10.0 ORDER BY baz DESC NULLS LAST LIMIT 100'


def test_table_filters_multiple_order_by():
    tf = TableFilters.model_validate(
        {
            "filters": [
                {
                    "filter_type": "numerical",
                    "column_name": "foo",
                    "operation": "gt",
                    "value": 10,
                }
            ],
            "limit": 100,
            "order_by": ["-baz", "foo", "-bar"],
        }
    )
    query = tf.to_sql_query("table")
    assert (
        query.replace("\n", "")
        == 'SELECT * FROM "table" WHERE foo > 10.0 ORDER BY baz DESC NULLS LAST, foo, bar DESC NULLS LAST LIMIT 100'
    )


def test_table_filters_multiple_filters():
    tf = TableFilters.model_validate(
        {
            "filters": [
                {
                    "filter_type": "numerical",
                    "column_name": "foo",
                    "operation": "eq",
                    "value": 10,
                },
                {
                    "filter_type": "categorical",
                    "column_name": "bar",
                    "operation": "in",
                    "value": [1, 2, 3],
                },
            ],
            "limit": 100,
            "order_by": ["-baz", "foo"],
        }
    )
    query = tf.to_sql_query("table")
    assert (
        query.replace("\n", "")
        == 'SELECT * FROM "table" WHERE foo = 10.0 AND bar IN (1, 2, 3) ORDER BY baz DESC NULLS LAST, foo LIMIT 100'
    )


def test_grid_table(grid_dataset):
    body = {
        "filters": [
            {
                "filter_type": "numerical",
                "column_name": "population",
                "operation": "lte",
                "value": 200,
            },
            {
                "filter_type": "numerical",
                "column_name": "population",
                "operation": "gt",
                "value": 1,
            },
        ]
    }

    response = test_client.post(
        "/grid/table?level=4&order_by=-population",
        headers=HEADERS,
        content=json.dumps(body),
    )
    assert response.status_code == 200, response.content
    assert json.loads(response.read()) == {
        "table": [
            {"column": "landcover", "values": [4, 1]},
            {"column": "population", "values": [200, 100]},
        ],
        "cells": ["89395c8b69bffff", "89395cd696fffff"],
    }


def test_grid_table_geojson(grid_dataset, geojson):
    body = {
        "filters": [
            {
                "filter_type": "numerical",
                "column_name": "population",
                "operation": "gte",
                "value": 900,
            },
            {
                "filter_type": "numerical",
                "column_name": "population",
                "operation": "gt",
                "value": 3,
            },
        ],
        "geojson": json.loads(geojson),
    }
    response = test_client.post(
        "/grid/table?level=4&order_by=-population",
        headers=HEADERS,
        content=json.dumps(body),
    )
    assert response.status_code == 200
    assert json.loads(response.read()) == {
        "table": [
            {"column": "landcover", "values": [4]},
            {"column": "population", "values": [900]},
        ],
        "cells": ["89395c81e93ffff"],
    }


def test_grid_tile_post_geojson(grid_dataset, geojson):
    response = test_client.post(
        f"/grid/tile/{grid_dataset}",
        params={"columns": ["landcover", "population"]},
        headers=HEADERS,
        content=geojson,
    )
    assert response.status_code == 200
    assert pl.read_ipc(response.read()).to_dict(as_series=False) == {
        "cell": ["89395c81e93ffff"],
        "landcover": [4],
        "population": [900],
    }


def test_grid_tile_post_geojson_404(grid_dataset, geojson):
    response = test_client.post(
        "/grid/tile/8439181ffffffff",
        params={"columns": ["landcover", "population"]},
        headers=HEADERS,
        content=geojson,
    )

    assert response.status_code == 404


def test_grid_tile_post_wrong_column(grid_dataset, geojson):
    response = test_client.post(
        f"/grid/tile/{grid_dataset}",
        params={"columns": ["I DO NOT EXIST"]},
        headers=HEADERS,
        content=geojson,
    )

    assert response.status_code == 400
    assert response.json() == {"detail": "One or more of the specified columns is not valid"}


def test_grid_metadata_filter(grid_dataset, geojson):
    response = test_client.post(
        "/grid/meta",
        params={"level": 4},
        headers=HEADERS,
        content=geojson,
    )
    assert response.status_code == 200, response.content

    meta = response.json()

    assert len(meta["datasets"]) == 2
    population = [ds for ds in meta["datasets"] if ds["var_name"] == "population"][0]

    assert population["legend"]["stats"][0]["max"] == 900
    assert population["legend"]["stats"][0]["min"] == 900
