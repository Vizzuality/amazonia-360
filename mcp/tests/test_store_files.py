from datetime import UTC, datetime
from pathlib import Path

from shapely.geometry import box

from mcp_server.store.files import LayerStore
from mcp_server.store.models import LayerManifest, PlaceFigures

BUILT = datetime(2026, 10, 19, 10, tzinfo=UTC)


def _manifest(pieces: int = 2) -> LayerManifest:
    return LayerManifest(
        indicator_id=208,
        layer_last_edit=BUILT,
        simplification=0.0001,
        cell_deg=0.1,
        features=pieces,
        pieces=pieces,
        built_at=BUILT,
    )


def test_a_written_layer_reads_back(tmp_path: Path) -> None:
    one, two = box(0, 0, 1, 1), box(5, 5, 6, 6)
    LayerStore(tmp_path).write_layer(_manifest(), [("a", one), ("b", two)])

    copy = LayerStore(tmp_path).layer(208)

    assert copy is not None
    assert copy.manifest == _manifest()
    found = copy.pieces_in(box(0.2, 0.2, 0.8, 0.8))
    assert [(c, g.equals(one)) for c, g in found] == [("a", True)]


def test_a_loaded_layer_is_kept(tmp_path: Path) -> None:
    store = LayerStore(tmp_path)
    store.write_layer(_manifest(1), [("a", box(0, 0, 1, 1))])
    assert store.layer(208) is store.layer(208)


def test_a_missing_or_half_written_layer_is_none(tmp_path: Path) -> None:
    half = tmp_path / "layers" / "208"
    half.mkdir(parents=True)
    (half / "pieces.jsonl.gz").write_bytes(b"")

    store = LayerStore(tmp_path)

    assert store.layer(208) is None
    assert store.manifest(208) is None
    assert store.layer(999) is None


def test_rewriting_a_layer_replaces_it_whole(tmp_path: Path) -> None:
    store = LayerStore(tmp_path)
    store.write_layer(_manifest(), [("a", box(0, 0, 1, 1)), ("b", box(5, 5, 6, 6))])
    store.write_layer(_manifest(1), [("c", box(9, 9, 10, 10))])

    copy = LayerStore(tmp_path).layer(208)

    assert copy is not None
    assert copy.manifest.pieces == 1
    assert [c for c, _ in copy.pieces_in(box(-180, -90, 180, 90))] == ["c"]
    assert [p.name for p in (tmp_path / "layers").iterdir()] == ["208"]


def test_boundaries_answer_only_for_their_snapshot(tmp_path: Path) -> None:
    shape = box(0, 0, 1, 1)
    store = LayerStore(tmp_path)
    store.write_boundaries("2026-10-19T10:00:00Z", {"p1": shape})

    fresh = LayerStore(tmp_path)
    found = fresh.boundary("p1", "2026-10-19T10:00:00Z")
    assert found is not None and found.equals(shape)
    assert fresh.boundary("p2", "2026-10-19T10:00:00Z") is None
    assert fresh.boundary("p1", "2026-10-20T10:00:00Z") is None


def test_figures_read_back(tmp_path: Path) -> None:
    figures = PlaceFigures(
        indicator_id=208,
        layer_last_edit=None,
        places_generated_at="2026-10-19T10:00:00Z",
        hectares={"p1": {"a": 12.5}},
    )
    LayerStore(tmp_path).write_figures(figures)

    assert LayerStore(tmp_path).figures(208) == figures
    assert LayerStore(tmp_path).figures(1) is None
