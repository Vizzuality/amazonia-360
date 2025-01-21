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
        session_state.show_profile_selector = True

    # Conditional rendering for profile selection
    if session_state.show_profile_selector:
        st.write("**Select the profile that best matches your audience:**")
        col1, col2, col3 = st.columns(3)
        with col1:
            if st.button("General Public", key="general_public"):
                session_state.selected_profile = "General Public"
        with col2:
            if st.button("Finances", key="finances"):
                session_state.selected_profile = "Finances"
        with col3:
            if st.button("Conservationists", key="conservationists"):
                session_state.selected_profile = "Conservationists"

        # Display selected profile
        if session_state.selected_profile:
            st.success(f"Selected Profile: **{session_state.selected_profile}**")
            session_state.show_profile_selector = False  # Hide after selection
