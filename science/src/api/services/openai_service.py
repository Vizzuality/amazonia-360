import json

from config import OPENAI_API_KEY
from openai import OpenAI


async def generate_description(
    context_data: dict, description_type: str, language: str
) -> dict[str, str] | str:
    """
    Generate a description using OpenAI's Chat Completions API based on context data, a
    description type, and the desired language.

    Parameters:
        context_data (dict): Data providing the context of the description (e.g., regional details).
        description_type (str): The type of description to generate. Allowed values are:
            - "Sort": A concise, executive-style description.
            - "Normal": A standard description.
            - "Long": A detailed description with a focus on environmental aspects.
        language (str): The language in which the description should be output.

    Returns:
        str | dict: Generated description or an error message in case of a failure.
    """
    # Validate input data
    if not context_data or not context_data.data:
        return {"error": "Missing or invalid contextual data."}
    if description_type.text not in {"Sort", "Normal", "Long"}:
        return {
            "error": "Missing or invalid description type. Choose from 'Sort', 'Normal', or 'Long'."
        }
    if not language:
        return {"error": "Missing language specification."}

    # Prepare system message with dynamic instructions based on description type and language
    system_message = {
        "role": "system",
        "content": (
            f"You are a helpful assistant tasked with generating region descriptions based on "
            f"provided data. The description must be in {language.text}. "
            "Based on the requested description type, adjust the style as follows:\n"
            "- **Sort:** Provide a concise, executive-style overview.\n"
            "- **Normal:** Provide a standard, balanced description.\n"
            "- **Long:** Provide a detailed description with a focus on environmental aspects.\n"
            "The description should be engaging and formatted in Markdown, for example, formatting "
            "names or places as **bold text**. Avoid introductory or welcoming phrases."
        ),
    }

    # Prepare user message with contextual data and description type
    user_message = {
        "role": "user",
        "content": (
            f"Contextual Data: {json.dumps(context_data.data, indent=2)}\n"
            f"Description Type: {description_type.text}\n"
            f"Language: {language.text}\n\n"
            "Description:"
        ),
    }

    # Initialize the OpenAI client
    client = OpenAI(api_key=OPENAI_API_KEY)

    try:
        # Make the API call
        completion = client.chat.completions.create(
            model="gpt-4o",
            messages=[system_message, user_message],
            max_tokens=1024,
            temperature=0.7,
        )
    except Exception as e:
        # Handle API errors
        return {"error": f"API request failed: {str(e)}"}

    # Extract and validate the response content
    if not completion or not completion.choices[0] or not completion.choices[0].message.content:
        return {"error": "API response was empty or invalid."}

    description = completion.choices[0].message.content.strip()
    if not description:
        return {"error": "Description generation failed."}

    return description
