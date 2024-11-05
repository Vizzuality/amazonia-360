-- example HTTP POST script which demonstrates setting the
-- HTTP method, body, and adding a header
-- command:
-- wrk -c 100 -t 10 -d 10s -s benchmark_post.lua 'http://localhost:8000/grid/table?level=4&limit=10&order_by=-population'


wrk.method = "POST"
wrk.body   = [[
[
  {
    "filter_type": "categorical",
    "column_name": "fire",
    "operation": "in",
    "value": [
      1,2,3
    ]
  },
  {
    "filter_type": "numerical",
    "column_name": "population",
    "operation": "gt",
    "value": 10000
  }
]
]]
wrk.headers["Content-Type"] = "application/json"
wrk.headers["accept"] = "application/json"
wrk.headers["Authorization"] = "Bearer 1234"
