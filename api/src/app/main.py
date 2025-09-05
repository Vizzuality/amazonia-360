from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse

from app.auth.auth import verify_token
from app.config import get_settings
from app.errors import add_exception_handlers
from app.routers.grid import grid_router
from app.routers.text_generation import router as ai_router

# Use ORJSONResponse to handle serialization of NaN values. Normal Json fails to serialize NaN values.
app = FastAPI(title="Amazonia360 API", default_response_class=ORJSONResponse)

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

app.include_router(grid_router, prefix="/grid", tags=["Grid"], dependencies=[Depends(verify_token)])
app.include_router(ai_router, prefix="/ai", tags=["Text Generation"], dependencies=[Depends(verify_token)])
add_exception_handlers(app)

_ = get_settings()  # load settings at startup to check for issues


@app.get("/health")
async def health():
    """Health check."""
    return {"status": "ok"}
