import json

import h3ronpy.polars  # noqa F401
import polars as pl
import pytest
from scripts.csv_to_tiles import (
    OVERVIEW_LEVEL,
    check_resolution,
    check_types,
    column_to_metadata_json,
    main,
)

from app.models.grid import MultiDatasetMeta


class TestColumnToMetadataJson:
    def test_basic_metadata_generation(self):
        # Create a simple numeric series
        series = pl.Series("temperature", [1.0, 2.0, 3.0, 4.0, 5.0])
        result = column_to_metadata_json(series)

        expected = {
            "var_name": "temperature",
            "var_dtype": "Float64",
            "label": "",
            "description": "",
            "unit": "",
            "legend": {
                "legend_type": "continuous",
                "colormap_name": "viridis",
                "stats": [
                    {
                        "level": OVERVIEW_LEVEL,
                        "min": 1.0,
                        "max": 5.0,
                    }
                ],
            },
        }

        assert result == expected

    def test_metadata_with_different_dtype(self):
        series = pl.Series("count", [1, 2, 3, 4, 5])
        result = column_to_metadata_json(series)

        assert result["var_name"] == "count"
        assert result["var_dtype"] == "Int64"
        assert result["legend"]["stats"][0]["min"] == 1
        assert result["legend"]["stats"][0]["max"] == 5


class TestCheckResolution:
    def test_valid_resolution(self):
        # Create valid H3 cells at resolution 6
        valid_h3_cells = [
            "86283082fffffff",  # Resolution 6 cell
            "862830807ffffff",  # Another resolution 6 cell
            "862830817ffffff",  # Another resolution 6 cell
        ]
        df = pl.DataFrame({"cell": valid_h3_cells})

        # Should not raise an exception
        check_resolution(df)

    def test_invalid_resolution_wrong_value(self):
        # Create H3 cells at resolution 7 (should fail)
        resolution_7_cells = [
            "872830820ffffff",  # Resolution 7 cell
            "872830821ffffff",  # Another resolution 7 cell
        ]
        df = pl.DataFrame({"cell": resolution_7_cells})

        with pytest.raises(ValueError, match="H3 resolution must be 6"):
            check_resolution(df)

    def test_mixed_resolutions(self):
        # Mix of resolution 6 and 7 cells (should fail)
        mixed_cells = [
            "86283082fffffff",  # Resolution 6
            "872830820ffffff",  # Resolution 7
        ]
        df = pl.DataFrame({"cell": mixed_cells})

        with pytest.raises(ValueError, match="CSV has more than one H3 resolution"):
            check_resolution(df)


class TestCheckTypes:
    def test_convert_string_columns_to_float(self):
        df = pl.DataFrame(
            {
                "cell": ["86283082fffffff", "862830807ffffff"],
                "tile_id": ["tile1", "tile2"],
                "temperature": ["25.5", "30.2"],  # String column that should be converted
                "humidity": [65, 70],  # Already numeric
            }
        )

        result = check_types(df)

        # Check that temperature was converted to Float32
        assert result["temperature"].dtype == pl.Float32
        assert [round(t, 2) for t in result["temperature"].to_list()] == [25.5, 30.2]

        # Check that ignored columns remain strings
        assert result["cell"].dtype == pl.String
        assert result["tile_id"].dtype == pl.String

        # Check that already numeric columns are unchanged
        assert result["humidity"].dtype == pl.Int64

    def test_no_string_columns_to_convert(self):
        df = pl.DataFrame(
            {
                "cell": ["86283082fffffff", "862830807ffffff"],
                "tile_id": ["tile1", "tile2"],
                "temperature": [25.5, 30.2],  # Already float
                "humidity": [65, 70],  # Already int
            }
        )

        result = check_types(df)

        # Should return the same dataframe structure
        assert result["temperature"].dtype == pl.Float64
        assert result["humidity"].dtype == pl.Int64


class TestMain:
    def test_main_with_valid_csv(self, tmp_path):
        # Create a sample CSV with valid H3 data
        sample_data = {
            "cell": [
                "86283082fffffff",  # Resolution 6 cells
                "862830807ffffff",
                "862830817ffffff",
                "8628308a7ffffff",
            ],
            "temperature": [25.5, 30.2, 22.1, 28.7],
            "humidity": [65, 70, 60, 68],
        }

        input_file = tmp_path / "input.csv"
        output_dir = tmp_path / "output"

        # Create the input CSV file
        df = pl.DataFrame(sample_data)
        df.write_csv(input_file)

        # Run main function
        main(input_file, output_dir)

        # Check that output directory structure was created
        assert output_dir.exists()
        level_dir = output_dir / str(OVERVIEW_LEVEL)
        assert level_dir.exists()

        # Check that meta.json was created
        meta_file = output_dir / "meta.json"
        assert meta_file.exists()

        with open(output_dir / "meta.json") as f:
            metadata_dict = json.load(f)

        # Validate structure with pydantic model
        metadata = MultiDatasetMeta.model_validate(metadata_dict)

        var_names = {dataset.var_name for dataset in metadata.datasets}
        assert "temperature" in var_names
        assert "humidity" in var_names

        # Check that at least one arrow file was created
        arrow_files = list(level_dir.glob("*.arrow"))
        assert len(arrow_files) > 0

    def test_main_with_invalid_resolution(self, tmp_path):
        # Create CSV with invalid H3 resolution
        sample_data = {
            "cell": ["872830820ffffff"],  # Resolution 7 (invalid)
            "temperature": [25.5],
        }

        input_file = tmp_path / "input.csv"
        output_dir = tmp_path / "output"

        # Create the input CSV file
        df = pl.DataFrame(sample_data)
        df.write_csv(input_file)

        # Should raise ValueError about resolution
        with pytest.raises(ValueError, match="H3 resolution must be 6"):
            main(input_file, output_dir)

    def test_main_with_string_numeric_data(self, tmp_path):
        # Test that string numeric columns are properly converted
        sample_data = {
            "cell": ["86283082fffffff", "862830807ffffff"],
            "temperature": ["25.5", "30.2"],  # String numbers
            "count": ["100", "200"],  # String integers
        }

        input_file = tmp_path / "input.csv"
        output_dir = tmp_path / "output"

        # Create the input CSV file
        df = pl.DataFrame(sample_data)
        df.write_csv(input_file)

        # Run main function
        main(input_file, output_dir)

        # Check that processing completed successfully
        assert output_dir.exists()
        assert (output_dir / "meta.json").exists()

        with open(output_dir / "meta.json") as f:
            metadata_dict = json.load(f)

        metadata = MultiDatasetMeta.model_validate(metadata_dict)

        var_names = [dataset.var_name for dataset in metadata.datasets]
        assert "temperature" in var_names
        assert "count" in var_names
