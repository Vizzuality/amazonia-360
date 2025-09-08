from unittest.mock import MagicMock, patch

from openai.types.chat import ChatCompletion, ChatCompletionMessage
from openai.types.chat.chat_completion import Choice

from app.openai_service import generate_description


def fake_openai_api_return(*args, **kwargs):
    return "Super smart text"


@patch("app.openai_service.OpenAI")
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
