import streamlit as st
from components.map import render_map
from components.sidebar import render_sidebar
from config import BTN_LABEL, MAP_CENTER, MAP_ZOOM, MAX_ALLOWED_AREA_SIZE
from helpers.transform import transform_polygon_to_rings
from models.arcgis import ArcGISContextData, ArcGISGeometry
from models.description import DescriptionType, Language
from services.context_data import get_physical_environment_data
from services.description import get_description
from utils.validation import selected_bbox_in_boundary, selected_bbox_too_large


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

    # Initialize session state variables if not already set
    if "show_profile_selector" not in st.session_state:
        st.session_state.show_profile_selector = False
    if "selected_description" not in st.session_state:
        st.session_state.selected_description = None
    if "previous_selected_description" not in st.session_state:
        st.session_state.previous_selected_description = None

    geojson = render_map(MAP_CENTER, MAP_ZOOM)

    with st.sidebar:
        render_sidebar(
            BTN_LABEL,
            st.session_state,
        )

        # Progress bar
        progress_bar = st.sidebar.progress(0)
        progress_bar.empty()

        if geojson:
            geometry = geojson["geometry"]
            if selected_bbox_too_large(geometry, threshold=MAX_ALLOWED_AREA_SIZE):
                st.sidebar.warning("Selected region is too large. Please select a smaller region.")
            elif not selected_bbox_in_boundary(geometry):
                st.sidebar.warning("Selected rectangle is outside the allowed region.")
            else:
                transformed_geometry = transform_polygon_to_rings(geojson)
                arcgis_geometry = ArcGISGeometry(geometry=transformed_geometry)

                if not st.session_state.selected_description:
                    arcgis_data = get_physical_environment_data(arcgis_geometry)
                    st.subheader("ArcGIS Data")
                    st.json(arcgis_data)
                else:
                    description_type = DescriptionType(text=st.session_state.selected_description)
                    language = Language(text="es")
                    arcgis_data = get_physical_environment_data(arcgis_geometry)
                    context_data = ArcGISContextData(data=arcgis_data)
                    description = get_description(context_data, description_type, language)
                    st.subheader("Description")
                    st.write(description)


if __name__ == "__main__":
    main()
