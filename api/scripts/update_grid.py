import argparse
import json
from pathlib import Path

import h3ronpy.polars  # noqa F401
import polars as pl

IGNORE_COLS = ("cell", "tile_id")


def column_to_json(col: pl.Series) -> dict:
    return {
        "var_name": col.name,
        "var_dtype": str(col.dtype),
        "label": "",
        "description": "",
        "unit": "",
        "legend": {
            "legend_type": "continuous",
            "colormap_name": "viridis",
            "stats": [
                {
                    "level": 1,
                    "min": col.min(),
                    "max": col.max(),
                }
            ],
        },
    }


def check_grid_structure(path: Path) -> int:
    if not path.is_dir():
        raise NotADirectoryError("Grid path must be a directory")
    if not path.exists():
        raise ValueError(f"Grid path {path} does not exist")
    dirs = list(path.iterdir())
    if len(dirs) < 2:
        raise ValueError("Malformed grid. Must contain at least a meta.json file and a level directory")
    if path / "meta.json" not in dirs:
        raise ValueError("Grid does not have meta.json")


def main(files: list[Path], grid: Path, out: Path | None, h3_cell_col: str) -> None:
    print(f"Updating {grid} with files:\n{'\n'.join('\t' + str(f) for f in files)}")
    check_grid_structure(grid)
    if out is None:
        out = grid
    out.mkdir(exist_ok=True, parents=True)
    in_dfs = [pl.read_csv(f).rename({h3_cell_col: "cell"}) for f in files]
    df = pl.concat(in_dfs, how="align")
    df = df.with_columns(
        pl.col("cell").h3.cells_parse().h3.change_resolution(1).h3.cells_to_string().alias("tile_id"),  # type: ignore[attr-defined]
    )

    print("\n")
    print(f"Adding columns {' '.join(c for c in df.columns if c not in IGNORE_COLS)}")
    #  Copy and update grid metadata
    with (grid / "meta.json").open() as f:
        meta = json.load(f)
    new_dataset_entries = [column_to_json(df[col_name]) for col_name in df.columns if col_name not in IGNORE_COLS]
    meta["datasets"].extend(new_dataset_entries)
    with (out / "meta.json").open("w") as f:
        json.dump(meta, f, indent=2)

    tiles_out = out / "1"
    tiles_out.mkdir(exist_ok=True)
    level_dir = grid / "1"  # debt: All this fixed to work with a single tile level
    for parent_id, tile in df.group_by("tile_id"):
        src_tile_file = level_dir / f"{parent_id[0]}.arrow"
        if not src_tile_file.exists():
            print(f"Skipping {src_tile_file}: no matching Arrow file found.")
            continue
        src_tile = pl.read_ipc(src_tile_file)
        # debt: will only inlcude values for cells that already exists in the previous grid revision.
        #   change `how` parameter for a different behaviour
        merged = src_tile.join(tile, on="cell", how="left")

        merged.drop("tile_id").write_ipc(tiles_out / src_tile_file.name)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Append new columns to an h3 dataset")
    parser.add_argument("--grid", type=Path, required=True)
    parser.add_argument("--infile", type=Path, nargs="+", required=True)
    parser.add_argument("--out", type=Path)
    parser.add_argument("--h3-column-name")
    args = parser.parse_args()
    main(args.infile, args.grid, args.out, args.h3_column_name)
