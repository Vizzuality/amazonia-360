# AmazoniaForever360+ prototypes

> ⚠ Note: This module is **not for production**. Just used for prototyping purposes.

This Python package contains a [FastAPI](https://fastapi.tiangolo.com/) API and [Streamlit](https://streamlit.io/) APP that generates a description of a region based on a bounding box and a description request. 
It uses the [ArcGIS API](https://developers.arcgis.com/rest/) and the [OpenAI API](https://openai.com/blog/openai-api) for getting contextual data and geodescribing the region, respectively.


## Installation

1. Create a virtual environment with Python 3.12: `uv venv --python 3.12`
2. Activate the virtual environment: `source .venv/bin/activate`
3. Install the required packages: `uv pip install -r requirements.txt`
4. Create a `.env` file with your OpenAI API key:

    ```
    OPENAI_API_KEY=your_openai_api_key
    ```

## Usage

### FastAPI

This is a FastAPI-based API that generates a description of a region based on a bounding box (bbox) and a description request (chat). 
It utilizes external APIs for obtaining context data and generating descriptions.

1. To start the FastAPI server, use the following command:
first go to the api directory
```
cd src/api
```

then run the server
```
uvicorn main:app --reload
```
 
2. Once the server is running, you can send HTTP requests to the API endpoints.

   **`/arcgis/biomes` Endpoint**

   - URL: http://localhost:8000/arcgis/biomes
   - Method: POST
   - Request Body: JSON object with the following properties:
     - `geometry`: Geometry object with a `rings` property containing the coordinates of the bounding box

   Example Request:

      ```commandline
      curl -X POST -H "Content-Type: application/json" -d '{
        "geometry": '{"rings": [[[-6741134.440271073, -1800244.8807249486], [-6741134.440271073, -1487158.7652183967], [-6310641.041309215, -1487158.7652183967], [-6310641.041309215, -1800244.8807249486], [-6741134.440271073, -1800244.8807249486]]]}'
      }' http://localhost:8000/arcgis/biomes
      ```
   
   **`/description` Endpoint**

   - URL: http://localhost:8000/description
   - Method: POST
   - Request Body: JSON object with the following properties:
     - `arcgis_geometry`: Geometry object with a `rings` property containing the coordinates of the bounding box
     - `audience_profile`: String with the audience profile (e.g., "General Public", "Finances", "Conservationists")

   Example Request:

      ```commandline
      curl -X POST -H "Content-Type: application/json" -d '{
        "arcgis_geometry": '{"rings": [[[-6741134.440271073, -1800244.8807249486], [-6741134.440271073, -1487158.7652183967], [-6310641.041309215, -1487158.7652183967], [-6310641.041309215, -1800244.8807249486], [-6741134.440271073, -1800244.8807249486]]]}',
        "audience_profile": 'General Public'
      }' http://localhost:8000/description
      ```

### Streamlit APP

After starting the FastAPI server run the Streamlit app, use the following command:

first go to the app directory
```
cd src/app
```

then run the app
```
streamlit run main.py
```

This will launch the app in your default web browser.

1. Click the black square on the map
2. Draw a rectangle on the map
3. Click on `Generate AI Summary` 
4. Select the profile that best matches your audience
5. Wait for the computation to finish
   
## License
This project is licensed under the [MIT License](LICENSE).
