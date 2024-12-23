import requests
import streamlit as st
from config import API_BASE_URL


def get_biomes_data(geometry):
    """Get the biomes data from the API."""
    response = requests.post(
        f"{API_BASE_URL}/arcgis/biomes", json=geometry.model_dump(), timeout=50
    )
    if response.status_code == 200:
        return response.json()
    st.error("Error retrieving ArcGIS data. Please try again.")


def display_context_data(geometry):
    """Display the context data for the selected region."""
    arcgis_data = get_biomes_data(geometry)
    if arcgis_data:
        st.subheader("ArcGIS Data")
        st.json(arcgis_data)
