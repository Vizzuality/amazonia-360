"""
Load test configuration and utilities.

This module contains configuration settings and helper functions
for load testing scenarios.
"""

import base64
from pathlib import Path

from pydantic import computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Load test configuration settings from a .env file or from the os environment"""

    model_config = SettingsConfigDict(
        env_file=Path(__file__).parent / ".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    TARGET_INSTANCE_BASE_URL: str
    ACCESS_TOKEN: str | None = None
    BASIC_AUTH_CREDENTIALS: str | None = None

    @computed_field
    @property
    def BASE_AUTH_TOKEN(self) -> str | None:
        """Base64 encoded basic auth credentials."""
        if not self.BASIC_AUTH_CREDENTIALS:
            return None
        return base64.b64encode(self.BASIC_AUTH_CREDENTIALS.encode()).decode()


# Create a single instance of settings to be imported by other modules
settings = Settings()
