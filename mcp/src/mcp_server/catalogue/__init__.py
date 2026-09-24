"""The catalogue seam: the only code that knows where indicator metadata comes from.

Today it reads two files beside this module: ``ecuador.json``, curated by hand, and
``ecuador.snapshot.json``, written by ``amazonia360-mcp-catalogue sync``. When the CMS
serves the contract, only the loading below changes.
"""

import json
from functools import cache
from importlib.resources import files
from typing import Any

from mcp_server.catalogue.models import CuratedIndicator, IndicatorMetadata

CURATED_FILE = "ecuador.json"
SNAPSHOT_FILE = "ecuador.snapshot.json"
LOCALE = "en"


class CatalogueError(Exception):
    pass


def build_catalogue(
    curated: dict[str, Any], snapshot: dict[str, Any]
) -> tuple[IndicatorMetadata, ...]:
    if curated.get("locale") != LOCALE:
        raise CatalogueError(
            f"The curated catalogue must be in locale {LOCALE!r}, "
            f"got {curated.get('locale')!r}."
        )
    syncs: dict[str, Any] = snapshot.get("indicators", {})
    seen: set[int] = set()
    indicators = []
    for raw in curated["indicators"]:
        # Validated alone first so that a hand-written sync group is rejected.
        indicator_id = CuratedIndicator.model_validate(raw).id
        if indicator_id in seen:
            raise CatalogueError(f"Indicator {indicator_id} appears twice.")
        seen.add(indicator_id)
        sync = syncs.get(str(indicator_id), {})
        indicators.append(IndicatorMetadata.model_validate({**raw, "sync": sync}))
    orphans = set(syncs) - {str(i) for i in seen}
    if orphans:
        raise CatalogueError(
            f"The snapshot has entries for unknown indicators: {sorted(orphans)}."
        )
    return tuple(indicators)


def load_curated() -> dict[str, Any]:
    return _read(CURATED_FILE)


def _read(name: str) -> dict[str, Any]:
    return json.loads(files(__package__).joinpath(name).read_text(encoding="utf-8"))


# Lazy, so the sync command can import this package before any snapshot exists.
@cache
def _catalogue() -> dict[int, IndicatorMetadata]:
    return {i.id: i for i in build_catalogue(load_curated(), _read(SNAPSHOT_FILE))}


def get_indicator_metadata(indicator_id: int) -> IndicatorMetadata | None:
    return _catalogue().get(indicator_id)


def list_indicators(subtopic_id: int | None = None) -> list[IndicatorMetadata]:
    return [
        i
        for i in _catalogue().values()
        if subtopic_id is None or i.subtopic == subtopic_id
    ]
