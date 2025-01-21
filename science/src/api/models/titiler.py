from pydantic import BaseModel


class TiTilerParams(BaseModel):
    dataset: str = "population.tif"
    geometry: dict
