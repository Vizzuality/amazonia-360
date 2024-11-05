-- command:
-- wrk -c 100 -t 10 -d 10s -s benchmark_grid_post.lua 'http://localhost:8000/grid/tile/815f7ffffffffff?columns=AMIN'

local geojsons = {
    [[
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
    ]],
    [[
    {
      "type": "Feature",
      "properties": {},
      "geometry": {
        "coordinates": [
          [
            [
              -66.98965634041855,
              -2.552105344245007
            ],
            [
              -66.98965634041855,
              -6.931424712822178
            ],
            [
              -60.673596725229004,
              -6.931424712822178
            ],
            [
              -60.673596725229004,
              -2.552105344245007
            ],
            [
              -66.98965634041855,
              -2.552105344245007
            ]
          ]
        ],
        "type": "Polygon"
      }
    }
    ]],
    [[
    {
      "type": "Feature",
      "properties": {},
      "geometry": {
        "coordinates": [
          [
            [
              -59.40141593993765,
              -0.8180702598489091
            ],
            [
              -59.40141593993765,
              -3.8038880006152453
            ],
            [
              -56.08276971246181,
              -3.8038880006152453
            ],
            [
              -56.08276971246181,
              -0.8180702598489091
            ],
            [
              -59.40141593993765,
              -0.8180702598489091
            ]
          ]
        ],
        "type": "Polygon"
      }
    }
    ]],
    [[
    {
      "type": "Feature",
      "properties": {},
      "geometry": {
        "coordinates": [
          [
            [
              -68.36016539573357,
              -3.4797077655746023
            ],
            [
              -68.36016539573357,
              -10.328634044400019
            ],
            [
              -60.34168576692953,
              -10.328634044400019
            ],
            [
              -60.34168576692953,
              -3.4797077655746023
            ],
            [
              -68.36016539573357,
              -3.4797077655746023
            ]
          ]
        ],
        "type": "Polygon"
      }
    }
    ]]
}


request = function()
    wrk.method = "POST"
    wrk.body = geojsons[math.random(1, #geojsons)]
    wrk.headers["Content-Type"] = "application/json"
    wrk.headers["accept"] = "application/json"
    wrk.headers["Authorization"] = "Bearer 1234"
    return wrk.format()
end
