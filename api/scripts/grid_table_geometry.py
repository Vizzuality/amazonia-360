#!/usr/bin/env python
# coding: utf-8

# In[ ]:


import polars as pl
from h3ronpy.polars.vector import cells_to_wkb_points
from shapely import wkb

# In[ ]:


df = pl.read_csv("../data/processed/grid_table.csv")

df = df.with_columns(
    pl.col("cell").cast(pl.UInt64).h3.cells_to_string(),
    pl.col("tile_id").cast(pl.UInt64).h3.cells_to_string(),
    point=cells_to_wkb_points(df.select(pl.col("cell").cast(pl.UInt64)).to_series()),
)
df = df.with_columns(
    lat=pl.col("point").map_elements(lambda p: wkb.loads(p).x, return_dtype=pl.Float64),
    lon=pl.col("point").map_elements(lambda p: wkb.loads(p).y, return_dtype=pl.Float64),
)

df = df.drop("point")
df.head()


# In[ ]:


df.write_csv("../data/processed/grid_table_geom.csv")
