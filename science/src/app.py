import requests
import streamlit as st
from pydantic import BaseModel
from streamlit_folium import st_folium

from helpers.map import FoliumMap
from helpers.utils import transform_polygon_to_rings
from helpers.verification import selected_bbox_in_boundary, selected_bbox_too_large

MAP_CENTER = [-10, -44]
MAP_ZOOM = 4
MAX_ALLOWED_AREA_SIZE = 500.0
BTN_LABEL = "Generate AI Summary"
API_BASE_URL = "http://localhost:8000"


class ArcGISParams(BaseModel):
    """
    ArcGIS API parameters
    """

    indicator: str = "AFP_Biomas"
    geometry: str
    return_geometry: str = "true"


class ArcGISGeometry(BaseModel):
    """
    ArcGIS API compatible geometry
    """

    geometry: str


class Profile(BaseModel):
    """
    Audience profile for the description
    """

    text: str = "General Public"


def get_biomes_data(geometry):
    """
    Get the biomes data from the API.
    """
    response = requests.post(
        f"{API_BASE_URL}/arcgis/biomes", json=geometry.model_dump(), timeout=50
    )
    if response.status_code == 200:
        arcgis_data = response.json()
        return arcgis_data
    else:
        st.error("Error retrieving ArcGIS data. Please try again.")


def display_context_data(geometry):
    """
    Display the context data for the selected region.
    """
    st.subheader("ArcGIS Data")
    response = requests.post(
        f"{API_BASE_URL}/arcgis/biomes", json=geometry.model_dump(), timeout=50
    )
    if response.status_code == 200:
        arcgis_data = response.json()
        st.json(arcgis_data)
    else:
        st.error("Error retrieving ArcGIS data. Please try again.")


def display_description(geometry, profile):
    """
    Display the description for the selected region.
    """
    st.subheader("Description")
    response = requests.post(
        f"{API_BASE_URL}/description",
        json={"arcgis_geometry": geometry.model_dump(), "audience_profile": profile.model_dump()},
        timeout=50,
    )
    if response.status_code == 200:
        description = response.json()["description"]
        st.write(description)
    else:
        st.error("Error retrieving description. Please try again.")


# Create the Streamlit app and define the main code:
def main():
    """
    Main function for the Streamlit app with sidebar modal-like integration.
    """
    st.set_page_config(
        page_title="mapa",
        page_icon=":earth_africa:",
        layout="wide",
        initial_sidebar_state="expanded",
    )
    st.title(":earth_africa: Amazonia360 AI summary Demo")

    # Initialize session state
    if "show_profile_selector" not in st.session_state:
        st.session_state.show_profile_selector = False
    if "selected_profile" not in st.session_state:
        st.session_state.selected_profile = None

    # Map
    m = FoliumMap(center=MAP_CENTER, zoom=MAP_ZOOM)
    output = st_folium(m, key="init", width=1300, height=600)

    geojson = None
    if output["all_drawings"] is not None and len(output["all_drawings"]) != 0:
        if output["last_active_drawing"] is not None:
            geojson = output["last_active_drawing"]

    # Sidebar logic
    with st.sidebar:
        st.subheader("Getting Started")
        st.markdown(
            f"""
                1. Click the black square on the map
                2. Draw a rectangle on the map
                3. Click on <kbd>{BTN_LABEL}</kbd>
                4. Select the profile that best matches your audience
                5. Wait for the computation to finish
            """,
            unsafe_allow_html=True,
        )

        # Button to open the profile selector
        if st.button("Generate AI Summary"):
            st.session_state.show_profile_selector = True

        # Conditional rendering for profile selection
        if st.session_state.show_profile_selector:
            st.write("**Select the profile that best matches your audience:**")
            col1, col2, col3 = st.columns(3)
            with col1:
                if st.button("General Public", key="general_public"):
                    st.session_state.selected_profile = "General Public"
            with col2:
                if st.button("Finances", key="finances"):
                    st.session_state.selected_profile = "Finances"
            with col3:
                if st.button("Conservationists", key="conservationists"):
                    st.session_state.selected_profile = "Conservationists"

            # Display selected profile
            if st.session_state.selected_profile:
                st.success(f"Selected Profile: **{st.session_state.selected_profile}**")
                st.session_state.show_profile_selector = False  # Hide after selection

        # Progress bar
        progress_bar = st.sidebar.progress(0)
        progress_bar.empty()

        # Check if valid submission
        if geojson or st.session_state.selected_profile:
            geometry = geojson["geometry"]
            if selected_bbox_too_large(geometry, threshold=MAX_ALLOWED_AREA_SIZE):
                st.sidebar.warning("Selected region is too large. Please select a smaller region.")
            elif not selected_bbox_in_boundary(geometry):
                st.sidebar.warning("Selected rectangle is outside the allowed region.")
            else:
                geometry = transform_polygon_to_rings(geojson)
                arcgis_geometry = ArcGISGeometry(geometry=geometry)

                if geojson and not st.session_state.selected_profile:
                    display_context_data(arcgis_geometry)
                if geojson and st.session_state.selected_profile:
                    audience_profile = Profile(text=st.session_state.selected_profile)
                    display_description(arcgis_geometry, audience_profile)
                    st.sidebar.success("Successfully created description!")


if __name__ == "__main__":
    main()
