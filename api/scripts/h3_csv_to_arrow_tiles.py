#!/usr/bin/env python
# coding: utf-8

# In[ ]:


from pathlib import Path

import polars as pl

# In[ ]:


csvs = list(Path("../data/raw/ENTREGA UNO MUESTRAS HEXA CSV 18072024").glob("*.CSV"))


# In[ ]:


dfs = [pl.read_csv(f, separator=";", decimal_comma=True) for f in csvs]
df = pl.concat(dfs, how="align", rechunk=True)
df.head()


# In[ ]:


df = df.with_columns(pl.col("GRID_ID").h3.cells_parse())
df = df.drop("GRID_ID")


# In[ ]:


df.select(pl.col("cell").h3.cells_resolution()).unique()


# In[ ]:


CELLS_RES = 6
OVERVIEW_LEVEL = CELLS_RES - 5

df = df.with_columns(
    pl.col("cell").h3.change_resolution(OVERVIEW_LEVEL).h3.cells_to_string().alias("tile_id"),  # type: ignore[attr-defined]
    pl.col("cell").h3.cells_to_string(),
)
partition_dfs = df.partition_by(["tile_id"], as_dict=True, include_key=False)


# ## Write tiles to IPC files

# In[ ]:


seen_tiles = set()
n_cells = 0

for tile_group, tile_df in partition_dfs.items():
    if tile_df.shape[0] == 0:  # todo: skip empty tiles ?
        continue
    tile_id = tile_group[0]
    filename = Path("../data/processed/grid/1") / (tile_id + ".arrow")
    if tile_id in seen_tiles:
        tile_df = pl.concat([pl.read_ipc(filename), tile_df], how="vertical_relaxed").unique(subset=["cell"])
        tile_df.write_parquet(filename)
        n_cells += len(tile_df)
    else:
        seen_tiles.add(tile_id)
        tile_df.write_ipc(filename)
        n_cells += len(tile_df)


# ## Make the metadata

# In[ ]:


df.select(pl.all().min())


# In[ ]:


df.select(pl.all().max())


# In[ ]:


df.columns


# In[ ]:


df.dtypes
