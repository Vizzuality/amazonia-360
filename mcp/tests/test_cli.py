import asyncio
import json
import sys
from collections.abc import Callable
from pathlib import Path
from typing import Any

import pytest
from shapely.geometry import box, mapping, shape

from mcp_server import places
from mcp_server.catalogue import SNAPSHOT_FILE, cli
from mcp_server.geometry import aoi
from mcp_server.geometry.module_sync import ModuleSyncError
from mcp_server.places.sync import PlacesSyncError

SNAPSHOT = {"generated_at": "x", "indicators": {"210": {"sync_status": "ok"}}}
EXPORT = {"exported": True}
PLACES = {"generated_at": "x", "places": [{"id": "canton:Napo/Tena"}]}
OUTLINE = {
    "type": "Feature",
    "properties": {"area_ha": 1.0},
    "geometry": mapping(box(-78, -1, -77, 0)),
}


def returning(value: Any) -> Callable[[float], Any]:
    async def read(timeout_s: float) -> Any:
        if isinstance(value, Exception):
            raise value
        return value

    return read


class Files:
    """Where the sync writes, moved under tmp_path."""

    def __init__(self, root: Path) -> None:
        self.snapshot = root / SNAPSHOT_FILE
        self.example = root / "catalogue.json"
        self.places = root / places.SNAPSHOT_FILE
        self.outline = root / "module.geojson"

    def previous(self) -> None:
        for path in (self.snapshot, self.example, self.places, self.outline):
            path.write_text('{"previous": true}\n', "utf-8")

    def kept(self, path: Path) -> bool:
        return path.read_text("utf-8") == '{"previous": true}\n'


@pytest.fixture
def files(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Files:
    (tmp_path / "__init__.py").touch()
    monkeypatch.setattr(cli, "HERE", tmp_path)
    monkeypatch.setattr(cli, "EXAMPLE_FILE", tmp_path / "catalogue.json")
    monkeypatch.setattr(places, "__file__", str(tmp_path / "__init__.py"))
    monkeypatch.setattr(aoi, "MODULE_FILE", tmp_path / "module.geojson")
    monkeypatch.setattr(cli, "exported_catalogue", lambda: EXPORT)
    monkeypatch.setattr(cli, "_sync", returning(SNAPSHOT))
    monkeypatch.setattr(cli, "_sync_places", returning(PLACES))
    monkeypatch.setattr(cli, "_sync_module", returning(OUTLINE))
    return Files(tmp_path)


def run(monkeypatch: pytest.MonkeyPatch, *args: str) -> None:
    monkeypatch.setattr(sys, "argv", ["amazonia360-mcp-catalogue", *args])
    cli.main()


def read(path: Path) -> Any:
    return json.loads(path.read_text("utf-8"))


def test_a_sync_rewrites_every_file(
    files: Files, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    files.previous()
    run(monkeypatch, "sync")
    assert read(files.snapshot) == SNAPSHOT
    assert read(files.example) == EXPORT
    assert read(files.places) == PLACES
    assert shape(read(files.outline)["geometry"]).equals(box(-78, -1, -77, 0))
    out = capsys.readouterr().out
    assert "210: ok" in out
    assert "places: 1" in out
    assert "module outline: 1.0 ha" in out


def test_a_sync_that_reads_no_layer_writes_nothing(
    files: Files, monkeypatch: pytest.MonkeyPatch
) -> None:
    # A network outage would otherwise mark every indicator unavailable.
    outage = {"generated_at": "x", "indicators": {"210": {"sync_status": "error"}}}
    monkeypatch.setattr(cli, "_sync", returning(outage))
    files.previous()
    with pytest.raises(SystemExit, match="snapshot was left as it was"):
        run(monkeypatch, "sync")
    for path in (files.snapshot, files.example, files.places, files.outline):
        assert files.kept(path)


def test_places_that_cannot_be_read_leave_their_snapshot_and_nothing_else(
    files: Files, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    monkeypatch.setattr(cli, "_sync_places", returning(PlacesSyncError("truncated")))
    files.previous()
    run(monkeypatch, "sync")
    assert files.kept(files.places)
    assert read(files.snapshot) == SNAPSHOT
    assert read(files.outline)["properties"] == {"area_ha": 1.0}
    assert "left as it was" in capsys.readouterr().out


def test_an_outline_that_cannot_be_read_is_left_as_it_was(
    files: Files, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    monkeypatch.setattr(cli, "_sync_module", returning(ModuleSyncError("truncated")))
    files.previous()
    run(monkeypatch, "sync")
    assert files.kept(files.outline)
    assert read(files.places) == PLACES
    assert "left as it was" in capsys.readouterr().out


def test_the_outline_source_without_a_layer_fails_the_module_step(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(cli, "get_indicator_metadata", lambda _id: None)
    with pytest.raises(ModuleSyncError, match="has no layer"):
        asyncio.run(cli._sync_module(1.0))


def test_schema_rewrites_the_schema_file(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setattr(cli, "HERE", tmp_path)
    run(monkeypatch, "schema")
    assert read(tmp_path / cli.SCHEMA_FILE) == cli.catalogue_schema()


def test_export_writes_the_joined_catalogue_to_a_file_or_stdout(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch, capsys: pytest.CaptureFixture[str]
) -> None:
    out = tmp_path / "export.json"
    run(monkeypatch, "export", "--out", str(out))
    assert read(out) == cli.exported_catalogue()
    capsys.readouterr()
    run(monkeypatch, "export")
    assert json.loads(capsys.readouterr().out) == cli.exported_catalogue()
