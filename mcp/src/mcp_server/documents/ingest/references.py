"""Reference lists: never an answer, yet they score high on many queries.

A section under a references heading is dropped whole. A reference list that sits
under another heading (a PDF whose references heading was not detected) is dropped
when its paragraphs read as a run of citations.
"""

import re
import unicodedata

REFERENCE_HEADINGS = frozenset(
    {
        "references",
        "references cited",
        "bibliography",
        "literature cited",
        "works cited",
        "referencias",
        "referencias bibliograficas",
        "bibliografia",
    }
)
# One or two citations are how body text cites; a list has more.
MIN_RUN = 3
# Entries the patterns miss, or a page footer and running head, do not end a list.
MAX_GAP = 2

_NUMBERING = re.compile(r"^(?:\d+(?:\.\d+)*[.)]?|[ivxlc]+[.)])\s+")
_UPPER = "A-ZÀ-ÖØ-Þ"
# Older PDFs come out of extraction with accents as separate characters ("Suarez"
# with the acute accent after the a).
_NAME_CHARS = r"\w'\u2019\-\u00b4\u02dc\u0060\u00a8"
_PARTICLES = r"(?:(?:de|da|del|der|den|di|du|dos|la|le|ter|ten|van|von)\s)*"
_SURNAME = (
    rf"{_PARTICLES}[{_UPPER}][{_NAME_CHARS}]+(?:\s[{_NAME_CHARS}]+){{0,2}}?"
    r"(?:\s(?:Jr|Sr)\.)?"
)
_INITIALS = rf"(?:[{_UPPER}]{{1,4}}\b|(?:[{_UPPER}]\.\s?-?){{1,4}})"
# "Pitman NCA", "Belgiu, M.", "4. Pimm SL", "[12] Zhang L", "de la Torre S".
_AUTHOR_START = re.compile(rf"^(?:\[?\d{{1,3}}[.\])]?\s+)?{_SURNAME},?\s{_INITIALS}")
# "IUCN (2008)", "World Wildlife Fund (WWF) (2001)".
_ORGANISATION_START = re.compile(
    rf"^[{_UPPER}][^.()]{{0,150}}?(?:\([^()]{{1,25}}\)\s*)?"
    r"\(\s*(?:(?:19|20)\d{2}[a-z]?|[Nn]o date)\s*\)"
)
_YEAR = re.compile(r"\b(?:19|20)\d{2}[a-z]?\b")
_PAREN_YEAR = re.compile(r"\(\s*(?:19|20)\d{2}[a-z]?\s*\)")
_VENUE = re.compile(
    r"\d+\s*\(\s*[\w\-\u2013]+\s*\)\s*[:,]?\s*e?\d"  # 11(3):351, 3(1), 107
    r"|\b\d+\s*:\s*e?\d+"  # 363: 1881
    r"|\b\d+,\s*\d+\s*[\u2013-]\s*\d+"  # 114, 24-31
    r"|\bdoi\b|https?://doi"
    r"|\bpp?\.\s*\d"
    r"|\b(?:Press|University|Dissertation|Thesis)\b"
    r"|\bAvailable:|\bAccessed\b",
    re.IGNORECASE,
)
# "Washington, DC: WWF", "In: Jorgenson JP".
_PUBLISHER = re.compile(r"\b[A-Z][a-z]+,\s[A-Z]{2}:|\bIn:\s")
# The author-year styles put the year in brackets right after the authors.
_PAREN_YEAR_REACH = 200


def is_reference_heading(heading: str) -> bool:
    return _clean_heading(heading) in REFERENCE_HEADINGS


def is_citation(text: str) -> bool:
    """An entry of a reference list: authors first, a year, and a venue."""
    text = " ".join(text.split())
    if not _YEAR.search(text):
        return False
    venue = bool(_VENUE.search(text) or _PUBLISHER.search(text))
    if _AUTHOR_START.match(text):
        return venue or bool(_PAREN_YEAR.search(text[:_PAREN_YEAR_REACH]))
    # A sentence can also open with a name and a year in brackets; only a venue
    # tells an organisation's entry from it.
    return venue and bool(_ORGANISATION_START.match(text))


def reference_blocks(texts: list[str]) -> set[int]:
    """Indices of the blocks that make up a reference list."""
    dropped: set[int] = set()
    run: list[int] = []
    for i, text in enumerate(texts):
        if not is_citation(text):
            continue
        if run and i - run[-1] > MAX_GAP + 1:
            _close(run, dropped)
            run = []
        run.append(i)
    _close(run, dropped)
    return dropped


def _close(run: list[int], dropped: set[int]) -> None:
    if len(run) >= MIN_RUN:
        dropped.update(range(run[0], run[-1] + 1))


def _clean_heading(heading: str) -> str:
    text = unicodedata.normalize("NFKD", heading)
    text = "".join(c for c in text if not unicodedata.combining(c)).lower().strip()
    text = _NUMBERING.sub("", text)
    return " ".join(text.strip(" .:;").split())
