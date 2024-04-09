"""Global configuration for the application."""

from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Global configuration for the application."""

    auth_token: str
    tiff_path: str


@lru_cache
def get_settings() -> Settings:
    """Return the global configuration."""
    return Settings()
