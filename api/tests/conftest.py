import json
import os
import shutil
from collections.abc import Generator
from pathlib import Path

import polars as pl
import pytest

from app.config import get_settings

METADATA = {
    "datasets": [
        {
            "var_name": "landcover",
            "var_dtype": "Int32",
            "label": "foo",
            "description": "foo",
            "unit": "",
            "legend": {
                "legend_type": "categorical",
                "entries": [{"value": 1, "color": "#ffffff", "label": "all"}],
            },
        },
        {
            "var_name": "population",
            "var_dtype": "Int32",
            "label": "bar",
            "description": "bar",
            "unit": "count",
            "legend": {
                "legend_type": "continuous",
                "colormap_name": "viridis",
                "stats": [{"level": 1, "min": 1, "max": 900}],
            },
        },
    ],
    "h3_grid_info": [
        {
            "level": 1,
            "h3_cells_resolution": 6,
            "h3_cells_count": 5,
        }
    ],
}

TEST_ROOT = Path(__file__).resolve().parent

# Testing settings env variables
os.environ["AUTH_TOKEN"] = "secret"
os.environ["GRID_TILES_PATH"] = str(TEST_ROOT / "data" / "grid")
os.environ["OPENAI_TOKEN"] = "fake-token"

HEADERS = {"Authorization": f"Bearer {get_settings().auth_token}"}


@pytest.fixture()
def geojson() -> str:
    """This geojson contains the cell 895f4261e03ffff in `grid_dataset`"""
    s = json.dumps(
        {
            "type": "Feature",
            "properties": {},
            "geometry": {
                "coordinates": [
                    [
                        [2.9392210686634144, 39.464491910234415],
                        [2.9392210686634144, 39.43748382671012],
                        [2.975584753828997, 39.43748382671012],
                        [2.975584753828997, 39.464491910234415],
                        [2.9392210686634144, 39.464491910234415],
                    ]
                ],
                "type": "Polygon",
            },
        }
    )
    return s


@pytest.fixture()
def setup_data_folder():
    Path(get_settings().grid_tiles_path).mkdir(exist_ok=True, parents=True)

    yield

    shutil.rmtree(get_settings().grid_tiles_path)


@pytest.fixture()
def grid_dataset(setup_data_folder) -> Generator[str]:
    """Create an empty binary file to be used as grid dataset stub
    for a level 0 tile. like:
           data
            └── grid
                ├── 0
                │   └── 84395c9ffffffff.arrow
                └── meta.json
    """
    level = "4"
    h3_index = "84395c9ffffffff"

    grid_dataset_path = Path(get_settings().grid_tiles_path)
    level_path = grid_dataset_path / level
    level_path.mkdir(parents=True, exist_ok=True)
    tile_path = level_path / f"{h3_index}.arrow"

    df = pl.DataFrame(
        {
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
    )
    with open(grid_dataset_path / "meta.json", "w") as f:
        f.write(json.dumps(METADATA))

    with open(tile_path, "wb") as f:
        df.write_ipc(f)

    yield h3_index
