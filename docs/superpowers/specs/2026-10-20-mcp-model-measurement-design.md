# MCP model measurement: cost, latency and answers per base question and model

A program that plays the platform: it sends each base question to a model with the amazonia360
MCP server attached, and records what the question cost, how long the user waited, which tools
the model called and what it answered. Run over nine models, it gives the figures the IDB team
needs to estimate the cost of V2.0, and the answers to judge whether the cheaper models are good
enough. Part of Deliverable 6 (AM-755), and the per-question trace of AM-752.

Proposed on 20 October 2026.

## Why

The IDB team will use the findings report (D6) to estimate the cost of V2.0, and wants to compare
models, not take one as given. Claude Desktop, where every trial so far ran, reports neither
tokens nor price, and keeps one server process for every conversation, so the call log cannot
tell one question from the next.

A cheaper model is only cheaper if it answers right, so the report gives cost and quality side by
side, per model.

## Goals

1. Be able to run the base questions, in Spanish, through nine models: three from Anthropic, three from
   OpenAI and three from DeepSeek. Anthropic's three are Fable, Opus and Sonnet; the others are
   chosen in the configuration.
2. Record per question and model: the question, every model turn, every tool call with its
   arguments, result size and time, the input and output tokens (cached input apart), the price,
   the time from sending the question to the final answer, and the final answer.
3. Give every model the same instructions, the server's own plus the `amazonia360` skill, as the
   system prompt, so the comparison is fair and close to how the platform would run.
4. Run with the layer store on, as V2.0 would: the default sources, `precomputed`,
   `local_copy` and `arcgis` (designer's call). "Off" is `arcgis` alone. Run one model also without the store, as the
   before-and-after reference.
5. Tie the server's own call log to the question: each line of `var/calls.jsonl` written during a
   run says which run and question it belongs to, so a trace joins what the model did with what
   the server did (source, ArcGIS time, store time).
6. Produce a summary per model (cost per question, total, latency, tool calls) and the answers
   laid out for grading.

## Non-goals

- Grading answers automatically. The answers are graded by hand afterwards, together, against the
  expected layer and figure in the base questions proposal.
- Questions 20 and 21. They need the overlap tool (AM-757); the report says they are measured
  once it exists, and the program takes them then without changes.
- Several runs per question to measure variance. One run per question and model; the design does
  not prevent more later.
- Hosting cost of the server. A separate estimate in the report.
- The question as recorded by the platform's own backend. That belongs to V2.0.

## Anti-goals

- Figures that look comparable but are not: models given different instructions, different tool
  descriptions or different store settings without the result saying so.
- A price computed from a price list nobody can check. Every price used is recorded with its
  date and source next to the figures.
- A run that spends without limit. A model stuck in a loop on question 19 must stop, and say it
  stopped.

## Spending

The IDB may not afford a chat in the platform at the cost of the larger models; the alternative
is giving users access to the MCP server from their own assistant, where each user pays the
tokens and the IDB pays only the server. The report presents both pathways with a cost per
question, and the measurement is what gives the first one its figures.

So the measurement starts small and spends only what each step justifies:

1. A first round: the 19 questions with three mid-tier models, one per provider (Sonnet for
   Anthropic; the OpenAI and DeepSeek ones chosen in the configuration). Expected 5 to 15 dollars.
2. The other six models, and the run without the store, only if the first round says they are
   worth it.

Before a paid run the program shows an estimate of its cost, from the token sizes and the prices
in the configuration, and asks to go on. During the run it stops when the money spent reaches a
cap given on the command line, records where it stopped, and keeps everything finished up to
then. The first round's cap is 20 dollars (designer's call, from the estimate).

## Constraints

- Python in `mcp/`, run with uv like the timing run (`amazonia360-mcp-timing`). A new command,
  `amazonia360-mcp-measure`.
- Its dependencies go in an optional group, not in the server's: the server image does not grow.
- LangChain is in the Tech Radar's Adopt tier for LLM integrations, and is used for the three
  providers and for attaching the MCP tools (designer's call: it is also the most likely shape of
  the V2.0 backend). The provider packages and the MCP adapter are LangChain's own.
- API keys come from the environment, never from a file in the repository.
- The server runs over stdio, one fresh process per question, with the same catalogue snapshot and
  store for every model in a run.

## Design

### Inputs

- **Questions**: a file in `mcp/` with the 21 base questions in Spanish, each with its number,
  its group and the proposal's expected result. The text is the one sent in the Desktop trials
  where one was recorded (round 4 evaluation), translated from the proposal otherwise. Ambiguous
  wording stays ambiguous on purpose ("Mejía", "Zamora" without the province): whether the model
  asks back is part of what is measured. Reviewed by Miguel before the first paid run (designer's
  call).
- **Drawn areas** (questions 7 and 15): the polygon is pasted as GeoJSON in the user's message,
  as in Desktop. The report says these two questions pay the polygon's tokens (designer's call).
- **Models**: a configuration file listing each model: provider, model id, a label, and its price
  per million input, cached input and output tokens, with the date and URL the price was read
  from.
- **Run options**: which models, which questions, store on or off, a maximum number of model turns
  per question and a maximum time per question.

### Running a question

For each model and question: start the server, give the model the system prompt and the tools,
send the question, and loop while the model calls tools: call the tool, return the result, record
both. Stop at the final answer, at the turn limit or at the time limit; a stopped question is
recorded as stopped, with the reason, and its cost counts.

When the model asks the user something back (for example which Pastaza), the program does not
answer: the question ends there, recorded with the model's question as its answer. Grading decides
whether asking was right.

### The trace

One record per question and model, written as soon as the question ends so that an interrupted
run keeps what it finished:

- run id, model label, question number, store on or off;
- start and end time, total time;
- each turn: tokens in, cached tokens, tokens out, time spent in the model;
- each tool call: name, arguments, time, size of the result, error if any;
- totals: turns, tool calls, tokens, price;
- the final answer, and how the question ended.

The server process gets the run id and question number from the environment and writes them in
every line of `var/calls.jsonl`. The three tools that are not logged today (`find_places`,
`list_indicators`, `describe_indicator`) are logged too, so the server's side of the trace is
complete. Over HTTP the MCP session id is logged in the same field (designer's call: it closes
the grouping gap of AM-752 for staging at the same cost).

### Tool schemas

Every model gets the same tool schemas, as the server publishes them, with strict function
calling off. Before a paid run the program checks that each provider accepts the schemas, with a
call that costs a few tokens; if one rejects them, the run stops before spending and says which
schema and why (designer's call).

### The summary

Per run, a table per model: price per question, total price, median and longest time, tool calls,
questions stopped. And a document with each question and every model's answer next to it, with
the proposal's result for that question, ready to grade. The answer key is written while grading,
together (designer's call).

The report takes its figures from these files.

## Decided in conversation

- The figures are for the IDB team, to estimate the cost of V2.0 comparing models (20 October).
- Nine models, three per provider: Anthropic (Fable, Opus, Sonnet), OpenAI, DeepSeek
  (20 October).
- Quality goes in the report next to cost; answers are graded by hand afterwards, together
  (20 October).
- Same instructions for every model: the server's plus the skill (20 October).
- Store on; one model also without it (20 October).
- One run per question and model (20 October).
- Questions 20 and 21 later, when the overlap tool exists (20 October).
- API keys for the three providers are available (20 October).
- Start with a small round of three mid-tier models; the rest only if it is worth it. The report
  sets the platform chat against access to the MCP server from the user's own assistant
  (20 October).

## Left to the builder

- Which model runs without the store.
- The turn and time limits, from the trials: question 19 took 36 calls.
- The file formats of the trace and the summary, and where a run is written under `mcp/var/`.
- How the prompt caching each provider offers is used, as long as the trace records cached tokens
  apart and the summary says whether caching was on.
