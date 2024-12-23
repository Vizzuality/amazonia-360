import json

from config import OPENAI_API_KEY
from langchain.schema import AIMessage, SystemMessage
from langchain_openai import ChatOpenAI


async def generate_description(context_data, profile) -> dict[str, str] | str:
    """
    Generate a description using OpenAI's API based on context data and an audience profile.

    Parameters:
        context_data (dict): Data providing the context of the description (e.g., regional details).
        profile (BaseModel): Audience profile specifying the target audience for the description.

    Returns:
        str: Generated description or an error message in case of a failure.
    """
    system_message = (
        "You are an environmental scientist that will generate a detailed "
        "description of the data provided as 'contextual data' for a given region. "
        "Your description should sound like it was spoken by someone with personal knowledge "
        "of the data, and should be oriented towards the audience profile provided as "
        "'audience_profile'. "
        "Your description has to be concise and informative, and should not exceed a paragraph. "
        "Format any names or places you get as **bold text** in Markdown. "
        "Do not mention who you are or the Overpass API, just give the description of the place."
    )

    # Format context and profile into the input message
    context = f"""
    contextual data: {json.dumps(context_data)}
    audience profile: {profile.text}
    """

    # Initialize the ChatOpenAI client
    chat = ChatOpenAI(
        model="gpt-4o", max_tokens=1024, temperature=0.7, openai_api_key=OPENAI_API_KEY
    )

    try:
        # Send the input to the OpenAI API
        chat_response = chat.invoke(
            [
                SystemMessage(content=system_message),
                AIMessage(content=context),
            ]
        )
    except Exception as e:
        # Handle errors and return them in a structured way
        return {"error": str(e)}

    # Extract and return the description from the response
    description = chat_response.content
    return description
