# JSONL Protocol Specification, Version 1.0

This document defines the JSONL event stream protocol used between the **bridge** (Python CLI) and the **adapter** (TypeScript plugin) in the Amplifier–Paperclip integration.

---

## Transport

- The **bridge** writes events to **stdout** as newline-delimited JSON (one JSON object per line).
- The **adapter** reads those lines from the bridge process's stdout.
- All diagnostic output, warnings, and internal logging go to **stderr** only; stdout carries protocol events exclusively.
- Encoding is **UTF-8** throughout.
- Each line is terminated by a single newline (`\n`).

---

## Event Types

Each event is a JSON object with a `type` field that identifies its kind. The events are listed below in the order they typically appear in a session stream.

### 1. `init`

**Category:** required, first event  
**Purpose:** Announces the start of a new agent session.

| Field        | Type            | Description                                                            |
|--------------|-----------------|------------------------------------------------------------------------|
| `type`       | `"init"`        | Event discriminator.                                                   |
| `session_id` | string (UUID)   | Unique identifier for this agent session.                              |
| `model`      | string          | Model identifier (e.g. `"claude-3-5-sonnet"`) or `"bundle-default"`. |
| `bundle`     | string (URI)    | Bundle URI identifying the agent bundle to use.                        |

**Example:**
```json
{"type": "init", "session_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890", "model": "bundle-default", "bundle": "file:///path/to/bundle"}
```

---

### 2. `content_delta`

**Category:** optional, streaming, intermediate  
**Purpose:** Carries an incremental chunk of text from the LLM as it is being generated (streaming mode).

| Field  | Type     | Description                           |
|--------|----------|---------------------------------------|
| `type` | `"content_delta"` | Event discriminator.         |
| `text` | string   | A chunk from the LLM's streamed output. |

**Example:**
```json
{"type": "content_delta", "text": "Here is the ans"}
```

---

### 3. `tool_start`

**Category:** optional, observability, intermediate  
**Purpose:** Signals that the agent has begun invoking a tool. Provided for observability; the adapter is not required to act on it.

| Field   | Type     | Description                                                          |
|---------|----------|----------------------------------------------------------------------|
| `type`  | `"tool_start"` | Event discriminator.                                           |
| `tool`  | string   | Name of the tool being invoked (e.g. `"bash"`, `"read_file"`).      |
| `input` | string   | Tool input payload as a string; may be truncated for large inputs.  |

**Example:**
```json
{"type": "tool_start", "tool": "bash", "input": "{\"command\": \"ls -la\"}"}
```

---

### 4. `tool_end`

**Category:** optional, observability, intermediate  
**Purpose:** Signals completion of a tool invocation. Provided for observability; the adapter is not required to act on it.

| Field    | Type     | Description                                             |
|----------|----------|---------------------------------------------------------|
| `type`   | `"tool_end"` | Event discriminator.                                |
| `tool`   | string   | Name of the tool that finished.                         |
| `output` | string   | Tool output, truncated to **2000 characters** maximum.  |

**Example:**
```json
{"type": "tool_end", "tool": "bash", "output": "file1.txt\nfile2.txt\n"}
```

---

### 5. `result`

**Category:** terminal, success  
**Purpose:** The final event when the agent session completes successfully. Exactly one `result` or `error` event closes every session stream.

| Field        | Type                        | Description                                                                    |
|--------------|-----------------------------|--------------------------------------------------------------------------------|
| `type`       | `"result"`                  | Event discriminator.                                                           |
| `session_id` | string (UUID)               | Echoes the session ID from the `init` event.                                   |
| `response`   | string                      | The final full response text from the agent.                                   |
| `usage`      | object \| null              | Token usage object with `input_tokens` (integer) and `output_tokens` (integer), or `null` if unavailable. |
| `cost_usd`   | number \| null              | Estimated cost in US dollars, or `null` if not available.                     |
| `status`     | `"completed"`               | Always the string `"completed"` for result events.                            |

**Example:**
```json
{"type": "result", "session_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890", "response": "The task is done.", "usage": {"input_tokens": 1200, "output_tokens": 300}, "cost_usd": 0.0042, "status": "completed"}
```

---

### 6. `error`

**Category:** terminal, failure  
**Purpose:** The final event when the agent session fails. Exactly one `result` or `error` event closes every session stream.

| Field     | Type    | Description                                      |
|-----------|---------|--------------------------------------------------|
| `type`    | `"error"` | Event discriminator.                           |
| `message` | string  | Human-readable description of the failure.       |
| `code`    | string  | Machine-readable error code (see table below).   |

#### Error Codes

| Code                | Meaning                                                               |
|---------------------|-----------------------------------------------------------------------|
| `TIMEOUT`           | The session exceeded its allowed time limit.                          |
| `BUNDLE_NOT_FOUND`  | The specified bundle URI could not be resolved or loaded.             |
| `PREPARE_FAILED`    | Session preparation (e.g. bundle loading, model init) failed.        |
| `SESSION_ERROR`     | An error occurred during active session execution.                    |
| `UNKNOWN`           | An unexpected error with no more specific classification.             |

**Example:**
```json
{"type": "error", "message": "Bundle not found at file:///missing/bundle", "code": "BUNDLE_NOT_FOUND"}
```

---

## Invariants

The following invariants hold for every well-formed event stream:

1. **Exactly one `init` event appears first.** The very first line of every session stream is an `init` event. No other event may appear before it.

2. **Exactly one terminal event appears last.** Every session stream ends with either a `result` event or an `error` event — never both. No events follow the terminal event.

3. **Intermediate events are optional.** Zero or more `content_delta`, `tool_start`, and `tool_end` events may appear in any order between the `init` event and the terminal event.

4. **The adapter only requires `init` and `result`/`error`.** Implementations of the adapter must handle streams that contain only these two events; `content_delta`, `tool_start`, and `tool_end` are strictly optional and may be absent entirely.

5. **Each line is valid JSON.** Every line emitted by the bridge to stdout is a valid, self-contained JSON object. Partial lines and multi-line JSON values are not permitted.

6. **Exit code reflects terminal event type.** The bridge process exits with code **0** when the terminal event is `result` (success) and with a **non-zero** exit code when the terminal event is `error` (failure).
