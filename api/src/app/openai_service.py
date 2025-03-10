import json

from openai import OpenAI, OpenAIError

from app.config.config import get_settings


def generate_description(context_data: dict, description_type: str, language: str) -> str:
    """
    Generate a description using OpenAI's Chat Completions API based on context data, a
    description type, and the desired language.

    Parameters:
        context_data (dict): Data providing the context of the description (e.g., regional details).
        description_type (str): The type of description to generate. Allowed values are:
            - "Short": A concise, executive-style description.
            - "Normal": A standard description.
            - "Long": A detailed description with a focus on environmental aspects.
        language (str): The language in which the description should be output.

    Returns:
        str | dict: Generated description or an error message in case of a failure.
    """
    # Prepare system message with dynamic instructions based on description type and language
    system_message = {
        "role": "system",
        "content": (
            f"You are an AI assistant tasked with generating engaging and insightful regional descriptions "
            f"based on structured JSON data. The description must be in {language}. "
            "The data represents a custom area of analysis located in the Amazonia region and is grouped by indicators."
            "Your goal is to analyze the data and generate a cohesive, "
            "structured description that highlights key aspects and insights of the custom area and its context."
            "Use percentages whenever possible to enhance clarity and comparability."
            "Refer to the area of analysis with something like 'the selected area' or 'the region'."
            "The total area or relevant count may also be provided."
            "The output length should be based on user selection:\n"
            "- **Short:** A concise executive summary (around 2 sentences).\n"
            "- **Normal:** A balanced 2-paragraph description."
            "The first paragraph provides a general overview, while the second focuses on notable data points.\n"
            "- **Long:** A detailed, multi-paragraph analysis exploring deeper environmental "
            "insights, trends, and main implications.\n"
            "The description must be engaging, informative, and contextually relevant, "
            "leveraging knowledge of Amazonia’s ecosystem, geography, "
            "and conservation efforts to enrich the narrative."
            "Use Markdown formatting for the most critical insights, such as key figures, names, and classifications."
            "Avoid using headers, blockquotes, or introductory phrases."
            "Avoid using using code names like SOL-T-XXX or BR-Lxxx."
        ),
    }

    # Prepare user message with contextual data and description type
    user_message = {
        "role": "user",
        "content": (
            f"Contextual Data: {json.dumps(context_data, indent=2)}\n"
            f"Description Type: {description_type}\n"
            f"Language: {language}\n\n"
            "Description:"
        ),
    }

    # Initialize the OpenAI client
    client = OpenAI(api_key=get_settings().openai_token.get_secret_value())

    # Make the API call
    completion = client.chat.completions.create(
        model="gpt-4o",
        messages=[system_message, user_message],  # type: ignore
        max_tokens=1024,
        temperature=0.7,
    )

    # Extract and validate the response content
    if not completion or not completion.choices[0] or not completion.choices[0].message.content:
        raise OpenAIError("OpenAI API response was empty or invalid")
    description = completion.choices[0].message.content.strip()
    return description
