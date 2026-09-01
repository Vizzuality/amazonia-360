from unittest.mock import MagicMock, patch

from openai.types.chat import ChatCompletion, ChatCompletionMessage
from openai.types.chat.chat_completion import Choice

from app.openai_service import generate_description


def completion(content: str) -> ChatCompletion:
    return ChatCompletion(
        id="mock-id",
        object="chat.completion",
        created=1234567890,
        model="gpt-4o",
        choices=[
            Choice(
                index=0,
                message=ChatCompletionMessage(role="assistant", content=content),
                finish_reason="stop",
            )
        ],
    )


def mock_client(mock_openai: MagicMock, content: str = "This is a mock description.") -> MagicMock:
    client = MagicMock()
    mock_openai.return_value = client
    client.chat.completions.create.return_value = completion(content)
    return client


def system_prompt(client: MagicMock) -> str:
    return client.chat.completions.create.call_args.kwargs["messages"][0]["content"]


@patch("app.openai_service.OpenAI")
def test_generate_description(mock_openai):
    mock_client(mock_openai)

    result = generate_description({"region": "Test Region", "population": 1000000}, "Short", "En")

    assert result == "This is a mock description."


@patch("app.openai_service.OpenAI")
def test_only_no_coverage_may_be_reported_as_an_absence_of_data(mock_openai):
    client = mock_client(mock_openai)

    generate_description({"indicators": []}, "Normal", "en")

    prompt = system_prompt(client)

    assert "`no_coverage`: the query ran and the area genuinely holds none of it" in prompt
    assert "This is the only status you may describe as an absence of data" in prompt
    assert "Never present a failed measurement as a finding about the region." in prompt


@patch("app.openai_service.OpenAI")
def test_unmeasured_indicators_are_not_mentioned_at_all(mock_openai):
    client = mock_client(mock_openai)

    generate_description({"indicators": []}, "Normal", "en")

    prompt = system_prompt(client)

    assert "Say nothing about the indicator at all" in prompt
    assert "do not say its data is missing, unavailable or unknown" in prompt


@patch("app.openai_service.OpenAI")
def test_formatting_and_scaling_rules_live_in_the_prompt(mock_openai):
    client = mock_client(mock_openai)

    generate_description({"indicators": []}, "Normal", "en")

    prompt = system_prompt(client)

    assert "No headings, blockquotes, lists, tables" in prompt
    assert "Scale the summary to the evidence." in prompt
    assert "never infer, estimate or invent a value" in prompt


@patch("app.openai_service.OpenAI")
def test_prompt_states_the_requested_length_and_language(mock_openai):
    client = mock_client(mock_openai)

    generate_description({"indicators": []}, "Short", "es")

    prompt = system_prompt(client)

    assert "around two sentences" in prompt
    assert "must be in es" in prompt
