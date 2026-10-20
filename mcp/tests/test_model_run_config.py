from datetime import date
from pathlib import Path

import pytest

from mcp_server.measurement.model_run.config import (
    Question,
    load_models,
    load_questions,
)
from mcp_server.measurement.model_run.pricing import (
    Price,
    Usage,
    cost,
    estimate_question,
)

MEASUREMENT = Path(__file__).parents[1] / "measurement"
QUESTIONS = MEASUREMENT / "questions.json"
MODELS = MEASUREMENT / "models.toml"
LABELS = [
    "fable",
    "opus",
    "sonnet",
    "openai-large",
    "openai-mid",
    "openai-small",
    "deepseek-large",
    "deepseek-mid",
]


def test_question_message_appends_area():
    area = {"type": "Polygon", "coordinates": []}
    q = Question(7, "C", "¿Cuántas hectáreas…?", "", 2, area, None)
    assert q.message().startswith("¿Cuántas hectáreas…?\n\nZona (GeoJSON): {")
    assert q.message().endswith('{"type":"Polygon","coordinates":[]}')


def test_question_message_without_area_is_the_text():
    assert Question(1, "A", "t", "", 1, None, None).message() == "t"


def test_load_questions_skips_required_by_default():
    numbers = [q.number for q in load_questions(QUESTIONS, None)]
    assert numbers == list(range(1, 20))


def test_load_questions_named_includes_required():
    assert [q.number for q in load_questions(QUESTIONS, [20, 3])] == [20, 3]


def test_load_questions_unknown_number():
    with pytest.raises(ValueError, match="22"):
        load_questions(QUESTIONS, [22])


def test_load_models_refuses_missing_price(tmp_path):
    (tmp_path / "m.toml").write_text(
        '[[model]]\nlabel="x"\nprovider="openai"\nmodel="m"\n'
    )
    with pytest.raises(ValueError, match="x"):
        load_models(tmp_path / "m.toml", ["x"])


def test_load_models_refuses_unknown_label():
    with pytest.raises(ValueError, match="nope"):
        load_models(MODELS, ["nope"])


def test_load_models_refuses_empty_source(tmp_path):
    (tmp_path / "m.toml").write_text(
        '[[model]]\nlabel="x"\nprovider="openai"\nmodel="m"\n'
        "price = { input = 1.0, cached_input = 0.1, output = 2.0,"
        ' read_on = 2026-10-20, source = "" }\n'
    )
    with pytest.raises(ValueError, match=r"x.*source"):
        load_models(tmp_path / "m.toml", ["x"])


def test_load_models_reads_all_eight_labels_from_the_real_file():
    specs = load_models(MODELS, LABELS)
    assert [s.label for s in specs] == LABELS
    assert all(s.price.read_on == date(2026, 10, 20) for s in specs)


def test_cache_write_defaults_to_input():
    deepseek = load_models(MODELS, ["deepseek-large"])[0]
    assert deepseek.price.cache_write == deepseek.price.input
    fable = load_models(MODELS, ["fable"])[0]
    assert fable.price.cache_write == 12.5


def test_cost_splits_cached_tokens():
    price = Price(3.0, 0.3, 3.75, 15.0, date(2026, 10, 20), "https://example.org")
    usage = Usage(
        input_tokens=1_000_000,
        cached_tokens=600_000,
        cache_write_tokens=100_000,
        output_tokens=100_000,
    )
    assert cost(usage, price) == pytest.approx(0.9 + 0.18 + 0.375 + 1.5)


def test_usage_adds_fieldwise():
    assert Usage(1, 2, 3, 4) + Usage(10, 20, 30, 40) == Usage(11, 22, 33, 44)


def test_estimate_question_grows_with_calls():
    price = Price(1.0, 0.1, 1.0, 1.0, date(2026, 10, 20), "s")
    q = Question(1, "A", "t", "", 2, None, None)
    # input: 4500 + 5500 + 6500 = 16500; output: 900
    assert estimate_question(q, 4500, price) == pytest.approx(17_400 / 1_000_000)


def test_question_message_standalone_uses_its_own_text():
    q = Question(4, "B", "¿Zamora?", "", 1, None, None, "¿Zamora (Ecuador)?")
    assert q.message() == "¿Zamora?"
    assert q.message(standalone=True) == "¿Zamora (Ecuador)?"


def test_question_message_standalone_falls_back_to_the_text():
    assert Question(3, "A", "t", "", 1, None, None).message(standalone=True) == "t"


def test_load_questions_reads_standalone_text():
    by_number = {q.number: q for q in load_questions(QUESTIONS, None)}
    assert by_number[4].standalone_text is not None
    assert by_number[3].standalone_text is None
