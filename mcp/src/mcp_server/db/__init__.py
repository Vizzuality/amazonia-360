from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

_DRIVERLESS = ("postgres://", "postgresql://")


def engine_url(url: str) -> str:
    """The same URL with the asyncpg driver, so the deployment can pass the plain
    postgres:// form other services use."""
    for prefix in _DRIVERLESS:
        if url.startswith(prefix):
            return "postgresql+asyncpg://" + url.removeprefix(prefix)
    return url


def create_engine(url: str) -> AsyncEngine:
    return create_async_engine(engine_url(url), pool_pre_ping=True)


def session_maker(engine: AsyncEngine) -> async_sessionmaker[AsyncSession]:
    # Rows are read after the session closes, when a handler builds its response.
    return async_sessionmaker(engine, expire_on_commit=False)
