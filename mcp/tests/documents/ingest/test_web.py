from pathlib import Path

import httpx
import pytest

pytest.importorskip("bs4")
pytest.importorskip("lxml")

from mcp_server.documents.ingest import web
from mcp_server.documents.ingest.web import (
    clean_heading,
    fetch_image,
    fetch_page,
    page_images,
    parse_sections,
)

FIXTURE = Path(__file__).parent.parent / "fixtures" / "forest-page.html"
URL = "https://example.org/forest-loss/"


def test_clean_heading_strips_decoration() -> None:
    assert clean_heading("---- causes ----") == "causes"
    assert clean_heading("  Roads, oil ") == "Roads, oil"


def test_fixture_page_has_two_sections_with_anchors() -> None:
    title, sections = parse_sections(FIXTURE.read_text())
    assert title == "Forest loss in the Western Amazon"
    assert [(" > ".join(s.path), s.anchor) for s in sections] == [
        ("Causes", "causes"),
        ("Protection", "protection"),
    ]
    assert sections[0].blocks == [
        "Roads and oil exploration open the forest to settlers."
    ]


def test_navigation_footer_and_scripts_are_dropped() -> None:
    html = (
        "<body><nav>NAV-MARKER</nav><script>SCRIPT-MARKER</script>"
        "<h2>A</h2><p>kept</p><footer>FOOTER-MARKER</footer></body>"
    )
    _, sections = parse_sections(html)
    text = " ".join(b for s in sections for b in s.blocks)
    assert text == "kept"


def test_nested_headings_build_the_path() -> None:
    html = "<body><h2>Causes</h2><h3>Roads</h3><p>x</p></body>"
    _, sections = parse_sections(html)
    assert [s.path for s in sections] == [["Causes", "Roads"]]


def test_heading_without_id_uses_enclosing_id_or_none() -> None:
    html = (
        '<body><section id="s1"><h2>A</h2><p>x</p></section><h2>B</h2><p>y</p></body>'
    )
    _, sections = parse_sections(html)
    assert [(s.path, s.anchor) for s in sections] == [(["A"], "s1"), (["B"], None)]


def test_heading_id_and_inner_anchor_win() -> None:
    html = (
        '<body><h2 id="own">A</h2><p>x</p><h2><a name="inner"></a>B</h2><p>y</p></body>'
    )
    _, sections = parse_sections(html)
    assert [s.anchor for s in sections] == ["own", "inner"]


def test_text_before_first_heading_goes_under_the_title() -> None:
    html = (
        "<html><head><title>Page</title></head>"
        "<body><p>intro</p><h2>A</h2><p>x</p></body></html>"
    )
    _, sections = parse_sections(html)
    assert (sections[0].path, sections[0].blocks) == (["Page"], ["intro"])


def test_nested_list_paragraphs_are_not_duplicated() -> None:
    _, sections = parse_sections("<body><h2>A</h2><ul><li><p>one</p></li></ul></body>")
    assert sections[0].blocks == ["one"]


def test_table_is_one_block() -> None:
    html = (
        "<body><h2>Data</h2><table><tr><td>Zone</td><td>1</td></tr>"
        "<tr><td>Loss</td><td>25 ha</td></tr></table></body>"
    )
    _, sections = parse_sections(html)
    assert sections[0].blocks == ["Zone | 1\nLoss | 25 ha"]


def fake_get(responses: dict[str, httpx.Response]):
    def get(url: str, **_: object) -> httpx.Response:
        response = responses[url]
        response.request = httpx.Request("GET", response.headers.get("x-final", url))
        return response

    return get


HTML = {"content-type": "text/html; charset=utf-8"}
LOGIN = (
    "<html><head><title>Sign in</title></head><body><form>"
    '<input name="user"><input type="password" name="pw"></form></body></html>'
)


def test_fetch_page_refuses_a_login_page(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        web.httpx, "get", fake_get({URL: httpx.Response(200, headers=HTML, text=LOGIN)})
    )
    with pytest.raises(ValueError, match="asks for a login"):
        fetch_page(URL)


def test_fetch_page_refuses_a_redirect_to_a_sign_in_path(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    final = "https://sso.example.com/signin?next=x"
    response = httpx.Response(
        200, headers={**HTML, "x-final": final}, text="<body><p>Welcome</p></body>"
    )
    monkeypatch.setattr(web.httpx, "get", fake_get({URL: response}))
    with pytest.raises(ValueError, match="asks for a login"):
        fetch_page(URL)


def test_fetch_page_accepts_a_plain_redirect(monkeypatch: pytest.MonkeyPatch) -> None:
    response = httpx.Response(
        200, headers={**HTML, "x-final": URL}, text=FIXTURE.read_text()
    )
    monkeypatch.setattr(
        web.httpx, "get", fake_get({"http://example.org/forest-loss": response})
    )
    page = fetch_page("http://example.org/forest-loss")
    assert (page.url, page.title) == (URL, "Forest loss in the Western Amazon")


def test_fetch_page_refuses_non_html(monkeypatch: pytest.MonkeyPatch) -> None:
    response = httpx.Response(200, headers={"content-type": "application/pdf"})
    monkeypatch.setattr(web.httpx, "get", fake_get({URL: response}))
    with pytest.raises(ValueError, match="Not an HTML page: application/pdf"):
        fetch_page(URL)


def test_fetch_page_refuses_other_schemes() -> None:
    with pytest.raises(ValueError, match="Not a web address"):
        fetch_page("file:///etc/passwd")


HTML_WITH_IMAGES = """<html><head><title>Forest</title></head><body>
<nav><img src="/logo.png"></nav>
<h2 id="causes">Causes</h2><p>Roads open the forest.</p>
<img src="chart.png" alt="forest loss by zone">
<p><img src="chart.png"></p>
<img src="../img/arrow.svg">
<img src="data:image/png;base64,AAAA">
<h2 id="protection">Protection</h2><p>Parks hold clearing down.</p>
<img src="https://cdn.example.com/parks.jpg" alt="">
</body></html>"""


def test_page_images_resolve_and_keep_their_section() -> None:
    images = page_images(HTML_WITH_IMAGES, URL)
    assert [i.url for i in images] == [
        "https://example.org/forest-loss/chart.png",
        "https://cdn.example.com/parks.jpg",
    ]
    first = images[0]
    assert first.alt == "forest loss by zone"
    assert (first.section_path, first.anchor) == ("Causes", "causes")
    assert "Roads open the forest." in first.context
    assert images[1].section_path == "Protection"


def test_fixture_page_image() -> None:
    [image] = page_images(FIXTURE.read_text(), URL)
    assert image.url == URL + "chart.png"
    assert image.section_path == "Causes"


def image_client(
    content_type: str, body: bytes, length: int | None = None
) -> httpx.Client:
    def handler(request: httpx.Request) -> httpx.Response:
        headers = {"content-type": content_type}
        if length is not None:
            headers["content-length"] = str(length)
        return httpx.Response(200, headers=headers, content=body)

    return httpx.Client(transport=httpx.MockTransport(handler))


def test_fetch_image_rejects_svg_html_and_oversize(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(web, "_resolve", lambda host: ["93.184.215.14"])
    with pytest.raises(ValueError, match="Not a raster image: image/svg"):
        fetch_image("https://x/a.png", image_client("image/svg+xml", b"<svg/>"))
    with pytest.raises(ValueError, match="Not a raster image: text/html"):
        fetch_image("https://x/a.png", image_client("text/html", b"<html>"))
    big = web.MAX_IMAGE_BYTES + 1
    with pytest.raises(ValueError, match="too large"):
        fetch_image("https://x/a.png", image_client("image/png", b"x", length=big))
    assert fetch_image("https://x/a.png", image_client("image/png", b"PNG")) == b"PNG"


def resolver(table: dict[str, str]):
    return lambda host: [table[host]]


def test_fetch_image_refuses_private_hosts(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(web, "_resolve", resolver({"router.lan": "192.168.1.1"}))
    client = image_client("image/png", b"PNG")
    with pytest.raises(ValueError, match="private network"):
        fetch_image("http://router.lan/reboot.png", client, page_url=URL)


def test_fetch_image_allows_the_pages_own_host(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(web, "_resolve", resolver({"192.168.1.10": "192.168.1.10"}))
    client = image_client("image/png", b"PNG")
    page = "http://192.168.1.10/index.html"
    assert fetch_image("http://192.168.1.10/a.png", client, page_url=page) == b"PNG"


def test_fetch_image_checks_every_redirect(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        web,
        "_resolve",
        resolver({"cdn.example.com": "93.184.215.14", "127.0.0.1": "127.0.0.1"}),
    )
    routes = {
        "https://cdn.example.com/a.png": httpx.Response(
            302, headers={"location": "http://127.0.0.1/admin.png"}
        ),
        "http://127.0.0.1/admin.png": httpx.Response(
            200, headers={"content-type": "image/png"}, content=b"PNG"
        ),
    }
    client = httpx.Client(
        transport=httpx.MockTransport(lambda request: routes[str(request.url)])
    )
    with pytest.raises(ValueError, match="private network"):
        fetch_image("https://cdn.example.com/a.png", client, page_url=URL)
