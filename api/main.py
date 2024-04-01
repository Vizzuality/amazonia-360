from fastapi import FastAPI, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from config.config import get_settings
from database.database import get_db

app = FastAPI()

settings = get_settings()
print(settings)


@app.get("/")
def get_random_geom(db: Session = Depends(get_db)):
    try:
        return db.execute(text(
            "SELECT ST_AsGeoJSON(ST_Buffer(ST_SetSRID(ST_MakePoint(-73.985656, 40.748817), 4326),RANDOM() * 1000 )) AS geojson_buffer")).fetchone()[
            0]
    except Exception as e:
        return str(e)

