import json

from config import OPENAI_API_KEY
from openai import OpenAI


async def generate_description(context_data: dict, profile: dict) -> dict[str, str] | str:
    """
    Generate a description using OpenAI's Chat Completions API based on context data and an
    audience profile.

    Parameters:
        context_data (dict): Data providing the context of the description (e.g., regional details).
        profile (dict): Audience profile specifying the target audience for the description.

    Returns:
        str | dict: Generated description or an error message in case of a failure.
    """
    # Validate input data
    if not context_data or not context_data.data:
        return {"error": "Missing or invalid contextual data."}
    if not profile or not profile.text:
        return {"error": "Missing or invalid audience profile."}

    # Prepare system and user messages
    system_message = {
        "role": "system",
        "content": (
            "You are a helpful assistant tasked with generating detailed and "
            "audience-specific descriptions of regions based on provided data. "
            "The description must be carefully tailored to the given audience profile provided. "
            "Consider the knowledge level, interests, and language preferences of the audience "
            "profile to craft an engaging, relevant, and accessible description. "
            "For example:\n"
            "- For a General Public audience, use simple and relatable language, emphasizing "
            "interesting or visually striking details.\n"
            "- For Conservationists, focus on ecological significance, biodiversity, and "
            "environmental challenges.\n"
            "- For Finances, highlight economic opportunities, risks, or cost-benefit "
            "aspects related to the region.\n"
            "Generate a concise paragraph (no more than 100 words). Format names and places using "
            "Markdown as **bold text**."
            "Avoid welcoming or introductory phrases."
        ),
    }
    user_message = {
        "role": "user",
        "content": (
            f"Contextual Data: {json.dumps(context_data.data, indent=2)}\n"
            f"Audience Profile: {profile.text}\n\n"
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

    description = completion.choices[0].message.content  # .strip()
    if not description:
        return {"error": "Description generation failed."}

    return description
