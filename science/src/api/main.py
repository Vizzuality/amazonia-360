from fastapi import FastAPI
from routers import context_data, description

app = FastAPI()

# Include routers
app.include_router(context_data.router, prefix="/context_data", tags=["Context data"])
app.include_router(description.router, prefix="/description", tags=["Description"])
