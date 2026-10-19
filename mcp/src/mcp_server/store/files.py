import gzip
import json
import os
import shutil
import tempfile
from pathlib import Path

import shapely
from pydantic import BaseModel
from shapely import STRtree
from shapely.geometry import MultiPolygon, Polygon
from shapely.geometry.base import BaseGeometry

from mcp_server.arcgis.client import Feature
from mcp_server.store.models import LayerManifest, PlaceFigures

MANIFEST = "manifest.json"
PIECES = "pieces.jsonl.gz"
BOUNDARIES = "boundaries.jsonl.gz"


class LayerCopy:
    def __init__(self, manifest: LayerManifest, pieces: list[Feature]) -> None:
        self.manifest = manifest
        self._pieces = pieces
        self._tree = STRtree([geom for _, geom in pieces])

    def pieces_in(self, aoi: BaseGeometry) -> list[Feature]:
        indexes = self._tree.query(aoi, predicate="intersects")
        return [self._pieces[i] for i in sorted(indexes)]


def _write_json(path: Path, model: BaseModel | dict[str, str]) -> None:
    text = model if isinstance(model, dict) else model.model_dump(mode="json")
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=path.parent, suffix=".tmp")
    with os.fdopen(fd, "w", encoding="utf-8") as handle:
        json.dump(text, handle)
    os.replace(tmp, path)


def _write_lines(path: Path, lines: list[dict[str, str]]) -> None:
    with gzip.open(path, "wt", encoding="utf-8") as handle:
        for line in lines:
            handle.write(json.dumps(line) + "\n")


def _read_lines(path: Path) -> list[dict[str, str]]:
    with gzip.open(path, "rt", encoding="utf-8") as handle:
        return [json.loads(line) for line in handle if line.strip()]


class LayerStore:
    def __init__(self, root: Path) -> None:
        self._root = root
        self._layers: dict[int, LayerCopy] = {}
        self._boundaries: tuple[str, dict[str, BaseGeometry]] | None = None

    def _layer_dir(self, indicator_id: int) -> Path:
        return self._root / "layers" / str(indicator_id)

    def write_layer(self, manifest: LayerManifest, pieces: list[Feature]) -> None:
        target = self._layer_dir(manifest.indicator_id)
        target.parent.mkdir(parents=True, exist_ok=True)
        staging = Path(
            tempfile.mkdtemp(dir=target.parent, prefix=f".{target.name}-new-")
        )
        retired = target.parent / f".{target.name}-old-{os.getpid()}"
        try:
            _write_lines(
                staging / PIECES,
                [
                    {"c": category, "g": shapely.to_wkb(geom, hex=True)}
                    for category, geom in pieces
                ],
            )
            _write_json(staging / MANIFEST, manifest)
            if target.exists():
                shutil.rmtree(retired, ignore_errors=True)
                os.rename(target, retired)
            os.rename(staging, target)
        except BaseException:
            shutil.rmtree(staging, ignore_errors=True)
            raise
        finally:
            shutil.rmtree(retired, ignore_errors=True)
        self._layers.pop(manifest.indicator_id, None)

    def manifest(self, indicator_id: int) -> LayerManifest | None:
        path = self._layer_dir(indicator_id) / MANIFEST
        if not path.is_file():
            return None
        return LayerManifest.model_validate_json(path.read_text(encoding="utf-8"))

    def layer(self, indicator_id: int) -> LayerCopy | None:
        cached = self._layers.get(indicator_id)
        if cached is not None:
            return cached
        manifest = self.manifest(indicator_id)
        if manifest is None:
            return None
        pieces = [
            (line["c"], shapely.from_wkb(line["g"]))
            for line in _read_lines(self._layer_dir(indicator_id) / PIECES)
        ]
        copy = LayerCopy(manifest, pieces)
        self._layers[indicator_id] = copy
        return copy

    def write_boundaries(
        self, generated_at: str, boundaries: dict[str, BaseGeometry]
    ) -> None:
        places = self._root / "places"
        places.mkdir(parents=True, exist_ok=True)
        fd, tmp = tempfile.mkstemp(dir=places, suffix=".tmp")
        os.close(fd)
        _write_lines(
            Path(tmp),
            [
                {"id": place_id, "g": shapely.to_wkb(geom, hex=True)}
                for place_id, geom in boundaries.items()
            ],
        )
        os.replace(tmp, places / BOUNDARIES)
        _write_json(places / MANIFEST, {"generated_at": generated_at})
        self._boundaries = None

    def boundary(
        self, place_id: str, generated_at: str
    ) -> Polygon | MultiPolygon | None:
        if self._boundaries is None or self._boundaries[0] != generated_at:
            self._boundaries = self._load_boundaries(generated_at)
        geom = self._boundaries[1].get(place_id)
        return geom if isinstance(geom, Polygon | MultiPolygon) else None

    def _load_boundaries(
        self, generated_at: str
    ) -> tuple[str, dict[str, BaseGeometry]]:
        places = self._root / "places"
        manifest = places / MANIFEST
        if not manifest.is_file() or not (places / BOUNDARIES).is_file():
            return generated_at, {}
        stored = json.loads(manifest.read_text(encoding="utf-8"))
        if stored.get("generated_at") != generated_at:
            return generated_at, {}
        return generated_at, {
            line["id"]: shapely.from_wkb(line["g"])
            for line in _read_lines(places / BOUNDARIES)
        }

    def write_figures(self, figures: PlaceFigures) -> None:
        _write_json(self._root / "figures" / f"{figures.indicator_id}.json", figures)

    def figures(self, indicator_id: int) -> PlaceFigures | None:
        path = self._root / "figures" / f"{indicator_id}.json"
        if not path.is_file():
            return None
        return PlaceFigures.model_validate_json(path.read_text(encoding="utf-8"))
