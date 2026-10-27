import base64
import io
from pathlib import Path
from typing import Any

import pytest

pytest.importorskip("PIL")
from langchain_core.language_models.fake_chat_models import GenericFakeChatModel
from langchain_core.messages import AIMessage, BaseMessage
from PIL import Image

from mcp_server.documents.ingest.describe import (
    PROMPT,
    DescriptionError,
    FigureDescriber,
    SummaryWriter,
    default_model,
)
from mcp_server.documents.models import Document, Figure

pytestmark = pytest.mark.anyio


class RecordingModel(GenericFakeChatModel):
    seen: list[Any]

    def _generate(self, messages: list[BaseMessage], *args: Any, **kwargs: Any) -> Any:
        self.seen.append(messages)
        return super()._generate(messages, *args, **kwargs)


def model(*replies: Any) -> RecordingModel:
    return RecordingModel(
        messages=iter([AIMessage(content=reply) for reply in replies]), seen=[]
    )


def make_figure(tmp_path: Path, size: tuple[int, int] = (100, 80)) -> Figure:
    path = tmp_path / "fig.png"
    Image.new("RGB", size, "white").save(path)
    return Figure(
        figure_id="f1",
        document_id="d1",
        image_path=str(path),
        image_hash="h",
        section_path="Study area",
        context="The Yasuni block.",
        ocr_text="BLOCK 31",
    )


DOCUMENT = Document(
    id="d1",
    type="pdf",
    title="Oil and Gas Projects",
    origin="x",
    authors_year="Finer et al. (2008)",
)


def parts(fake: RecordingModel) -> list[dict[str, Any]]:
    return fake.seen[0][0].content


async def test_prompt_carries_title_and_ocr(tmp_path: Path) -> None:
    fake = model("A map.")
    text = await FigureDescriber(fake).describe(make_figure(tmp_path), DOCUMENT)
    assert text == "A map."
    prompt = parts(fake)[0]["text"]
    assert "Finer et al. (2008), Oil and Gas Projects" in prompt
    assert "BLOCK 31" in prompt
    assert "The Yasuni block." in prompt
    assert PROMPT.split("{title}")[0] in prompt


async def test_large_image_is_downsized(tmp_path: Path) -> None:
    fake = model("A map.")
    figure = make_figure(tmp_path, (3000, 1500))
    await FigureDescriber(fake).describe(figure, DOCUMENT)
    url = parts(fake)[1]["image_url"]["url"]
    assert url.startswith("data:image/jpeg;base64,")
    sent = Image.open(io.BytesIO(base64.b64decode(url.split(",", 1)[1])))
    assert max(sent.size) == 2048


async def test_small_image_is_sent_unchanged(tmp_path: Path) -> None:
    fake = model("A map.")
    figure = make_figure(tmp_path)
    await FigureDescriber(fake).describe(figure, DOCUMENT)
    url = parts(fake)[1]["image_url"]["url"]
    assert (
        url
        == "data:image/png;base64,"
        + base64.b64encode(Path(figure.image_path).read_bytes()).decode()
    )


async def test_empty_reply_raises(tmp_path: Path) -> None:
    with pytest.raises(DescriptionError, match="empty description"):
        await FigureDescriber(model("  ")).describe(make_figure(tmp_path), DOCUMENT)


async def test_decorative_is_returned_unchanged(tmp_path: Path) -> None:
    text = await FigureDescriber(model("DECORATIVE\n")).describe(
        make_figure(tmp_path), DOCUMENT
    )
    assert text == "DECORATIVE"


async def test_reasoning_parts_are_dropped(tmp_path: Path) -> None:
    reply = [
        {"type": "reasoning", "text": "thinking"},
        {"type": "text", "text": "A chart."},
    ]
    text = await FigureDescriber(model(reply)).describe(make_figure(tmp_path), DOCUMENT)
    assert text == "A chart."


async def test_summary_prompt_and_reply() -> None:
    fake = model(" Summary. ")
    text = await SummaryWriter(fake).write(
        DOCUMENT, ["Intro", "Methods"], "Oil blocks.", ["Figure 1. Map"]
    )
    assert text == "Summary."
    prompt = fake.seen[0][0].content
    assert "Finer et al. (2008), Oil and Gas Projects" in prompt
    assert "Intro; Methods" in prompt
    assert "Figure 1. Map" in prompt


async def test_empty_summary_raises() -> None:
    with pytest.raises(DescriptionError, match="empty summary"):
        await SummaryWriter(model("")).write(DOCUMENT, [], "", [])


def test_default_model_settings(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("OPENAI_API_KEY", "test")
    chat = default_model()
    assert chat.model_name == "gpt-6-luna"  # type: ignore[attr-defined]
    assert chat.max_tokens == 4000  # type: ignore[attr-defined]
