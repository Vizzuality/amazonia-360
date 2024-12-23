from streamlit_folium import st_folium

from helpers.map import FoliumMap


def render_map(center, zoom):
    """Render the map and handle user interactions."""
    m = FoliumMap(center=center, zoom=zoom)
    output = st_folium(m, key="init", width=1300, height=600)
    if output["all_drawings"] and len(output["all_drawings"]) != 0:
        if output["last_active_drawing"]:
            return output["last_active_drawing"]
    return None
