# Chat API for the front end

Date: 22 October 2026. Status: built on 23 October 2026, checked against TanStack AI 1.0.

## Purpose

The front end will offer a chat over the Ecuador module to signed-in users. The front-end team
builds the interface with TanStack AI; this service supplies the API behind it. The model, its
key, the system prompt, the tool loop and the tools stay in the `mcp` service, so the front end
holds no model key, runs no tool loop and does not speak MCP.

The front end is not changed by this work. Everything it needs is in "What the front end does",
as a contract.

## Shape

```
browser (TanStack AI useChat) ──POST /chat, Bearer token──► mcp service
                                                              ├─ checks the token
                                                              ├─ runs the question loop (the measurement's)
                                                              │    model API ◄── model key
                                                              │    MCP server, in process ◄── same tools,
                                                              │        descriptions, schemas and instructions
                                                              │        as Claude Desktop and the measurement
                                                              └─ streams AG-UI events back over SSE
```

- **The model key** lives in the `mcp` container's environment, set through Terraform like the
  other secrets (`TF_*` maps, GitHub environment secrets, `docker-compose.yml` of the bundle).
- **The tools** are reached in process (`mcp.Client(server)`), as the tests do. The model gets
  exactly what any MCP host gets; no second copy of tool definitions exists.
- **The MCP endpoint over HTTP** (`/mcp/`, OAuth) stays as it is, for third-party hosts.

## Protocol

TanStack AI 1.0 speaks AG-UI: the client sends an AG-UI `RunAgentInput` and reads AG-UI events.
The endpoint implements that protocol, not a TanStack-specific one, so another AG-UI client
works too.

### Request

`POST <MCP_PUBLIC_URL>/chat` (`/mcp/chat` on staging, next to the MCP endpoint; `/chat` with
the local command), `Content-Type: application/json`, `Authorization: Bearer <token>`.
TanStack AI also sends `X-Run-Id`, which CORS allows.

The body is a `RunAgentInput`:

| Field | Use |
|---|---|
| `threadId` | Conversation id. Logged as the session; no state is kept under it |
| `runId` | Id of this question. Echoed in `RUN_STARTED` and `RUN_FINISHED` |
| `messages` | The conversation so far, ending with a `user` message |
| `forwardedProps.locale` | `"en"`, `"es"` or `"pt"`; the language of the answer. Optional, `"en"` by default |
| `tools`, `state`, `context`, `resume` | Ignored. Client-side tools are not supported in this version |

Rules on `messages`:

- Kept: `user`, `assistant` (text and `toolCalls`) and `tool` messages. Dropped: `system`,
  `developer`, `reasoning`, `activity`. The system prompt is the server's alone.
- The last message must be a `user` message, or the request gets 400.

The conversation is stateless on the server: the client sends the history each time, as
TanStack AI does. `ChatClient` keeps it in memory, and can keep it in `localStorage`,
`sessionStorage` or IndexedDB through its persistence adapters, which is the front end's
choice. A client could send a forged `tool` message; the user is signed in and only
misleads their own conversation, which is accepted in this version.

### Response

`200`, `Content-Type: text/event-stream`. Each event is one SSE frame: `data: <JSON>` and a blank
line. Field names are AG-UI's, in camelCase.

A question with one tool call, one event per frame (the blank lines between frames are part of
the stream):

```
data: {"type":"RUN_STARTED","threadId":"t1","runId":"r1"}

data: {"type":"TOOL_CALL_START","toolCallId":"c1","toolCallName":"find_places","parentMessageId":"m1"}

data: {"type":"TOOL_CALL_ARGS","toolCallId":"c1","delta":"{\"query\":\"Morona\"}"}

data: {"type":"TOOL_CALL_END","toolCallId":"c1"}

data: {"type":"TOOL_CALL_RESULT","messageId":"m2","toolCallId":"c1","role":"tool","content":"{\"places\":[...]}"}

data: {"type":"TEXT_MESSAGE_START","messageId":"m3","role":"assistant"}

data: {"type":"TEXT_MESSAGE_CONTENT","messageId":"m3","delta":"Morona is both a canton and..."}

data: {"type":"TEXT_MESSAGE_END","messageId":"m3"}

data: {"type":"CUSTOM","name":"amazonia360:run-summary","value":{"model":"sonnet","turns":2,"toolCalls":1,"costUsd":0.0123,"elapsedMs":8400}}

data: {"type":"RUN_FINISHED","threadId":"t1","runId":"r1","metadata":{"tanstack":{"finishReason":"stop"}}}

```

- **Text.** One `TEXT_MESSAGE_*` triad per model turn that has text. In this version each turn's
  text arrives in one `TEXT_MESSAGE_CONTENT`: the measurement's loop waits for the whole turn.
  Token streaming is a later change that does not alter the contract.
- **Tool calls.** The arguments arrive whole, in one `TOOL_CALL_ARGS`.
- **Tool results.** `TOOL_CALL_RESULT.content` is the tool's structured result as a JSON string:
  for the area tools, a `Result` with `value`, `computed_over`, `coverage`, `caveats` and the
  rest, each field described in the tool's output schema. The front end draws figures and moves
  its map from these, not from the model's text. A tool that failed sends its error text as
  `content` with `metadata.tanstack.state` set to `"output-error"`; the model gets the same text
  and the run goes on.
- **Map tools** (`map_area_by_category`, `map_class_shares_in_area`) are not offered to the
  model here: the front end has its own map, and every area result already says what to draw.
- **`amazonia360:run-summary`.** Sent once, before `RUN_FINISHED`: model label, turns, tool
  calls, cost in USD and elapsed time. For display or logging; the front end may ignore it.
- **`RUN_FINISHED`** carries `metadata.tanstack.finishReason: "stop"`. Every tool runs on the
  server inside one run, so the client never needs to continue a run.

### Errors

Before the stream starts, a plain HTTP error with a JSON body `{"error": "<code>", "message":
"<text>"}`:

| Status | `error` | When |
|---|---|---|
| 400 | `bad_request` | The body is not a valid `RunAgentInput`, or breaks a rule on `messages` |
| 401 | `unauthenticated` | No token, or a token that fails verification |
| 503 | `chat_disabled` | No authentication is configured, or no model key |

After the stream starts, a `RUN_ERROR` event ends it:

| `code` | When |
|---|---|
| `model_error` | The model API failed after its own retries |
| `max_turns` | The loop reached its turn limit |
| `timeout` | The loop reached its time limit |

`RUN_ERROR.message` is a sentence the front end can show. Text and tool results already sent
stay valid.

## Authentication

Only signed-in users reach the chat. Two kinds of bearer token are accepted.

### JWT from the front end's backend (the target)

The front end's backend, whatever framework it runs, signs a short token for a signed-in user.
This service verifies it with the backend's public keys. No secret is shared, and the contract
holds if the front end changes framework.

| Claim | Value |
|---|---|
| `iss` | The front end's issuer string, set in `MCP_CHAT_JWT_ISSUER` |
| `aud` | `"amazonia360-ai"` |
| `sub` | The user's id in the front end's user store |
| `exp` | At most 10 minutes after `iat` |
| `iat` | Issue time |

- Signed with an asymmetric key: `RS256`, `ES256` or `EdDSA`. `HS256` and `none` are refused.
- The keys are published as a JWKS at the URL in `MCP_CHAT_JWKS_URL`, fetched and cached; a
  token with an unknown `kid` triggers one refetch.
- `sub` is the user in the call log.

### Development tokens (until the JWT exists)

So the front end can start before its backend issues tokens:

- `MCP_CHAT_DEV_TOKENS="ana:<token>,luis:<token>"`: one token per developer; the name is the
  user in the call log. Tokens are at least 32 random characters.
- Accepted only while that variable is set. At startup the server logs a warning naming how many
  development tokens are active.
- A token is kept in each developer's local `.env`, never in front-end code or a deployed
  bundle: a token in a bundle can be read by anyone and spends the model key.
- Retired by removing the variable once the JWT is in place. No code change.

With neither `MCP_CHAT_JWKS_URL` nor `MCP_CHAT_DEV_TOKENS` set, `/chat` answers 503.

## CORS

`MCP_CHAT_ALLOWED_ORIGINS`: the front end's origins, comma-separated, plus `http://localhost:*`
while development tokens are active. Credentials are not used (the token travels in a header),
so `Access-Control-Allow-Credentials` is not sent.

## Model and prompt

- The model is a label from `mcp/measurement/models.toml`, set in `MCP_CHAT_MODEL`. Changing
  model or provider is a configuration change. The label is reported in the run summary.
- The system prompt is the server's instructions and the `amazonia360` skill, as in the
  measurement, plus one line with the answer's language from `forwardedProps.locale`.
- What the measurement found per model (usable answers, cost, latency) holds for this endpoint
  only while the prompt and the tools are the same; changing either calls for a new measurement.

## Logging

- Every tool call goes to the call log as today, with `user` set to the token's user and
  `session` to `threadId`.
- Every run writes one line: user, `threadId`, `runId`, model, turns, tool calls, tokens, cost,
  elapsed time and how it ended.
- User questions and answers are not logged in this version.

## What the front end does

Informative; the front end's code is the front-end team's.

```ts
const { messages, sendMessage } = useChat({
  threadId,
  connection: fetchServerSentEvents(`${AI_API_URL}/chat`, () => ({
    headers: { Authorization: `Bearer ${getToken()}` },
  })),
  forwardedProps: { locale },
  onChunk: (chunk) => {
    if (chunk.type === "CUSTOM" && chunk.name === "amazonia360:run-summary") {
      // optional: cost and timing of the run
    }
  },
});
```

- Figures and map state come from the `tool-call` parts of `messages`: `part.name` is the tool,
  `part.output` its result.
- `getToken()` returns a development token now and the backend's JWT later.

## Working before the endpoint is deployed

`mcp/examples/chat/` holds recorded streams of real runs, each `.sse` file next to the
`.request.json` that produced it:

| Example | What it shows |
|---|---|
| `morona-canton` | Hectares per ecosystem over a named canton |
| `pastaza-asks-back` | Two places with the name: the answer asks which one, after one tool call |
| `loja-partly-outside` | A canton mostly outside the module |
| `guayaquil-outside-module` | A place the module does not have: no figures |
| `run-error` | A run ended by `RUN_ERROR` (`max_turns`) after its tool calls |

The front end can serve them from a stub to build the interface. They are recorded again
whenever the contract changes.

## Checked with a prototype

A `ChatClient` from `@tanstack/ai-client` 1.0.0 (22 October 2026), run against the endpoint
with a real model on 23 October 2026, two questions in one thread:

1. **Framing.** The client reads each `data:` line as JSON; no `data: [DONE]` is needed, and
   one would only log a warning.
2. **Tool results.** Server-side results arrive as `tool-call` parts with `state: "complete"`,
   `input` (the parsed arguments) and `output` (the parsed `Result`), followed by a
   `tool-result` part. The front end reads `part.output`.
3. **Token per request.** `fetchServerSentEvents(url, async () => ({ headers }))` takes its
   options as a function, sync or async.
4. **Role.** `TEXT_MESSAGE_START` with `role: "assistant"` builds an assistant message.
5. **History.** The second request carries every earlier call and result as `assistant`
   messages with `toolCalls` and `tool` messages, which the endpoint reads back in order.
6. **Thread.** `ChatClient` requires a `threadId` option; it is the `threadId` of every request.
7. **CUSTOM.** `amazonia360:run-summary` reaches `onChunk`.

## Dependencies

- PyJWT, with `cryptography`, to verify the front end's tokens. It is not on the Tech Radar;
  approved for this project on 23 October 2026.
- The model providers' LangChain packages moved from the `measure` group to the service's main
  dependencies. LangChain is in Adopt.
- No AG-UI package: the events are plain JSON written by the service.

## Out of scope

- Usage limits per user (questions or spend a day). The chat is for testing; the run log
  already records cost per user if limits are needed later.
- The question gatekeeper. It goes in front of the loop when it is built (module spec,
  "Question gatekeeper").
- Token-by-token streaming.
- Compacting long conversations. If conversations grow, the server empties old tool results
  before the model call and keeps the text, which already repeats the figures; no model-written
  summary, since a summary can alter a figure. Done rarely and in large steps, so the provider's
  cache still applies. TanStack AI's `@tanstack/ai-compaction` runs where `chat()` runs, which
  here is not the front end.
- Conversations stored on the server.
- Client-side tools and the map tools.
- H3 and the front end's own calculations.
