# Amplifier-Paperclip Adapter Design

## Goal

Build an adapter that connects Amplifier to Paperclip, allowing Paperclip to use Amplifier as an agent runtime alongside Claude Code, Codex, Cursor, Gemini, and others.

## Background

[Paperclip](https://github.com/paperclipai/paperclip) is an open-source, self-hosted control plane for AI-agent companies. It provides organizational infrastructure — org charts, budgets, task assignment, heartbeats, governance, and audit trails — that coordinates AI agents from different runtimes toward shared company goals.

[Amplifier](https://github.com/microsoft/amplifier) is an open-source AI agent framework (Python/Rust) with a composable bundle system, tool ecosystem, and multi-provider support.

Paperclip already ships adapters for Claude Code (`claude-local`), Codex (`codex-local`), Gemini (`gemini-local`), and others. Each adapter follows a consistent pattern: spawn a process per heartbeat, pipe context in, parse structured output. This design adds Amplifier to that lineup.

## Approach

**Minimal Bridge (subprocess per heartbeat).** Two packages in one repo — a TypeScript adapter that plugs into Paperclip and a Python bridge that wraps `AmplifierSession`. The TypeScript adapter spawns the Python bridge as a child process for each heartbeat, pipes the rendered prompt to stdin, and parses JSONL events from stdout.

This matches how every existing Paperclip adapter works. No daemon, no HTTP server, no custom IPC protocol beyond the JSONL contract.

### Why this approach

| Alternative | Why not (for v1) |
|---|---|
| Long-running daemon | Process lifecycle management, crash recovery, memory growth — complexity without measured need |
| `amplifierd` HTTP server | Pre-configures bundles in `service.yaml`, doesn't support arbitrary bundle URIs per request |
| `amplifier run` CLI directly | TUI output, no structured format, not reliably parseable |
| Upstream CLI flags (`--headless --jsonl`) | Depends on changes to a repo we don't own |

### v2 upgrade path

If subprocess-per-heartbeat cold start latency becomes a measured problem, the upgrade is: HTTP server using Paperclip's existing `httpAdapter` type. Standard tooling, curl-debuggable, no custom protocols. Measure first, optimize second.

## Architecture

```
Paperclip Server (TypeScript)
    │
    │  Heartbeat fires
    │  Renders prompt via adapter-utils
    │  Spawns child process
    │
    ▼
┌──────────────────────────────────────────────┐
│  TypeScript Adapter (@amplifier/paperclip-adapter)  │
│  - External plugin via adapter-plugins.json         │
│  - runChildProcess("amplifier-paperclip-bridge")    │
│  - Pipes rendered prompt to stdin                    │
│  - Parses JSONL from stdout                          │
└──────────────────────────────────────────────┘
    │  stdin: rendered prompt string
    │  stdout: JSONL event stream
    ▼
┌──────────────────────────────────────────────┐
│  Python Bridge (amplifier-paperclip-bridge)         │
│  - Reads args + stdin                                │
│  - load_bundle() → prepare() → create_session()     │
│  - session.execute(prompt)                           │
│  - Writes JSONL events to stdout                     │
│  - Exits when done                                   │
└──────────────────────────────────────────────┘
    │
    ▼
amplifier-core + amplifier-foundation
    │  Full session execution with all tools/agents
    ▼
LLM Provider (Anthropic, OpenAI, etc.)
```

**Key boundaries:**

- The TypeScript adapter knows about Paperclip. It does not know about Amplifier internals.
- The Python bridge knows about Amplifier. It does not know about Paperclip's data model.
- The rendered prompt string (stdin) is the only thing that crosses the boundary.

## Components

### Repo Structure & Package Layout

```
amplifier-paperclip-adapter/            # GitHub: bkrabach/amplifier-paperclip-adapter
├── install.sh                          # curl-able single-command installer
├── bridge/                             # Python package (git+https installable)
│   ├── pyproject.toml                  # amplifier-paperclip-bridge
│   └── src/
│       └── amplifier_paperclip_bridge/
│           ├── __init__.py
│           ├── main.py                 # CLI entry point
│           └── output.py              # JSONL event formatting helpers
├── adapter/                            # TypeScript package (npm git+https installable)
│   ├── package.json                    # @amplifier/paperclip-adapter
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts                    # Root metadata (type, label, models, configDoc)
│       ├── server/
│       │   ├── index.ts                # Server exports
│       │   ├── execute.ts              # Spawns bridge, parses JSONL, returns result
│       │   ├── parse.ts                # JSONL stdout parser
│       │   └── test.ts                 # Environment diagnostics
│       ├── ui/
│       │   ├── parse-stdout.ts         # TranscriptEntry[] conversion for run viewer
│       │   └── build-config.ts         # Config form builder
│       └── cli/
│           └── format-event.ts         # Terminal formatter for --watch
├── protocol.md                         # JSONL format spec (shared contract)
└── README.md
```

Two packages, one repo. They share a JSONL protocol defined in `protocol.md` and must evolve atomically since the protocol is private between them.

### Single-Command Installer

```bash
curl -fsSL https://raw.githubusercontent.com/bkrabach/amplifier-paperclip-adapter/main/install.sh | sh
```

The installer:

1. Checks prerequisites — Python 3.11+, Node.js 20+, `uv` (or `pip`), `amplifier` CLI
2. Installs the Python bridge from git:
   ```bash
   uv pip install "git+https://github.com/bkrabach/amplifier-paperclip-adapter.git#subdirectory=bridge"
   ```
3. Installs the TypeScript adapter from git:
   ```bash
   npm install -g "git+https://github.com/bkrabach/amplifier-paperclip-adapter.git#subdirectory=adapter"
   ```
4. Registers the adapter in `~/.paperclip/adapter-plugins.json`
5. Runs `amplifier-paperclip-bridge --version` and a quick adapter load check to verify
6. Prints success message with next steps

No PyPI or npm registry publishing required.

### Python Bridge

The bridge is a thin CLI (~200 lines) that wraps `AmplifierSession`.

**Invocation:**

```bash
amplifier-paperclip-bridge \
  --bundle "amplifier-dev" \
  --cwd "/workspace/my-project" \
  --timeout 300 \
  <<< "rendered prompt with Paperclip context prepended"
```

**Execution flow:**

1. **Parse args** — `--bundle` (default: `"amplifier-dev"`), `--cwd`, `--timeout` (default: `300`). Read prompt from stdin.
2. **Load bundle** — `load_bundle(bundle_uri)` then `prepare()`. The bundle URI passes straight through to `load_bundle()`, supporting names (`"amplifier-dev"`), file paths, and `git+https` URLs.
3. **Create session** — `create_session(session_cwd=cwd)` with headless systems:
   - `ApprovalSystem`: auto-approve everything (v1; operator trusts the bundle config)
   - `DisplaySystem`: omitted (kernel silently drops display calls; events captured via hooks)
4. **Register hooks** — Wildcard hook writes JSONL events to stdout for `content:block:delta`, `tool:pre`, `tool:post`, `provider:response`.
5. **Execute** — `session.execute(prompt)`, write final `result` event, exit.

**Error handling:**

- Python exceptions write `{"type": "error", "message": "...", "code": "..."}` to stdout and exit non-zero.
- Timeout via `asyncio.wait_for(session.execute(prompt), timeout=timeout_sec)`.

**Dependencies:** `amplifier-core`, `amplifier-foundation` (installed via git+https in `pyproject.toml`).

**Default bundle:** `amplifier-dev` from amplifier-foundation — the full-featured bundle with tools, agents, delegation, and skills. Configurable via `--bundle` to accept any bundle URI.

### TypeScript Adapter

The adapter registers as an external Paperclip plugin via `~/.paperclip/adapter-plugins.json`, following Paperclip's standard adapter contract.

**Root metadata (`src/index.ts`):**

```typescript
export const type = "amplifier_local";
export const label = "Amplifier (local)";
export const models = [
  { id: "bundle-default", label: "Bundle Default" },
];
```

Includes `agentConfigurationDoc` with usage documentation for Paperclip's agent config UI.

**Execute flow (`src/server/execute.ts`):**

1. Read config — `bundle` (default `"amplifier-dev"`), `timeout` (default `300`)
2. Build env — pass through `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, plus `PAPERCLIP_*` vars from `buildPaperclipEnv(agent)`
3. Render prompt — use Paperclip's shared utilities from `adapter-utils` (see [Prompt Rendering](#prompt-rendering--skills-injection))
4. Spawn — `runChildProcess(runId, "amplifier-paperclip-bridge", ["--bundle", bundle, "--cwd", cwd, "--timeout", timeout])`
5. Pipe rendered prompt to stdin
6. Parse stdout JSONL via `parseAmplifierStream()` — extract `session_id`, `usage`, `cost_usd`, `response`
7. Return `AdapterExecutionResult` with summary, usage, and session params

**Environment test (`src/server/test.ts`):**

| Check | Severity |
|---|---|
| `amplifier-paperclip-bridge` in PATH | Error if missing |
| `amplifier` CLI installed | Error if missing |
| At least one API key set | Warning if missing |
| `amplifier-paperclip-bridge --version` | Info with version |

**Error handling:** If the bridge exits non-zero or the last JSONL event is `{"type": "error"}`, the adapter maps the error code to Paperclip's diagnostic format and returns a failed result. Empty or malformed stdout reports `ADAPTER_ERROR`.

## Data Flow

### JSONL Protocol

The bridge writes newline-delimited JSON events to stdout. This is the shared contract between the two packages.

**Event types:**

| Type | Required | Purpose |
|---|---|---|
| `init` | Yes | Session started — includes `session_id`, `model`, `bundle` |
| `content_delta` | No | Streaming text chunk — progressive enhancement for real-time UI |
| `tool_start` | No | Tool invocation started — observability |
| `tool_end` | No | Tool invocation completed — observability |
| `result` | Terminal | Session completed — includes `response`, `usage`, `cost_usd`, `status` |
| `error` | Terminal | Session failed — includes `message`, `code` |

**Examples:**

```jsonl
{"type": "init", "session_id": "uuid", "model": "claude-sonnet-4-5", "bundle": "amplifier-dev"}
{"type": "content_delta", "text": "Working on the issue..."}
{"type": "tool_start", "tool": "bash", "input": "git status"}
{"type": "tool_end", "tool": "bash", "output": "On branch main..."}
{"type": "result", "session_id": "uuid", "response": "Done. I committed...", "usage": {"input_tokens": 1500, "output_tokens": 800}, "cost_usd": 0.03, "status": "completed"}
```

**Rules:**

- All output goes to stdout as JSONL. Logs and diagnostics go to stderr.
- Every session starts with `init`, ends with exactly one `result` or `error`. Never both.
- The TypeScript adapter only *requires* `init` and `result`/`error` to function. The streaming and tool events are progressive enhancement.

**Error codes:** `TIMEOUT`, `BUNDLE_NOT_FOUND`, `PREPARE_FAILED`, `SESSION_ERROR`, `UNKNOWN`.

### Prompt Rendering & Skills Injection

**Prompt rendering** follows the exact pattern used by claude-local, codex-local, and gemini-local. The TypeScript adapter uses Paperclip's shared utilities — `renderTemplate()`, `joinPromptSections()`, and `renderPaperclipWakePrompt()` from `adapter-utils`.

Prompt assembly order (consistent with all existing adapters):

```
instructionsPrefix      (AGENTS.md file contents, prepended to prompt)
+ bootstrapPromptTemplate (fresh sessions only)
+ wakePrompt              (Paperclip wake payload — issue, comments, status)
+ sessionHandoffNote      (if applicable)
+ renderedPrompt          (heartbeat promptTemplate)
```

Default `promptTemplate`: `"You are agent {{agent.id}} ({{agent.name}}). Continue your Paperclip work."` — configurable per-agent via `config.promptTemplate`.

The rendered prompt is piped to the bridge's stdin as a single string. The bridge does not know about Paperclip's data model.

**Skills injection** uses Amplifier's native discovery mechanism. The `tool-skills` module (composed in the `amplifier-dev` bundle via `amplifier-bundle-skills`) scans for skills in this priority order:

1. `AMPLIFIER_SKILLS_DIR` env var (highest priority)
2. `{cwd}/.amplifier/skills/` (workspace-relative)
3. `~/.amplifier/skills/` (user-level)

The adapter follows the same pattern as claude-local: create a temp directory, symlink Paperclip skills into it, then either symlink into `{cwd}/.amplifier/skills/` or set `AMPLIFIER_SKILLS_DIR` to point at the temp dir. The `tool-skills` module discovers them naturally at runtime — symlinks are followed (`followlinks=True`), and each skill is identified by its `SKILL.md` file. No prompt injection for skills.

## Error Handling

| Failure | Bridge behavior | Adapter behavior |
|---|---|---|
| Bad bundle name | `{"type": "error", "code": "BUNDLE_NOT_FOUND"}`, exit 1 | Returns failed `AdapterExecutionResult`, logs diagnostic |
| `prepare()` fails | `{"type": "error", "code": "PREPARE_FAILED"}`, exit 1 | Returns failed result with error details |
| Session timeout | `{"type": "error", "code": "TIMEOUT"}`, exit 1 | Returns failed result, maps to Paperclip timeout category |
| Python exception during execution | `{"type": "error", "code": "SESSION_ERROR"}`, exit 1 | Returns failed result with exception message |
| Bridge not in PATH | N/A | Environment test returns error diagnostic |
| Malformed stdout | N/A | Adapter reports `ADAPTER_ERROR` |
| Bridge crashes (no JSONL output) | Process exits non-zero | Adapter detects non-zero exit + missing `result`/`error`, reports crash |

Logs and diagnostics always go to stderr. The adapter captures stderr for debugging but does not parse it as protocol data.

## Testing Strategy

Three levels, matching the "measure before optimizing" philosophy.

### Level 1: Unit Tests (each package independently)

**Python bridge** — pytest:
- Mock `AmplifierSession` and verify JSONL output format
- Test arg parsing, error handling, timeout behavior
- No real LLM calls, no API keys needed, CI-friendly

**TypeScript adapter** — vitest:
- Mock `runChildProcess` and verify JSONL parsing
- Test `AdapterExecutionResult` construction
- Test environment diagnostics
- No real bridge process, CI-friendly

### Level 2: Integration Tests (bridge end-to-end)

A shell script that runs the real bridge with `provider-mock` (Amplifier's mock provider — no API key needed):

- Verifies: bridge starts, emits `init`, emits `content_delta` events, emits `result`, exits 0
- Tests error cases: bad bundle name, invalid CWD, timeout
- Proves the bridge drives a real `AmplifierSession` without costing money

### Level 3: Smoke Tests (full stack)

Runs the TypeScript adapter's `execute()` against the real bridge with a real provider (requires API key):

- Verifies the complete pipeline: Paperclip heartbeat → adapter → bridge → Amplifier → JSONL → result
- Run manually before releases, not in CI

**Not tested in v1:** Performance benchmarks, daemon mode, session resumption, multi-workspace concurrency.

## Open Questions

- **Cold start performance** — If subprocess-per-heartbeat latency is measured to be unacceptable, the upgrade path is HTTP server via Paperclip's existing `httpAdapter` type. No custom IPC.
- **Session resumption** — If cross-heartbeat memory proves valuable for same-issue multi-heartbeat scenarios, add `--session-id` to the bridge with `context-persistent` module. Currently, each heartbeat is a fresh session and Paperclip already sends full context each time.
- **Approval forwarding** — v1 auto-approves everything. v2 could wire the `ApprovalSystem` back to Paperclip's approval UI for human-in-the-loop workflows.
- **`amplifierd` integration** — If/when `amplifierd` matures with per-request bundle URI support, it could replace the Python bridge entirely.
- **Upstream contribution** — Currently an external plugin. Could contribute to Paperclip's monorepo as a built-in adapter if there's community demand.
