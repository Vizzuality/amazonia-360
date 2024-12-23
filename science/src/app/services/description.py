import requests
import streamlit as st
from config import API_BASE_URL


def get_description(geometry, profile):
    """Get the description for the selected region."""
    response = requests.post(
        f"{API_BASE_URL}/description",
        json={"arcgis_geometry": geometry.model_dump(), "audience_profile": profile.model_dump()},
        timeout=50,
    )
    if response.status_code == 200:
        return response.json().get("description")
    st.error("Error retrieving description. Please try again.")
