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

# Initialize session state
if 'query_successful' not in st.session_state:
    st.session_state.query_successful = False
if 'recommended_indicators_list' not in st.session_state:
    st.session_state.recommended_indicators_list = []
if 'more_indicators_list' not in st.session_state:
    st.session_state.more_indicators_list = []

agent = create_recommender_agent()

with st.form("indicator_recommender_form"):
    user_input = st.text_area("Enter your monitoring interests or a list of indicators:")
    submitted = st.form_submit_button("Get Recommendations")
    if submitted:
        # add loading spinner
        with st.spinner("Generating recommendations..."):
            if user_input.strip() == "":
                st.warning("Please enter a valid input.")
                st.session_state.query_successful = False
            else:
                response = agent.invoke({'messages': [{"role": "user", "content": user_input}]})
                recommended_indicators = response['messages'][-1].content
                recommended_indicators_list = json.loads(recommended_indicators)
                
                if len(recommended_indicators_list) > 0:
                    # Store successful query results in session state
                    st.session_state.query_successful = True
                    st.session_state.recommended_indicators_list = recommended_indicators_list
                    st.session_state.more_indicators_list = []  # Reset more indicators on new query
                else:
                    st.info("No relevant indicators found for the given input.")
                    st.session_state.query_successful = False

# Display initial recommendations (persisted across reruns)
if st.session_state.query_successful and len(st.session_state.recommended_indicators_list) > 0:
    st.success("Here are your recommended Indicators:")
    for ind_id in st.session_state.recommended_indicators_list:
        st.markdown(f"**Name:** {ind_id['name']}")
        st.markdown(f"**Explanation:** {ind_id['explanation']}")
        st.markdown(f"**Visualisation:** {ind_id['visualization']}")
        st.markdown("------------------")

# Button to suggest more indicators (only shown after successful query)
if st.session_state.query_successful:
    if st.button("Suggest me more indicators"):
        with st.spinner("Generating more recommendations..."):
            # Create a prompt with the list of already recommended indicators
            indicator_names = st.session_state.recommended_indicators_list
            #save the names only as a list of strings
            indicator_names = [ind['name'] for ind in indicator_names]
            indicator_names = json.dumps(indicator_names)
            
            response = agent.invoke({'messages': [{"role": "user", "content": indicator_names}]})
            more_indicators = response['messages'][-1].content
            more_indicators_list = json.loads(more_indicators)
            
            if len(more_indicators_list) > 0:
                # Store additional indicators in separate session state
                st.session_state.more_indicators_list = more_indicators_list
            else:
                st.info("No additional relevant indicators found.")
    
    # Display additional recommendations (persisted across reruns)
    if len(st.session_state.more_indicators_list) > 0:
        st.success("Here are more recommended Indicators:")
        for ind_id in st.session_state.more_indicators_list:
            st.markdown(f"**Name:** {ind_id['name']}")
            st.markdown(f"**Explanation:** {ind_id['explanation']}")
            st.markdown(f"**Visualisation:** {ind_id['visualization']}")
            st.markdown("------------------")            


