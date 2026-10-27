import re

from mcp_server.documents.models import Figure

BUCKETS = (
    "needs_review",
    "covered",
    "small",
    "undescribed",
    "approved",
    "discarded",
)
# Word coverage alone hides a share of the figures, so small crops (screen
# captures, icons: the vision model's weakest material) get their own bucket.
# Triage only sorts the queue; it never approves or discards.
COVERAGE_THRESHOLD = 0.6
SMALL_MAX_SIDE = 300

STOP_WORDS = frozenset(
    """
    the and are this that for with from its into onto than then there these those
    which while when where what who how has have had was were been being not but
    can may also each both either one two three four five six seven eight nine ten
    figure image shows showing shown show displays displayed display visible
    appears indicates indicating indicated depicts labeled labelled label labels
    legend legends map maps chart charts plot plots panel panels area areas
    region regions km ha percent north south east west northern southern eastern
    western left right top bottom side middle center centre above below next near
    upper lower
    """.split()
)
WORD = re.compile(r"[a-z0-9]+")


def coverage(description: str, context: str) -> float:
    """Share of the description's informative words that the section text has."""
    words = _informative(description)
    if not words:
        return 0.0
    return len(words & _informative(context)) / len(words)


def bucket(figure: Figure) -> str:
    if figure.review_status in ("approved", "discarded"):
        return figure.review_status
    if not figure.generated_description.strip():
        return "undescribed"
    if coverage(figure.generated_description, figure.context) >= COVERAGE_THRESHOLD:
        return "covered"
    if 0 < max(figure.width, figure.height) < SMALL_MAX_SIDE:
        return "small"
    return "needs_review"


def _informative(text: str) -> set[str]:
    return {
        word
        for word in WORD.findall(text.lower())
        if len(word) >= 3 and word not in STOP_WORDS
    }
