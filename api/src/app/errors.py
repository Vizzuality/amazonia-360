from collections.abc import Callable

from fastapi import FastAPI
from h3 import H3CellInvalidError
from starlette import status
from starlette.requests import Request
from starlette.responses import JSONResponse, Response


class ColumnNotFoundError(Exception):
    """Column provided does not exist in the dataset"""


class TileNotFoundError(Exception):
    """Tile does not exist in the dataset"""


class MetadataError(Exception):
    """Metadata file is non existent or malformed"""


class FilterError(Exception):
    """Table filter is not valid"""


DEFAULT_STATUS_CODES = {
    H3CellInvalidError: status.HTTP_400_BAD_REQUEST,
    TileNotFoundError: status.HTTP_404_NOT_FOUND,
    MetadataError: status.HTTP_500_INTERNAL_SERVER_ERROR,
    FilterError: status.HTTP_400_BAD_REQUEST,
    ColumnNotFoundError: status.HTTP_400_BAD_REQUEST,
    Exception: status.HTTP_500_INTERNAL_SERVER_ERROR,
}


def exception_handler_factory(status_code: int) -> Callable:
    """
    Create a FastAPI exception handler from a status code.
    """

    def handler(request: Request, exc: Exception):
        if status_code == status.HTTP_204_NO_CONTENT:
            return Response(content=None, status_code=204)

        return JSONResponse(content={"detail": str(exc)}, status_code=status_code)

    return handler


def add_exception_handlers(app: FastAPI) -> None:
    """
    Add exception handlers to the FastAPI app.
    """
    for exc, code in DEFAULT_STATUS_CODES.items():
        app.add_exception_handler(exc, exception_handler_factory(code))
