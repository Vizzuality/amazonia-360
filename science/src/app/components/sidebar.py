import streamlit as st


def render_sidebar(btn_label, session_state):
    """Render the sidebar with buttons and logic."""
    st.subheader("Getting Started")
    st.markdown(
        f"""
            1. Click the black square on the map
            2. Draw a rectangle on the map
            3. Click on <kbd>{btn_label}</kbd>
            4. Select the profile that best matches your audience
            5. Wait for the computation to finish
        """,
        unsafe_allow_html=True,
    )

    # Button to open the profile selector
    if st.button("Generate AI Summary"):
        session_state.selected_description = None
        session_state.show_profile_selector = True

    # Conditional rendering for profile selection
    if session_state.show_profile_selector:
        st.write("**Select the description type to be generated:**")
        col1, col2, col3 = st.columns(3)
        with col1:
            if st.button("Sort", key="sort"):
                session_state.selected_description = "Sort"
        with col2:
            if st.button("Normal", key="normal"):
                session_state.selected_description = "Normal"
        with col3:
            if st.button("Long", key="long"):
                session_state.selected_description = "Long"

        # Display selected profile
        if session_state.selected_description:
            st.success(f"Selected Description Type: **{session_state.selected_description}**")
            session_state.show_profile_selector = False  # Hide after selection
