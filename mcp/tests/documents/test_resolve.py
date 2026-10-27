from mcp_server.documents.models import Topic
from mcp_server.documents.resolve import resolve_topic

TOPICS = [
    Topic("water", "Water quality", aliases=("calidad del agua",)),
    Topic("forest", "Forest loss", aliases=("Deforestación",)),
    Topic("forest-law", "Forest law"),
]


def test_exact_id() -> None:
    assert resolve_topic("water", TOPICS).topic == TOPICS[0]


def test_name_ignores_case_and_accents() -> None:
    assert resolve_topic("DEFORESTACION", TOPICS).topic == TOPICS[1]


def test_alias() -> None:
    assert resolve_topic("Calidad del agua", TOPICS).topic == TOPICS[0]


def test_unique_prefix() -> None:
    assert resolve_topic("water q", TOPICS).topic == TOPICS[0]


def test_several_matches_give_candidates() -> None:
    result = resolve_topic("forest", TOPICS)
    assert result.topic is None or result.topic.id == "forest"
    result = resolve_topic("fore", TOPICS)
    assert result.topic is None
    assert [t.id for t in result.candidates] == ["forest", "forest-law"]


def test_unknown_or_empty_has_no_topic_and_no_candidates() -> None:
    for name in ("mining", "  "):
        result = resolve_topic(name, TOPICS)
        assert result.topic is None
        assert result.candidates == []
