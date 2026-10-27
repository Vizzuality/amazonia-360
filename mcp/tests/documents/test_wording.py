import re
from pathlib import Path

# Document search is a port: none of the original's vocabulary may show through.
BANNED = re.compile(r"\b(device|manual|gear|synth\w*|studio)\b", re.IGNORECASE)
# Exact standard or third-party identifiers that contain a banned word.
ALLOWED = (
    # The standard viewport meta (HTML Living Standard, <meta name="viewport">).
    "width=device-width",
)
DOCUMENTS_SRC = Path(__file__).parents[2] / "src" / "mcp_server" / "documents"
SOURCE_SUFFIXES = (".py", ".html", ".css", ".js")


def banned_words(text: str) -> list[str]:
    for allowed in ALLOWED:
        text = text.replace(allowed, "")
    return sorted({m.group(0) for m in BANNED.finditer(text)})


def test_no_source_file_uses_the_vocabulary_of_the_original() -> None:
    offending = [
        f"{path.relative_to(DOCUMENTS_SRC)}: {found}"
        for path in sorted(DOCUMENTS_SRC.rglob("*"))
        if path.is_file()
        and path.suffix in SOURCE_SUFFIXES
        and (found := banned_words(path.read_text(encoding="utf-8")))
    ]
    assert offending == []


def test_allowed_identifiers_do_not_hide_other_words() -> None:
    assert banned_words('content="width=device-width"') == []
    assert banned_words("width=device-width, a device") == ["device"]
    assert banned_words("Synthbrain studio") == ["Synthbrain", "studio"]
