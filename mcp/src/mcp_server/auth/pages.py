from html import escape

from starlette.responses import HTMLResponse

_HEADERS = {
    # The consent page must never be framed (clickjacking) or cached. No form-action:
    # Chromium applies it to the redirect that follows the form POST too, so it would
    # block the 303 back to the client after consent. The page runs no script
    # (default-src 'none') and every value on it is escaped, so the omission is safe.
    "Content-Security-Policy": (
        "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; "
        "base-uri 'none'"
    ),
    "X-Frame-Options": "DENY",
    "Cache-Control": "no-store",
    "Referrer-Policy": "no-referrer",
}

_STYLE = """
body { font-family: system-ui, sans-serif; max-width: 28rem; margin: 4rem auto;
       padding: 0 1rem; color: #1f2933; line-height: 1.5; }
h1 { font-size: 1.25rem; }
.buttons { display: flex; gap: .75rem; margin-top: 1.5rem; }
button { font: inherit; padding: .5rem 1rem; border-radius: .375rem;
         border: 1px solid #9aa5b1; background: #fff; cursor: pointer; }
button[value=allow] { background: #009ade; border-color: #009ade; color: #fff; }
"""


def _page(title: str, body: str, status_code: int) -> HTMLResponse:
    html = (
        f"<!doctype html><html lang=en><head><meta charset=utf-8>"
        f"<meta name=viewport content='width=device-width, initial-scale=1'>"
        f"<title>{escape(title)}</title><style>{_STYLE}</style></head>"
        f"<body>{body}</body></html>"
    )
    return HTMLResponse(html, status_code=status_code, headers=_HEADERS)


def error_page(message: str, status_code: int = 400) -> HTMLResponse:
    return _page(
        "Sign-in failed",
        f"<h1>Sign-in failed</h1><p>{escape(message)}</p>",
        status_code,
    )


def consent_page(
    client_name: str,
    redirect_host: str,
    email: str,
    pending_id: str,
    csrf: str,
    action: str,
) -> HTMLResponse:
    body = f"""
<h1>Allow access to the Amazonia 360 MCP?</h1>
<p><strong>{escape(client_name)}</strong> asks to use the Amazonia 360 MCP as
<strong>{escape(email)}</strong>.</p>
<p>After you allow it, you go back to <strong>{escape(redirect_host)}</strong>.
Allow it only if you started this connection there.</p>
<form method=post action="{escape(action)}">
<input type=hidden name="p" value="{escape(pending_id)}">
<input type=hidden name="csrf" value="{escape(csrf)}">
<div class=buttons>
<button type=submit name=decision value=allow>Allow</button>
<button type=submit name=decision value=deny>Cancel</button>
</div>
</form>"""
    return _page("Allow access", body, 200)
