from app.models.grid import TableFilters
from tests.conftest import HEADERS
from tests.utils import test_client


def test_table_filter_numerical_eq_to_sql():
    tf = TableFilters.model_validate(
        {
            "filters": [{"filter_type": "numerical", "column_name": "foo", "operation": "eq", "value": 10}],
            "limit": 10,
            "order_by": ["baz"],
        }
    )
    query = tf.to_sql_query("table")
    assert query.replace("\n", "") == 'SELECT * FROM "table" WHERE foo = 10.0 ORDER BY baz LIMIT 10'


def test_table_filter_numerical_gt_to_sql():
    tf = TableFilters.model_validate(
        {
            "filters": [{"filter_type": "numerical", "column_name": "foo", "operation": "gt", "value": 10}],
            "limit": 10,
            "order_by": ["baz"],
        }
    )
    query = tf.to_sql_query("table")
    assert query.replace("\n", "") == 'SELECT * FROM "table" WHERE foo > 10.0 ORDER BY baz LIMIT 10'


def test_table_filter_numerical_lt_to_sql():
    tf = TableFilters.model_validate(
        {
            "filters": [{"filter_type": "numerical", "column_name": "foo", "operation": "lt", "value": 10}],
            "limit": 10,
            "order_by": ["baz"],
        }
    )
    query = tf.to_sql_query("table")
    assert query.replace("\n", "") == 'SELECT * FROM "table" WHERE foo < 10.0 ORDER BY baz LIMIT 10'


def test_table_filter_numerical_gte_to_sql():
    tf = TableFilters.model_validate(
        {
            "filters": [{"filter_type": "numerical", "column_name": "foo", "operation": "gte", "value": 10}],
            "limit": 10,
            "order_by": ["baz"],
        }
    )
    query = tf.to_sql_query("table")
    assert query.replace("\n", "") == 'SELECT * FROM "table" WHERE foo >= 10.0 ORDER BY baz LIMIT 10'


def test_table_filter_numerical_lte_to_sql():
    tf = TableFilters.model_validate(
        {
            "filters": [{"filter_type": "numerical", "column_name": "foo", "operation": "lte", "value": 10}],
            "limit": 10,
            "order_by": ["baz"],
        }
    )
    query = tf.to_sql_query("table")
    assert query.replace("\n", "") == 'SELECT * FROM "table" WHERE foo <= 10.0 ORDER BY baz LIMIT 10'


def test_table_filter_numerical_not_eq_to_sql():
    tf = TableFilters.model_validate(
        {
            "filters": [{"filter_type": "numerical", "column_name": "foo", "operation": "not_eq", "value": 10}],
            "limit": 10,
            "order_by": ["baz"],
        }
    )
    query = tf.to_sql_query("table")
    assert query.replace("\n", "") == 'SELECT * FROM "table" WHERE foo != 10.0 ORDER BY baz LIMIT 10'


def test_table_filter_categorical_in_to_sql():
    tf = TableFilters.model_validate(
        {
            "filters": [{"filter_type": "categorical", "column_name": "foo", "operation": "in", "value": [1, 2, 3]}],
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
                {"filter_type": "categorical", "column_name": "foo", "operation": "not_in", "value": [1, 2, 3]}
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
            "filters": [{"filter_type": "numerical", "column_name": "foo", "operation": "gt", "value": 10}],
            "limit": 100,
            "order_by": ["-baz"],
        }
    )
    query = tf.to_sql_query("table")
    assert query.replace("\n", "") == 'SELECT * FROM "table" WHERE foo > 10.0 ORDER BY baz DESC LIMIT 100'


def test_table_filters_multiple_order_by():
    tf = TableFilters.model_validate(
        {
            "filters": [{"filter_type": "numerical", "column_name": "foo", "operation": "gt", "value": 10}],
            "limit": 100,
            "order_by": ["-baz", "foo", "-bar"],
        }
    )
    query = tf.to_sql_query("table")
    assert (
        query.replace("\n", "") == 'SELECT * FROM "table" WHERE foo > 10.0 ORDER BY baz DESC, foo, bar DESC LIMIT 100'
    )


def test_table_filters_multiple_filters():
    tf = TableFilters.model_validate(
        {
            "filters": [
                {"filter_type": "numerical", "column_name": "foo", "operation": "eq", "value": 10},
                {"filter_type": "categorical", "column_name": "bar", "operation": "in", "value": [1, 2, 3]},
            ],
            "limit": 100,
            "order_by": ["-baz", "foo"],
        }
    )
    query = tf.to_sql_query("table")
    assert (
        query.replace("\n", "")
        == 'SELECT * FROM "table" WHERE foo = 10.0 AND bar IN (1, 2, 3) ORDER BY baz DESC, foo LIMIT 100'
    )


def test_h3grid(grid_dataset):
    response = test_client.get(f"/grid/tile/{grid_dataset}", headers=HEADERS)

    assert response.status_code == 200
    assert response.read() == b"I am an arrow file!"


def test_h3grid_404(grid_dataset):
    response = test_client.get("/grid/tile/8439181ffffffff", headers=HEADERS)

    assert response.status_code == 404


def test_h3grid_bad_index(grid_dataset):
    response = test_client.get("/grid/tile/123", headers=HEADERS)

    assert response.status_code == 422
    assert response.json() == {"detail": "Tile index is not a valid H3 cell"}


def test_h3grid_metadata_fails_gracefully(grid_dataset):
    res = test_client.get("/grid/meta", headers=HEADERS)

    assert res.status_code == 500
    assert res.json() == {"detail": "Metadata file is malformed. Please contact developer."}
