"""Global configuration for the application."""

from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Global configuration for the application."""

    postgres_user: str
    postgres_password: str
    postgres_db: str
    postgres_host: str
    postgres_port: str
    auth_token: str
    tif_path: str

    class Config:  # noqa: D106
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    """Return the global configuration."""
    return Settings()
