# GeoDescriberAI

This Python package contains a [FastAPI](https://fastapi.tiangolo.com/) API and [Streamlit](https://streamlit.io/) APP that generates a description of a region based on a bounding box and a description request. 
It uses the [Overpass API](https://wiki.openstreetmap.org/wiki/Overpass_API) and the [OpenAI API](https://openai.com/blog/openai-api) for getting contextual data and geodescribing the region, respectively.

![](images/demo.png)

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

```
uvicorn main:app --reload
```
 
2. Once the server is running, you can send HTTP requests to the API endpoints.

   **`/context` Endpoint**

   - URL: http://localhost:8000/context
   - Method: POST
   - Request Body: JSON object with the following properties:
     - `min_lon`: Minimum longitude of the bounding box (optional)
     - `min_lat`: Minimum latitude of the bounding box (optional)
     - `max_lon`: Maximum longitude of the bounding box (optional)
     - `max_lat`: Maximum latitude of the bounding box (optional)

   Example Request:

      ```commandline
      curl -X POST -H "Content-Type: application/json" -d '{
        "min_lon": -16.974,
        "min_lat": 27.986,
        "max_lon": -16.101,
        "max_lat": 28.595
      }' http://localhost:8000/context
      ```
   
   **`/description` Endpoint**

   - URL: http://localhost:8000/context
   - Method: POST
   - Request Body: JSON object with the following properties:
     - `bbox`: Bounding box object with the same properties as the `/context` endpoint
     - `chat`: Chat object with a `text` property containing the chat text

   Example Request:

      ```commandline
      curl -X POST -H "Content-Type: application/json" -d '{
        "bbox": {
          "min_lon": -16.974,
          "min_lat": 27.986,
          "max_lon": -16.101,  
          "max_lat": 28.595
        },
        "chat": {
          "text": "Describe the history, climate, and landscape of the region."
        }
      }' http://localhost:8000/description
      ```
   
   Response:

      ```
      {
         "description": "Welcome to the region of **Tenerife**, a beautiful island located in the Atlantic Ocean and part of the Canary Islands. The history of Tenerife dates back to the 15th century when the island was conquered by Spain. The island's indigenous people, known as Guanches, were the first to inhabit the island before the Spanish conquest. Today, the island is a popular tourist destination, attracting millions of visitors every year.\n\nThe climate of Tenerife is subtropical, with mild temperatures throughout the year. The island has a warm and dry climate, with temperatures ranging from 20°C to 30°C in the summer months and 15°C to 25°C in the winter months. The island's climate is influenced by the trade winds, which bring cool breezes from the Atlantic Ocean.\n\nThe landscape of Tenerife is diverse and unique, with a mix of volcanic and coastal features. The island is home to one of the world's largest volcanoes, **Teide**, which is also a UNESCO World Heritage Site. The volcanic landscape of Tenerife is characterized by steep cliffs, deep gorges, and rugged terrain. The island also has a beautiful coastline, with sandy beaches and crystal-clear waters. Tenerife is also home to two protected areas, the **Parque Rural de Teno** and the **Parque Rural de Anaga**, which are rich in biodiversity and offer stunning views of the island's landscape.\n\nIn summary, Tenerife is a region with a rich history, a subtropical climate, and a diverse landscape that includes volcanic mountains, rugged terrain, and beautiful coastlines."
      }
      ```

### Streamlit APP

After starting the FastAPI server run the Streamlit app, use the following command:

```
streamlit run app.py
```

This will launch the app in your default web browser.

1. Click the black square on the map
2. Draw a rectangle on the map
3. Provide your description request in the textbox below
4. Click on `Submit`
5. Wait for the computation to finish
   
## License
This project is licensed under the [MIT License](LICENSE).
