from typing import List

import folium
from folium.plugins import Draw


class FoliumMap(folium.Map):
    """
    A custom Map class that can display Google Earth Engine tiles.

    Inherits from folium.Map class.
    """

    def __init__(self, center: List[float] = [25.0, 55.0], zoom: int = 3, **kwargs):
        """
        Constructor for MapGEE class.

        Parameters:
        center: list, default [25.0, 55.0]
            The current center of the map.
        zoom: int, default 3
            The current zoom value of the map.
        **kwargs: Additional arguments that are passed to the parent constructor.
        """
        self.center = center
        self.zoom = zoom
        super().__init__(
            location=self.center,
            zoom_start=self.zoom,
            control_scale=True,
            attr='Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            **kwargs,
        )

        self.add_draw_control()

    def add_draw_control(self):
        draw = Draw(
            export=False,
            position="topleft",
            draw_options={
                "polyline": False,
                "poly": False,
                "circle": False,
                "polygon": False,
                "marker": False,
                "circlemarker": False,
                "rectangle": True,
            },
        )

        draw.add_to(self)
