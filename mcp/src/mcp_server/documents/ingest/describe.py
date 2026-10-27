import base64
import io
import mimetypes
from typing import Any

from langchain_core.language_models import BaseChatModel
from langchain_core.messages import HumanMessage
from langchain_openai import ChatOpenAI

from mcp_server.documents.models import Document, Figure

PROMPT = """This figure comes from {title} (section: {section}).

Describe what the figure shows, so that someone can answer questions about the territory
from your description alone, without seeing the figure:
- A map: the area shown, the title and panel labels, every legend entry with its colour
  or symbol, the places, protected areas, oil blocks, roads or zones that are named, where
  the main patterns lie (north, south, along a river or a road), and the scale, date or
  data source when printed.
- A chart: the axes and their units, the series, and the values or trends that can be
  read.
- A satellite image: the place and dates printed, and what changed between dates.
- A diagram: its steps and how they connect.
Name things using this section text when it matches what you see:
{context}

Text printed in the figure (OCR, may contain errors): {ocr_text}
Spell names as printed when the OCR text agrees with what you see.

Only describe what is visible. Do not add facts that are not in the figure, and do not
estimate numbers that are not printed.
If the figure carries no information (a logo, a journal badge or a decorative image),
answer only: DECORATIVE"""  # noqa: E501
SUMMARY_PROMPT = """This is the start of {title}.
Section headings: {headings}
Opening text: {opening}
Figure captions: {captions}

Write a summary of 80 to 150 words for someone deciding whether this document is
relevant to a question: what it is about, the places it covers, the period, and what it
measures or reports. Only state what the text above says. Plain prose, no lists."""
MODEL_NAME = "gpt-6-luna"
# Reasoning models spend part of it thinking; 700 left a model with nothing to say.
MAX_TOKENS = 4000
# Under every provider's limit: Anthropic takes 10 MB, OpenAI 30,000 patches.
MAX_SIDE = 2048
JPEG_QUALITY = 90


class DescriptionError(RuntimeError):
    pass


def default_model() -> BaseChatModel:
    return ChatOpenAI(model=MODEL_NAME, max_completion_tokens=MAX_TOKENS)


def encode_image(path: str) -> tuple[str, str]:
    """Base64 and MIME type of the image, downsized when its long side is over 2,048."""
    from PIL import Image

    with Image.open(path) as image:
        if max(image.size) <= MAX_SIDE:
            with open(path, "rb") as file:
                mime = mimetypes.guess_type(path)[0] or "image/png"
                return base64.b64encode(file.read()).decode(), mime
        image.thumbnail((MAX_SIDE, MAX_SIDE))
        buffer = io.BytesIO()
        image.convert("RGB").save(buffer, "JPEG", quality=JPEG_QUALITY)
        return base64.b64encode(buffer.getvalue()).decode(), "image/jpeg"


def build_prompt(figure: Figure, document: Document) -> str:
    return PROMPT.format(
        title=f"{document.authors_year}, {document.title}",
        section=figure.section_path or "none",
        context=figure.context or "none",
        ocr_text=figure.ocr_text or "none found",
    )


def _reply_text(content: str | list[Any]) -> str:
    if isinstance(content, str):
        return content.strip()
    parts = [
        part if isinstance(part, str) else part.get("text", "")
        for part in content
        if isinstance(part, str)
        or (isinstance(part, dict) and part.get("type") == "text")
    ]
    return "".join(parts).strip()


class FigureDescriber:
    def __init__(self, model: BaseChatModel) -> None:
        self._model = model

    async def describe(self, figure: Figure, document: Document) -> str:
        data, mime = encode_image(figure.image_path)
        message = HumanMessage(
            content=[
                {"type": "text", "text": build_prompt(figure, document)},
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:{mime};base64,{data}"},
                },
            ]
        )
        reply = await self._model.ainvoke([message])
        text = _reply_text(reply.content)
        if not text:
            raise DescriptionError("empty description")
        return text


class SummaryWriter:
    def __init__(self, model: BaseChatModel) -> None:
        self._model = model

    async def write(
        self,
        document: Document,
        headings: list[str],
        opening: str,
        captions: list[str],
    ) -> str:
        prompt = SUMMARY_PROMPT.format(
            title=f"{document.authors_year}, {document.title}",
            headings="; ".join(headings) or "none",
            opening=opening or "none",
            captions="; ".join(captions) or "none",
        )
        reply = await self._model.ainvoke([HumanMessage(content=prompt)])
        text = _reply_text(reply.content)
        if not text:
            raise DescriptionError("empty summary")
        return text
