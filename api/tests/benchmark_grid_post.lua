-- command:
-- wrk -c 100 -t 10 -d 10s -s benchmark_grid_post.lua 'http://localhost:8000/grid/tile/815f7ffffffffff?columns=AMIN'

wrk.method = "POST"
wrk.body   = [[
{
      "type": "Feature",
      "properties": {},
      "geometry": {
        "coordinates": [
          [
            [
              -61.113268179996055,
              8.666717320892204
            ],
            [
              -61.113268179996055,
              8.505177617822142
            ],
            [
              -60.86538798013957,
              8.505177617822142
            ],
            [
              -60.86538798013957,
              8.666717320892204
            ],
            [
              -61.113268179996055,
              8.666717320892204
            ]
          ]
        ],
        "type": "Polygon"
      }
    }
]]
wrk.headers["Content-Type"] = "application/json"
wrk.headers["accept"] = "application/json"
wrk.headers["Authorization"] = "Bearer 1234"
