"""Places a user can name instead of drawing: provinces, cantons, protected areas.

The names come from ``places.snapshot.json``, written by
``amazonia360-mcp-catalogue sync``; the boundaries are read from ArcGIS when a tool
uses a place (``mcp_server.places.geometry``).
"""

import json
import re
import unicodedata
from functools import cache
from importlib.resources import files

from mcp_server.places.models import (
    Place,
    PlaceKind,
    PlaceMatches,
    PlacesSnapshot,
)

SNAPSHOT_FILE = "places.snapshot.json"
_KIND_ORDER: dict[PlaceKind, int] = {"province": 0, "canton": 1, "protected_area": 2}
NO_MATCH = (
    "No province, canton or protected area of the Ecuador module has that name. "
    "Only these three kinds of place can be named; for anything else, send the "
    "area as a GeoJSON polygon."
)
SEVERAL = "Several places match: ask the user which one before calling a tool."
# Longest first, so "provincia de" goes before "provincia".
_KIND_WORDS = ("provincia del ", "provincia de ", "provincia ", "canton de ", "canton ")


def normalise(text: str) -> str:
    decomposed = unicodedata.normalize("NFKD", text)
    stripped = "".join(c for c in decomposed if not unicodedata.combining(c))
    return " ".join(stripped.casefold().split())


def _without_kind_word(q: str) -> str:
    for word in _KIND_WORDS:
        if q.startswith(word) and len(q) > len(word):
            return q[len(word) :]
    return q


def _names(place: Place) -> list[str]:
    """The name, and with its category for a protected area ("Parque Nacional
    Yasuní")."""
    names = [normalise(place.name)]
    if place.category:
        names.append(normalise(f"{place.category} {place.name}"))
    return names


class Places:
    def __init__(self, snapshot: PlacesSnapshot) -> None:
        self.snapshot = snapshot
        self._by_id = {p.id: p for p in snapshot.places}

    def get(self, place_id: str) -> Place | None:
        return self._by_id.get(place_id)

    def find(self, query: str, kind: PlaceKind | None = None) -> PlaceMatches:
        q = _without_kind_word(normalise(query))
        pool = [p for p in self.snapshot.places if kind is None or p.kind == kind]
        whole = [p for p in pool if q in _names(p)]
        words: list[Place] = []
        if q:
            # A whole word, so "Sumaco" finds "Sumaco Napo-Galeras" and "ten" finds
            # nothing. Always searched: a canton "Zamora" must not hide the province
            # "Zamora Chinchipe".
            word = re.compile(rf"(?<!\w){re.escape(q)}(?!\w)")
            words = [
                p
                for p in pool
                if p not in whole and any(word.search(n) for n in _names(p))
            ]
        found = sorted(whole, key=_order) + sorted(words, key=_order)
        note = NO_MATCH if not found else SEVERAL if len(found) > 1 else None
        return PlaceMatches(places=[p.summary() for p in found], note=note)


def _order(place: Place) -> tuple[int, str, str]:
    return (_KIND_ORDER[place.kind], place.province or "", place.name)


@cache
def load_places() -> Places:
    text = files(__package__).joinpath(SNAPSHOT_FILE).read_text(encoding="utf-8")
    return Places(PlacesSnapshot.model_validate(json.loads(text)))
