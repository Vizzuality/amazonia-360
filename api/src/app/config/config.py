"""Global configuration for the application."""

from functools import lru_cache

from pydantic import SecretStr
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Global configuration for the application."""

    auth_token: str
    tiff_path: str
    grid_tiles_path: str
    tile_to_cell_resolution_diff: int = 5
    openai_token: SecretStr


@lru_cache
def get_settings() -> Settings:
    """Return the global configuration."""
    return Settings()
