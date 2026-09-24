"""The catalogue seam: the only code that knows where indicator metadata comes from.

Today it joins two files beside this module into one catalogue document:
``ecuador.json``, curated by hand, and ``ecuador.snapshot.json``, written by
``amazonia360-mcp-catalogue sync``. When the CMS exports the catalogue, the same
document arrives whole and goes through ``load_document`` unchanged.
"""

import json
from functools import cache
from importlib.resources import files
from typing import Any

from mcp_server.catalogue.models import (
    CatalogueDocument,
    CuratedIndicator,
    IndicatorMetadata,
)

CURATED_FILE = "ecuador.json"
SNAPSHOT_FILE = "ecuador.snapshot.json"
LOCALE = "en"


class CatalogueError(Exception):
    pass


def load_document(document: dict[str, Any]) -> CatalogueDocument:
    """Validate a whole catalogue document: the CMS export, or the local join."""
    return CatalogueDocument.model_validate(document)


def build_document(
    curated: dict[str, Any], snapshot: dict[str, Any]
) -> CatalogueDocument:
    _require_keys("curated catalogue", curated, {"locale", "indicators"})
    _require_keys("snapshot", snapshot, {"generated_at", "indicators"})
    if curated.get("locale") != LOCALE:
        raise CatalogueError(
            f"The curated catalogue must be in locale {LOCALE!r}, "
            f"got {curated.get('locale')!r}."
        )
    syncs: dict[str, Any] = snapshot["indicators"]
    ids: set[str] = set()
    joined = []
    for raw in curated["indicators"]:
        # Validated alone first so that a hand-written sync group is rejected.
        indicator_id = str(CuratedIndicator.model_validate(raw).id)
        if indicator_id in ids:
            raise CatalogueError(f"Indicator {indicator_id} appears twice.")
        ids.add(indicator_id)
        joined.append({**raw, "sync": syncs.get(indicator_id, {})})
    orphans = set(syncs) - ids
    if orphans:
        raise CatalogueError(
            f"The snapshot has entries for unknown indicators: {sorted(orphans)}."
        )
    return load_document(
        {
            "locale": curated["locale"],
            "generated_at": snapshot["generated_at"],
            "indicators": joined,
        }
    )


def build_catalogue(
    curated: dict[str, Any], snapshot: dict[str, Any]
) -> tuple[IndicatorMetadata, ...]:
    return tuple(build_document(curated, snapshot).indicators)


# Cached and lazy, so the sync command can import this package before any snapshot
# exists.
@cache
def local_document() -> CatalogueDocument:
    return build_document(load_curated(), _read(SNAPSHOT_FILE))


def _require_keys(what: str, document: dict[str, Any], keys: set[str]) -> None:
    # A renamed or truncated file would otherwise load as an empty catalogue.
    if set(document) != keys:
        raise CatalogueError(
            f"The {what} must have exactly the keys {sorted(keys)}, "
            f"got {sorted(document)}."
        )


def load_curated() -> dict[str, Any]:
    return _read(CURATED_FILE)


def _read(name: str) -> dict[str, Any]:
    return json.loads(files(__package__).joinpath(name).read_text(encoding="utf-8"))


# Not cached itself: local_document is the one cache, so clearing it is enough.
def _catalogue() -> dict[int, IndicatorMetadata]:
    return {i.id: i for i in local_document().indicators}


def get_indicator_metadata(indicator_id: int) -> IndicatorMetadata | None:
    return _catalogue().get(indicator_id)


def list_indicators(subtopic_id: int | None = None) -> list[IndicatorMetadata]:
    return [
        i
        for i in _catalogue().values()
        if subtopic_id is None or i.subtopic == subtopic_id
    ]
