import json

from openai import OpenAI, OpenAIError

from app.config import get_settings

LENGTHS = {
    "Short": "A concise executive summary of around two sentences.",
    "Normal": "Two paragraphs: the first a general overview, the second the notable data points.",
    "Long": "A multi-paragraph analysis of the trends and their implications.",
}

# Every indicator arrives with a status. `unavailable` means the service failed or the indicator
# defines no query, and `not_supported` means it is excluded from the summary by design — neither
# says anything about the region, so reporting them as findings is what produced summaries
# claiming there was no bioeconomy or extreme-heat data while the facing page listed both.
STATUS_RULES = (
    "Each indicator in the data carries a `status`:\n"
    "- `ok`: it has measured values. Cite them.\n"
    "- `no_coverage`: the query ran and the area genuinely holds none of it. This is the only "
    "status you may describe as an absence of data.\n"
    "- `unavailable`: the measurement could not be taken. Say nothing about the indicator at "
    "all — do not mention it, do not say its data is missing, unavailable or unknown.\n"
    "- `not_supported`: outside the scope of this summary. Say nothing about it either.\n"
    "Never present a failed measurement as a finding about the region."
)

# Without this a section whose indicators all returned nothing still filled two columns with
# general prose about Amazonia, which reviewers read as findings about their area.
SCALING_RULE = (
    "Scale the summary to the evidence. `indicators_included` of `indicators_total` indicators "
    "have something to say; when that number is small, write proportionally less rather than "
    "padding with general knowledge about Amazonia. Every figure must come from the data — never "
    "infer, estimate or invent a value, and never restate a value the data does not contain."
)

FORMATTING_RULES = (
    "Write flowing prose. No headings, blockquotes, lists, tables, images, links, code blocks, "
    "horizontal rules or footnotes. Bold the key figures, names and classifications with "
    "Markdown. Use percentages wherever the data allows. Refer to the area as 'the selected "
    "area' or 'the region'. Do not open with an introductory phrase, and do not quote internal "
    "codes such as SOL-T-XXX or BR-Lxxx."
)


def generate_description(context_data: dict, description_type: str, language: str) -> str:
    """
    Generate a description using OpenAI's Chat Completions API based on context data, a
    description type, and the desired language.

    Parameters:
        context_data (dict): Evidence for one topic — an `indicators` array where each entry
            carries an `id`, `name`, `status` and, when measured, an `evidence` object, plus
            `indicators_included` / `indicators_total`.
        description_type (str): The type of description to generate. Allowed values are:
            - "Short": A concise, executive-style description.
            - "Normal": A standard description.
            - "Long": A detailed description with a focus on environmental aspects.
        language (str): The language in which the description should be output.

    Returns:
        str: Generated description.
    """
    system_message = {
        "role": "system",
        "content": (
            f"You write regional summaries from structured JSON measurements of a custom area of "
            f"analysis in the Amazonia region. The summary must be in {language}.\n\n"
            f"{STATUS_RULES}\n\n"
            f"{SCALING_RULE}\n\n"
            f"Length: {LENGTHS.get(description_type, LENGTHS['Normal'])}\n\n"
            f"{FORMATTING_RULES}"
        ),
    }

    user_message = {
        "role": "user",
        "content": (
            f"Contextual Data: {json.dumps(context_data, indent=2)}\n"
            f"Description Type: {description_type}\n"
            f"Language: {language}\n\n"
            "Description:"
        ),
    }

    client = OpenAI(api_key=get_settings().openai_token.get_secret_value())

    completion = client.chat.completions.create(
        model="gpt-4o",
        messages=[system_message, user_message],  # type: ignore
        max_tokens=1024,
        temperature=0.7,
    )

    if not completion or not completion.choices[0] or not completion.choices[0].message.content:
        raise OpenAIError("OpenAI API response was empty or invalid")
    description = completion.choices[0].message.content.strip()
    return description
