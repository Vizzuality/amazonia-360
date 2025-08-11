import argparse
import os
from pathlib import Path

import polars as pl

for parent_id, sub_df in csv_df.group_by("parent_h3_id"):
    parent_id_str = str(parent_id)
    input_file = os.path.join(arrow_dir, f"{parent_id_str}.arrow")

    if not os.path.exists(input_file):
        print(f"Skipping {parent_id_str}: no matching Arrow file found.")
        continue

    arrow_df = pl.read_ipc(input_file)

    # Merge only rows belonging to this parent
    merged_df = arrow_df.join(sub_df.drop("parent_h3_id"), on=h3_column, how="left")

    output_file = os.path.join(output_dir, f"{parent_id_str}.arrow")
    merged_df.write_ipc(output_file)


def main(file: Path, grid: Path) -> None:
    df = pl.scan_csv(file)
    df = df.with_columns(
        pl.col("cell").h3.change_resolution(OVERVIEW_LEVEL).h3.cells_to_string().alias("tile_id"),  # type: ignore[attr-defined]
        pl.col("cell").h3.cells_to_string(),
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Append new columns to an h3 dataset")
    parser.add_argument("--grid")
    parser.add_argument("--infile")
    args = parser.parse_args()
    main(args.infile, args.grid)
