import requests
import streamlit as st
from config import API_BASE_URL


def get_physical_environment_data(geometry):
    """Get the physical environment data from the API."""
    response = requests.post(
        f"{API_BASE_URL}/arcgis/physical_environment", json=geometry.model_dump(), timeout=50
    )
    if response.status_code == 200:
        return response.json()
    st.error("Error retrieving ArcGIS data. Please try again.")
