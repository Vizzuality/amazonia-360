import json
import os

from dotenv import load_dotenv
from langchain.schema import AIMessage, SystemMessage
from langchain_openai import ChatOpenAI

# take environment variables from .env.
load_dotenv()

openai_api_key = os.getenv("OPENAI_API_KEY")


async def get_openai_api_response(data, profile) -> dict[str, str] | str:
    """
    Get the response from the OpenAI API.
    """

    system_message = """You are an environmental scientist that will generate a detailed "
    "description of the data provided as 'contextual data' for a given region. "
    "Your description should sound like it was spoken by someone with personal knowledge "
    "of the data, and should be oriented towards the audience profile provided as "
    "'audience_profile'."
    Your description has to be concise and informative, and should not exceed a paragraph.
    Format any names or places you get as bold text in Markdown.
    Do not mention who you are or the Overpass API, just give the description of the place."""

    context = f"""
    contextual data: {json.dumps(data)}
    audience profile: {profile.text}
    """

    chat = ChatOpenAI(
        model="gpt-4o", max_tokens=1024, temperature=0.7, openai_api_key=openai_api_key
    )

    try:
        chat_response = chat.invoke(
            [
                SystemMessage(content=system_message),
                AIMessage(content=context),
                # HumanMessage(content=request),
            ]
        )
    except Exception as e:
        return {"error": str(e)}

    description = chat_response.content

    return description
