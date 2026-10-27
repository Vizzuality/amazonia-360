import ipaddress
import re
import socket
from dataclasses import dataclass, field
from importlib.metadata import version
from urllib.parse import urljoin, urlsplit

import httpx
from bs4 import BeautifulSoup, Tag

from mcp_server.documents.ingest.sections import FIGURE_CONTEXT_CHARS, Section

DROPPED_TAGS = [
    "script",
    "style",
    "nav",
    "header",
    "footer",
    "aside",
    "form",
    "noscript",
]
HEADINGS = {"h1", "h2", "h3", "h4", "h5", "h6"}
BLOCKS = {"p", "li", "pre", "blockquote", "dt", "dd", "table"}
TIMEOUT_S = 30.0
LOGIN_PATH = re.compile(r"/(log-?in|sign-?in|sso|auth|account/login)\b", re.IGNORECASE)
LOGIN_ERROR = "The page asks for a login: only public pages can be read"
HTML_TYPES = ("text/html", "application/xhtml+xml")
IMAGE_TYPES = ("image/png", "image/jpeg", "image/webp", "image/gif")
MAX_IMAGE_BYTES = 20 * 1024 * 1024
MAX_PAGE_BYTES = 10 * 1024 * 1024
MAX_PAGE_IMAGES = 60
MAX_REDIRECTS = 5


@dataclass(frozen=True)
class Page:
    url: str
    title: str
    html: str


@dataclass(frozen=True)
class PageImage:
    url: str
    alt: str
    section_path: str
    anchor: str | None
    context: str


@dataclass
class _Walked:
    title: str
    sections: list[Section]
    # Each image with the index of the section it sits in.
    images: list[tuple[str, str, int]] = field(default_factory=list)


def _headers() -> dict[str, str]:
    return {"User-Agent": f"amazonia360-docs/{version('mcp-server')}"}


def fetch_page(url: str, client: httpx.Client | None = None) -> Page:
    """Each hop, the first included, must be a public host: the address comes from
    whoever submits it, so it cannot be a way into the private network."""
    owned = client is None
    client = client or httpx.Client(headers=_headers(), timeout=TIMEOUT_S)
    try:
        current = url
        for _ in range(MAX_REDIRECTS + 1):
            _check_host(current, "Page")
            request = client.build_request("GET", current)
            response = client.send(request, stream=True, follow_redirects=False)
            try:
                if response.is_redirect:
                    current = urljoin(current, response.headers.get("location", ""))
                    continue
                html = _page_body(current, response)
            finally:
                response.close()
            if _asks_for_login(url, current, html):
                raise ValueError(LOGIN_ERROR)
            title, _ = parse_sections(html)
            return Page(url=current, title=title, html=html)
        raise ValueError(f"Too many redirects fetching {url}")
    finally:
        if owned:
            client.close()


def _page_body(url: str, response: httpx.Response) -> str:
    if not response.is_success:
        raise ValueError(f"HTTP {response.status_code} fetching {url}")
    content_type = response.headers.get("content-type", "").split(";")[0].strip()
    if content_type not in HTML_TYPES:
        raise ValueError(f"Not an HTML page: {content_type or 'unknown type'}")
    body = _read_limited(url, response, MAX_PAGE_BYTES, "Page")
    return body.decode(response.encoding or "utf-8", errors="replace")


def _read_limited(url: str, response: httpx.Response, limit: int, what: str) -> bytes:
    try:
        declared = int(response.headers.get("content-length") or 0)
    except ValueError as error:
        raise ValueError(f"Invalid content-length fetching {url}") from error
    if declared > limit:
        raise ValueError(f"{what} too large: {url}")
    body = bytearray()
    for part in response.iter_bytes():
        body.extend(part)
        if len(body) > limit:
            raise ValueError(f"{what} too large: {url}")
    return bytes(body)


def _asks_for_login(requested: str, final: str, html: str) -> bool:
    redirected = urlsplit(final)[:3] != urlsplit(requested)[:3]
    if redirected and LOGIN_PATH.search(urlsplit(final).path):
        return True
    return BeautifulSoup(html, "lxml").find("input", type="password") is not None


def clean_heading(text: str) -> str:
    return re.sub(r"\s+", " ", text.strip(" \t\n-\u2013\u2014=*#:|")).strip()


def fetch_image(
    url: str, client: httpx.Client | None = None, page_url: str | None = None
) -> bytes:
    """Image addresses come from the page's author, not the owner: each hop must
    be a public host or the page's own host, so a page cannot reach the LAN."""
    owned = client is None
    client = client or httpx.Client(headers=_headers(), timeout=TIMEOUT_S)
    try:
        for _ in range(MAX_REDIRECTS + 1):
            _check_image_host(url, page_url)
            request = client.build_request("GET", url)
            response = client.send(request, stream=True, follow_redirects=False)
            try:
                if response.is_redirect:
                    url = urljoin(url, response.headers.get("location", ""))
                    continue
                return _image_body(url, response)
            finally:
                response.close()
        raise ValueError(f"Too many redirects fetching {url}")
    finally:
        if owned:
            client.close()


def _image_body(url: str, response: httpx.Response) -> bytes:
    if not response.is_success:
        raise ValueError(f"HTTP {response.status_code} fetching {url}")
    content_type = response.headers.get("content-type", "").split(";")[0].strip()
    if content_type not in IMAGE_TYPES:
        raise ValueError(f"Not a raster image: {content_type or 'unknown type'}")
    return _read_limited(url, response, MAX_IMAGE_BYTES, "Image")


def _check_image_host(url: str, page_url: str | None) -> None:
    if page_url and urlsplit(url).hostname == urlsplit(page_url).hostname:
        _check_scheme(url)
        return
    _check_host(url, "Image")


def _check_scheme(url: str) -> None:
    parts = urlsplit(url)
    if parts.scheme not in ("http", "https") or not parts.hostname:
        raise ValueError(f"Not a web address: {url}")


def _check_host(url: str, what: str) -> None:
    _check_scheme(url)
    for address in _resolve(urlsplit(url).hostname or ""):
        if not ipaddress.ip_address(address).is_global:
            raise ValueError(f"{what} on a private network address: {url}")


def _resolve(host: str) -> list[str]:
    try:
        return [str(info[4][0]) for info in socket.getaddrinfo(host, None)]
    except socket.gaierror as error:
        raise ValueError(f"Unknown host: {host}") from error


def parse_sections(html: str) -> tuple[str, list[Section]]:
    walked = _walk(html)
    return walked.title, [s for s in walked.sections if s.blocks]


def page_images(html: str, base_url: str) -> list[PageImage]:
    walked = _walk(html)
    seen: set[str] = set()
    images: list[PageImage] = []
    for src, alt, index in walked.images:
        url = urljoin(base_url, src)
        if url in seen or urlsplit(url).path.lower().endswith(".svg"):
            continue
        seen.add(url)
        section = walked.sections[index]
        context = "\n".join([alt, *section.blocks] if alt else section.blocks)
        images.append(
            PageImage(
                url=url,
                alt=alt,
                section_path=" > ".join(section.path),
                anchor=section.anchor,
                context=context[:FIGURE_CONTEXT_CHARS],
            )
        )
        if len(images) == MAX_PAGE_IMAGES:
            break
    return images


def _walk(html: str) -> _Walked:
    soup = BeautifulSoup(html, "lxml")
    title = clean_heading(soup.title.get_text()) if soup.title else ""
    for tag in soup.find_all(DROPPED_TAGS):
        tag.decompose()
    root = soup.find("main") or soup.find("article") or soup.body or soup
    sections: list[Section] = []
    stack: list[tuple[int, str]] = []
    current = Section([title] if title else [], None, [])
    images: list[tuple[str, str, int]] = []
    for element in root.find_all(True):
        if element.name == "img":
            src = _attr(element, "src").strip()
            if src and not src.startswith("data:"):
                alt = _squash(_attr(element, "alt"))
                images.append((src, alt, len(sections)))
        elif element.name in HEADINGS and not _inside_block(element, root):
            text = clean_heading(element.get_text(" "))
            if not text or text.lower() == title.lower():
                continue
            level = int(element.name[1])
            stack = [(lvl, t) for lvl, t in stack if lvl < level] + [(level, text)]
            sections.append(current)
            current = Section([t for _, t in stack], _anchor(element), [])
        elif element.name in BLOCKS and not _inside_block(element, root):
            text = _block_text(element)
            if text:
                current.blocks.append(text)
    sections.append(current)
    return _Walked(title, sections, images)


def _inside_block(element: Tag, root: Tag) -> bool:
    for parent in element.parents:
        if parent is root:
            return False
        if parent.name in BLOCKS:
            return True
    return False


def _block_text(element: Tag) -> str:
    if element.name == "table":
        rows = (
            " | ".join(
                _squash(cell.get_text(" ")) for cell in row.find_all(["td", "th"])
            )
            for row in element.find_all("tr")
        )
        return "\n".join(row for row in rows if row.strip(" |"))
    return _squash(element.get_text(" "))


def _squash(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def _attr(tag: Tag, name: str) -> str:
    value = tag.get(name)
    return value if isinstance(value, str) else ""


def _anchor(heading: Tag) -> str | None:
    if _attr(heading, "id"):
        return _attr(heading, "id")
    inner = heading.find("a", attrs={"id": True}) or heading.find(
        "a", attrs={"name": True}
    )
    if inner:
        return _attr(inner, "id") or _attr(inner, "name")
    # An enclosing element is this heading's target only if the heading opens it.
    for parent in heading.parents:
        if parent.name in (None, "[document]", "html", "body"):
            break
        if parent.find(HEADINGS) is not heading:
            break
        if _attr(parent, "id"):
            return _attr(parent, "id")
    for sibling in heading.find_previous_siblings(True):
        if sibling.name in HEADINGS or sibling.get_text(strip=True):
            break
        if _attr(sibling, "id"):
            return _attr(sibling, "id")
    return None
