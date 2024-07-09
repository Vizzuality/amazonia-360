from app.models.grid import TableFilters


def test_table_filter_categorical_to_sql():
    tf = TableFilters.model_validate(
        {
            "filters": [{"filter_type": "categorical", "column_name": "foo", "operation": "in", "value": [1, 2, 3]}],
            "limit": 10,
            "order_by": ["baz"],
            "desc": [True],
        }
    )
    query = tf.to_sql_query("table")
    assert query.replace("\n", "") == 'SELECT * FROM "table" WHERE foo IN (1, 2, 3) ORDER BY baz DESC LIMIT 10'


def test_table_filters_numerical_to_sql():
    tf = TableFilters.model_validate(
        {
            "filters": [{"filter_type": "numerical", "column_name": "foo", "operation": "gt", "value": 10}],
            "limit": 10,
            "order_by": ["baz"],
            "desc": [False],
        }
    )
    query = tf.to_sql_query("table")
    assert query.replace("\n", "") == 'SELECT * FROM "table" WHERE foo > 10.0 ORDER BY baz LIMIT 10'
