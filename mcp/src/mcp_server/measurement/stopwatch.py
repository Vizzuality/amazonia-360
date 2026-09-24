from collections.abc import Iterator
from contextlib import contextmanager
from time import perf_counter


class Stopwatch:
    def __init__(self) -> None:
        self._start = perf_counter()
        self._laps: dict[str, float] = {}

    @contextmanager
    def lap(self, name: str) -> Iterator[None]:
        started = perf_counter()
        try:
            yield
        finally:
            self._laps[name] = self._laps.get(name, 0.0) + perf_counter() - started

    def ms(self, name: str) -> int:
        return round(self._laps.get(name, 0.0) * 1000)

    def total_ms(self) -> int:
        return round((perf_counter() - self._start) * 1000)
