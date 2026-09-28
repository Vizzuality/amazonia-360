import hashlib
import secrets


def new_secret() -> str:
    """256 random bits, URL-safe: tokens, codes, pending ids and CSRF tokens."""
    return secrets.token_urlsafe(32)


def digest(value: str) -> str:
    """What the database keeps instead of a secret, so a leaked row grants nothing."""
    return hashlib.sha256(value.encode()).hexdigest()
