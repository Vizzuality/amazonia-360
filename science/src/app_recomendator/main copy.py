import json
import os

import dotenv
from langchain.agents import create_agent
from langchain_openai import ChatOpenAI
import streamlit as st
from typing_extensions import TypedDict

from agent import create_recommender_agent


dotenv.load_dotenv()

st.title("AmazoniaForever360+ " \
        "AI Assistant")

agent = create_recommender_agent()

with st.form("indicator_recommender_form"):
    user_input = st.text_area("Enter your monitoing interests or a list of indicators:")
    submitted = st.form_submit_button("Get Recommendations")
    if submitted:
        # add loading spinner
        with st.spinner("Generating recommendations..."):
            if user_input.strip() == "":
                st.warning("Please enter a valid input.")
            else:
                response = agent.invoke({'messages': [{"role": "user", "content": user_input}]})
                recommended_indicators = response['messages'][-1].content
                recommended_indicators_list = json.loads(recommended_indicators)
                
                if len(recommended_indicators_list) > 0:
                    st.success("Here are your recommended Indicators:")
                    for ind_id in recommended_indicators_list:
                        st.markdown(f"**Name:** {ind_id['name']}")
                        st.markdown(f"**Explanation:** {ind_id['explanation']}")
                        st.markdown(f"**Visualisation:** {ind_id['visualization']}")
                        st.markdown("------------------")
                   
                else:
                    st.info("No relevant indicators found for the given input.")
            recommended_indicators_list = json.loads(recommended_indicators)
            


