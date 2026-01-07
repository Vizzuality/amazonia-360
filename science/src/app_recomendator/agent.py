import os
import json

import dotenv
from langchain import tools
from langchain.agents import create_agent
from langchain_openai import ChatOpenAI
from typing_extensions import TypedDict

from indicators_list import get_indicator_list


dotenv.load_dotenv()

indicator_data = get_indicator_list()

indicator_list_json = json.dumps(indicator_data, indent=2)

class IndicatorSelection(TypedDict):
    """Represents the selection of indicators as a list."""
    indicator_ids: list[str]

def create_recommender_agent(indicator_data = indicator_list_json, model = "gpt-4o-mini", temperature=0):
    """
    Create an OpenAI recommender agent using LangChain that suggests indicators based on user queries.
    
    Args:
        indicator_data (str): JSON string of indicators to be used by the agent.
        model (str): The model name to be used by the ChatOpenAI instance.
        temperature (float): The temperature setting for the ChatOpenAI instance.
    
    Returns:
        Agent: A LangChain agent configured for recommending indicators.
    """

    system_template = f"""
    You are an intelligent assistant that recomends indicators from the provided dataset list based on user's input.
    ONLY include indicators that are on the provided data, do NOT invent new ones. You are NOT ALLOWED to include indicators that are not in the dataset.
    The suggestions must be relevant in the context of environmental, social and economic monitoring in the Amazonia region, ignore unrelated topics.
    The output must be in the form of a list of dictionary objects with the following 3 fields:  
    -name: the name of the indicator, it MUST exactly as it comes in the 'name_en' field of the dataset
    -explanation: brief explanation of why the indicator is of interest
    -visualization: an array with the suggested type or types of visualization for the data, selecting one or many between 🌎 Map, 📊 Chart or 🔢 Number
    
    If the prompt is not related to the data or to environmental and social monitoring in the Amazonia region,
    respond with an empty list.
    Take into account all the available indicators, basing the selection on the fields: 'name_en', 'description_en'.

    If the user's input is a sentence or text, you must return a list of recommended indicator IDs that match the user's interest.
    If the user's prompt is a list of indicators, return a new list of related indicators from
    the dataset. indicators suggested in this new list must be different from those provided, and related to the context of those included in the  initial list.
    Recommend at least 5 indicators and at most 15 to match the user's interest when the input is a text.
    If the input is a list of indicators, recommend at least 3 and at most 8 different but related indicators.

    DATA:
    {indicator_data}

    Be accurate and only use the information from the dataset above.
    If the prompt is not related to the data, respond with an empty list.

    Examples of invalid behaviors you must NEVER do:
    - Suggest "Water Bodies" or "Biodiversity Loss" if it's not in the list.
    - Reword indicators (e.g., "Forest coverage" instead of "Forest cover").
    - Invent composite indicators.
    - Infer synonyms or alternative names.
    """

    model = ChatOpenAI(model=model, temperature=temperature)

    agent_full = create_agent(model,
                     tools=[],
                     system_prompt=system_template,
                     #response_format=IndicatorSelection
                     )

    return agent_full

