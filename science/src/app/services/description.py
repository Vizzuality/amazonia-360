import requests
import streamlit as st
from config import API_BASE_URL


def get_description(context_data, description_type, language):
    """Get the description for the selected region."""
    response = requests.post(
        f"{API_BASE_URL}/description",
        json={
            "context_data": context_data.model_dump(),
            "description_type": description_type.model_dump(),
            "language": language.model_dump(),
        },
        timeout=50,
    )
    if response.status_code == 200:
        return response.json().get("description")
    st.error("Error retrieving description. Please try again.")
