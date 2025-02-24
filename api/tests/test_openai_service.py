from unittest.mock import MagicMock, patch

from openai.types.chat import ChatCompletion, ChatCompletionMessage
from openai.types.chat.chat_completion import Choice
from src.app.openai_service import generate_description


def fake_openai_api_return(*args, **kwargs):
    return "Super smart text"


@patch("src.app.openai_service.OpenAI")
def test_generate_description(mock_openai):
    mock_client = MagicMock()
    mock_openai.return_value = mock_client

    # Create a mock completion object
    mock_completion = ChatCompletion(
        id="mock-id",
        object="chat.completion",
        created=1234567890,
        model="gpt-4o",
        choices=[
            Choice(
                index=0,
                message=ChatCompletionMessage(
                    role="assistant",
                    content="This is a mock description.",
                ),
                finish_reason="stop",
            )
        ],
    )

    # Set the mock completion as the return value for the API call
    mock_client.chat.completions.create.return_value = mock_completion

    # Define test inputs
    context_data = {"region": "Test Region", "population": 1000000}
    description_type = "Short"
    language = "En"

    # Call the function
    result = generate_description(context_data, description_type, language)
    assert result == "This is a mock description."

    mock_client.chat.completions.create.assert_called_once_with(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a helpful assistant tasked with generating region descriptions based on "
                    "provided data. The description must be in En. "
                    "Based on the requested description type, adjust the style as follows:\n"
                    "- **Short:** Provide a concise, executive-style overview.\n"
                    "- **Normal:** Provide a standard, balanced description.\n"
                    "- **Long:** Provide a detailed description with a focus on environmental aspects.\n"
                    "The description should be engaging and formatted in Markdown, for example, formatting "
                    "names or places as **bold text**. Avoid introductory or welcoming phrases."
                ),
            },
            {
                "role": "user",
                "content": (
                    'Contextual Data: {\n  "region": "Test Region",\n  "population": 1000000\n}\n'
                    "Description Type: Short\n"
                    "Language: En\n\n"
                    "Description:"
                ),
            },
        ],
        max_tokens=1024,
        temperature=0.7,
    )
