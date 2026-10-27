from dataclasses import dataclass, field

from mcp_server.documents.models import Topic
from mcp_server.places import normalise


@dataclass(frozen=True)
class TopicResolution:
    """Either one topic, or no topic and the candidates to ask about."""

    topic: Topic | None
    candidates: list[Topic] = field(default_factory=list)


def resolve_topic(name: str, topics: list[Topic]) -> TopicResolution:
    wanted = normalise(name)
    if not wanted:
        return TopicResolution(None)
    stages = (
        lambda t: wanted == normalise(t.id),
        lambda t: wanted in {normalise(n) for n in _names(t)},
        lambda t: any(normalise(n).startswith(wanted) for n in _names(t)),
    )
    for matches in stages:
        found = [t for t in topics if matches(t)]
        if len(found) == 1:
            return TopicResolution(found[0])
        if found:
            return TopicResolution(None, found)
    return TopicResolution(None)


def _names(topic: Topic) -> list[str]:
    return [topic.name, *topic.aliases]
