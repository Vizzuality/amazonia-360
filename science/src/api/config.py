import os

from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# ArcGIS Configuration
ARC_GIS_BASE_URL = "https://services6.arcgis.com/sROlVM0rATIYgC6a/arcgis/rest/services"
ARC_GIS_TOKEN = os.getenv("ESRI_TOKEN")

# OpenAI Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
