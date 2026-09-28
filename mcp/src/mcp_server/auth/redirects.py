from collections.abc import Iterable
from urllib.parse import SplitResult, urlsplit

_LOOPBACK = {"localhost", "127.0.0.1"}


def _any_loopback_port(entry: SplitResult) -> bool:
    # A bare "http://localhost" entry stands for every port and path: native clients
    # listen on a port they choose at run time (RFC 8252 §7.3).
    return (
        entry.scheme == "http"
        and entry.hostname in _LOOPBACK
        and entry.port is None
        and entry.path in ("", "/")
        and not entry.query
    )


def redirect_allowed(uri: str, allowlist: Iterable[str]) -> bool:
    try:
        parts = urlsplit(uri)
        parts.port  # noqa: B018 - raises ValueError on a malformed port
    except ValueError:
        return False
    if parts.username is not None or parts.password is not None or parts.fragment:
        return False
    for entry in allowlist:
        allowed = urlsplit(entry)
        if _any_loopback_port(allowed):
            if parts.scheme == "http" and parts.hostname == allowed.hostname:
                return True
        elif uri == entry:
            return True
    return False
