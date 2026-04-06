# Phase 2: TypeScript Adapter — Implementation Plan

> **Execution:** Use the subagent-driven-development workflow to implement this plan.

**Goal:** Build the TypeScript adapter package (`@amplifier/paperclip-adapter`) that registers as a Paperclip external plugin, spawns the Python bridge per heartbeat, parses JSONL output, and returns `AdapterExecutionResult` to Paperclip.

**Architecture:** An npm package exporting `createServerAdapter()` that returns a `ServerAdapterModule`. The `execute()` function uses Paperclip's `runChildProcess()` to spawn `amplifier-paperclip-bridge`, pipes the rendered prompt to stdin, and parses JSONL events from stdout. The `testEnvironment()` function checks bridge availability and API keys. UI and CLI modules convert JSONL events to Paperclip's display formats.

**Tech Stack:** TypeScript 5.7+, Node.js 20+, `@paperclipai/adapter-utils` (peer dependency), `picocolors` for CLI output, `vitest` for tests.

**Depends on:** Phase 1 (Python bridge) must be complete. The bridge binary `amplifier-paperclip-bridge` must be installed and in PATH.

---

## Prerequisites

Before starting, ensure you have:
- Node.js 20+ installed
- `pnpm` or `npm` available
- Phase 1 complete — `amplifier-paperclip-bridge` installed and in PATH
- Paperclip cloned/installed (for `@paperclipai/adapter-utils` types)

The working directory for all tasks is: `/home/bkrabach/dev/paperclip-adapter/amplifier-paperclip-adapter/adapter/`

The repo root is: `/home/bkrabach/dev/paperclip-adapter/amplifier-paperclip-adapter/`

---

### Task 11: Scaffold Adapter Package

**Files:**
- Create: `adapter/package.json`
- Create: `adapter/tsconfig.json`
- Create: `adapter/src/index.ts` (empty placeholder)
- Create: `adapter/src/server/index.ts` (empty placeholder)
- Create: `adapter/src/server/execute.ts` (empty placeholder)
- Create: `adapter/src/server/parse.ts` (empty placeholder)
- Create: `adapter/src/server/test.ts` (empty placeholder)
- Create: `adapter/src/ui/index.ts` (empty placeholder)
- Create: `adapter/src/ui/parse-stdout.ts` (empty placeholder)
- Create: `adapter/src/cli/index.ts` (empty placeholder)
- Create: `adapter/src/cli/format-event.ts` (empty placeholder)
- Create: `adapter/tests/setup.ts`

**Step 1: Create package.json**

Create `adapter/package.json`:
```json
{
  "name": "@amplifier/paperclip-adapter",
  "version": "0.1.0",
  "description": "Paperclip adapter for Amplifier — connects Amplifier as an agent runtime to Paperclip's control plane",
  "license": "MIT",
  "homepage": "https://github.com/bkrabach/amplifier-paperclip-adapter",
  "repository": {
    "type": "git",
    "url": "https://github.com/bkrabach/amplifier-paperclip-adapter",
    "directory": "adapter"
  },
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./server": "./src/server/index.ts",
    "./ui": "./src/ui/index.ts",
    "./cli": "./src/cli/index.ts"
  },
  "publishConfig": {
    "access": "public",
    "exports": {
      ".": {
        "types": "./dist/index.d.ts",
        "import": "./dist/index.js"
      },
      "./server": {
        "types": "./dist/server/index.d.ts",
        "import": "./dist/server/index.js"
      },
      "./ui": {
        "types": "./dist/ui/index.d.ts",
        "import": "./dist/ui/index.js"
      },
      "./cli": {
        "types": "./dist/cli/index.d.ts",
        "import": "./dist/cli/index.js"
      }
    },
    "main": "./dist/index.js",
    "types": "./dist/index.d.ts"
  },
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "tsc",
    "clean": "rm -rf dist",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "peerDependencies": {
    "@paperclipai/adapter-utils": ">=0.3.0"
  },
  "dependencies": {
    "picocolors": "^1.1.1"
  },
  "devDependencies": {
    "@paperclipai/adapter-utils": "file:../../paperclip/packages/adapter-utils",
    "@types/node": "^24.6.0",
    "typescript": "^5.7.3",
    "vitest": "^3.2.1"
  }
}
```

> **Dependency strategy:** `@paperclipai/adapter-utils` is a `peerDependency` (the adapter is installed alongside Paperclip which provides it). For local development, a `devDependencies` entry points at the local Paperclip checkout via `file:` protocol. In production, Paperclip's own `node_modules` satisfies the peer dep.

**Step 2: Create tsconfig.json**

Create `adapter/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"]
}
```

**Step 3: Create empty placeholder source files**

Create each of these files with a single-line placeholder:

`adapter/src/index.ts`:
```typescript
// Root metadata — type, label, models, configDoc, createServerAdapter
```

`adapter/src/server/index.ts`:
```typescript
// Server barrel — exports execute, testEnvironment, createServerAdapter
```

`adapter/src/server/execute.ts`:
```typescript
// Spawns amplifier-paperclip-bridge, parses JSONL, returns AdapterExecutionResult
```

`adapter/src/server/parse.ts`:
```typescript
// JSONL stdout parser — parseAmplifierStream()
```

`adapter/src/server/test.ts`:
```typescript
// Environment diagnostics — testEnvironment()
```

`adapter/src/ui/index.ts`:
```typescript
// UI barrel — exports parseAmplifierStdoutLine
```

`adapter/src/ui/parse-stdout.ts`:
```typescript
// Converts JSONL lines to TranscriptEntry[] for Paperclip's run viewer
```

`adapter/src/cli/index.ts`:
```typescript
// CLI barrel — exports printAmplifierStreamEvent
```

`adapter/src/cli/format-event.ts`:
```typescript
// Terminal formatter for JSONL events during --watch
```

**Step 4: Create test setup**

Create `adapter/tests/setup.ts`:
```typescript
// Vitest global test setup
```

**Step 5: Install dependencies**

Run:
```bash
cd /home/bkrabach/dev/paperclip-adapter/amplifier-paperclip-adapter/adapter
npm install
```
Expected: Dependencies install successfully. The `file:` reference to adapter-utils resolves to the local Paperclip checkout.

**Step 6: Verify TypeScript compiles**

Run:
```bash
cd /home/bkrabach/dev/paperclip-adapter/amplifier-paperclip-adapter/adapter
npx tsc --noEmit
```
Expected: No errors (all files are effectively empty).

**Step 7: Commit**

Run:
```bash
cd /home/bkrabach/dev/paperclip-adapter/amplifier-paperclip-adapter
git add adapter/
git commit -m "feat: scaffold TypeScript adapter package"
```

---

### Task 12: Root Metadata & createServerAdapter

**Files:**
- Modify: `adapter/src/index.ts`
- Modify: `adapter/src/server/index.ts`

**Step 1: Write src/index.ts with metadata and createServerAdapter re-export**

Replace contents of `adapter/src/index.ts`:
```typescript
export const type = "amplifier_local";
export const label = "Amplifier (local)";

export const models = [
  { id: "bundle-default", label: "Bundle Default" },
];

export const agentConfigurationDoc = `# amplifier_local agent configuration

Adapter: amplifier_local

Core fields:
- cwd (string, optional): absolute working directory for the agent process (created if missing)
- bundle (string, optional): Amplifier bundle URI — name, file path, or git+https URL. Default: "amplifier-dev"
- timeout (number, optional): max seconds per heartbeat execution. Default: 300
- promptTemplate (string, optional): run prompt template with {{variable}} substitution
- command (string, optional): bridge command. Default: "amplifier-paperclip-bridge"
- env (object, optional): KEY=VALUE environment variables passed to the bridge process

Notes:
- The bridge spawns a fresh AmplifierSession per heartbeat (no session persistence across heartbeats).
- Bundle URI supports registered names ("amplifier-dev"), local file paths, and git+https URLs.
- API keys (ANTHROPIC_API_KEY, OPENAI_API_KEY, etc.) are passed through from the server environment and adapter config env.
`;

// Required by plugin-loader convention
export { createServerAdapter } from "./server/index.js";
```

**Step 2: Write src/server/index.ts with createServerAdapter factory**

Replace contents of `adapter/src/server/index.ts`:
```typescript
import type { ServerAdapterModule } from "@paperclipai/adapter-utils";
import { type, models, agentConfigurationDoc } from "../index.js";
import { execute } from "./execute.js";
import { testEnvironment } from "./test.js";

export { execute } from "./execute.js";
export { testEnvironment } from "./test.js";
export { parseAmplifierStream } from "./parse.js";

export function createServerAdapter(): ServerAdapterModule {
  return {
    type,
    execute,
    testEnvironment,
    models,
    agentConfigurationDoc,
  };
}
```

**Step 3: Verify it compiles**

Run:
```bash
cd /home/bkrabach/dev/paperclip-adapter/amplifier-paperclip-adapter/adapter
npx tsc --noEmit
```
Expected: Errors about missing exports from execute.ts, test.ts, parse.ts (those are still empty placeholders). This is expected — they'll be implemented in the following tasks.

**Step 4: Commit**

Run:
```bash
cd /home/bkrabach/dev/paperclip-adapter/amplifier-paperclip-adapter
git add adapter/src/index.ts adapter/src/server/index.ts
git commit -m "feat: root metadata and createServerAdapter factory"
```

---

### Task 13: JSONL Parser (TDD)

**Files:**
- Create: `adapter/tests/parse.test.ts`
- Modify: `adapter/src/server/parse.ts`

**Step 1: Write the failing tests**

Create `adapter/tests/parse.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { parseAmplifierStream } from "../src/server/parse.js";

describe("parseAmplifierStream", () => {
  it("parses a complete successful session", () => {
    const stdout = [
      '{"type":"init","session_id":"abc-123","model":"claude-sonnet-4-5","bundle":"amplifier-dev"}',
      '{"type":"content_delta","text":"Working on it..."}',
      '{"type":"tool_start","tool":"bash","input":"git status"}',
      '{"type":"tool_end","tool":"bash","output":"On branch main"}',
      '{"type":"result","session_id":"abc-123","response":"Done. I committed the fix.","usage":{"input_tokens":1500,"output_tokens":800},"cost_usd":0.03,"status":"completed"}',
    ].join("\n");

    const result = parseAmplifierStream(stdout);

    expect(result.sessionId).toBe("abc-123");
    expect(result.model).toBe("claude-sonnet-4-5");
    expect(result.bundle).toBe("amplifier-dev");
    expect(result.summary).toBe("Done. I committed the fix.");
    expect(result.usage).toEqual({ inputTokens: 1500, outputTokens: 800 });
    expect(result.costUsd).toBe(0.03);
    expect(result.error).toBeNull();
  });

  it("parses an error session", () => {
    const stdout = [
      '{"type":"init","session_id":"abc-123","model":"bundle-default","bundle":"amplifier-dev"}',
      '{"type":"error","message":"TimeoutError: exceeded 300s","code":"TIMEOUT"}',
    ].join("\n");

    const result = parseAmplifierStream(stdout);

    expect(result.sessionId).toBe("abc-123");
    expect(result.error).toEqual({
      message: "TimeoutError: exceeded 300s",
      code: "TIMEOUT",
    });
    expect(result.summary).toBe("");
  });

  it("handles empty stdout", () => {
    const result = parseAmplifierStream("");

    expect(result.sessionId).toBeNull();
    expect(result.model).toBe("");
    expect(result.summary).toBe("");
    expect(result.error).toBeNull();
  });

  it("handles malformed JSON lines gracefully", () => {
    const stdout = [
      "not json at all",
      '{"type":"init","session_id":"s1","model":"m","bundle":"b"}',
      "also not json",
      '{"type":"result","session_id":"s1","response":"ok","usage":null,"cost_usd":null,"status":"completed"}',
    ].join("\n");

    const result = parseAmplifierStream(stdout);

    expect(result.sessionId).toBe("s1");
    expect(result.summary).toBe("ok");
  });

  it("handles result with null usage and cost", () => {
    const stdout = [
      '{"type":"init","session_id":"s1","model":"m","bundle":"b"}',
      '{"type":"result","session_id":"s1","response":"done","usage":null,"cost_usd":null,"status":"completed"}',
    ].join("\n");

    const result = parseAmplifierStream(stdout);

    expect(result.usage).toBeNull();
    expect(result.costUsd).toBeNull();
  });

  it("accumulates content_delta text as assistantText", () => {
    const stdout = [
      '{"type":"init","session_id":"s1","model":"m","bundle":"b"}',
      '{"type":"content_delta","text":"Hello "}',
      '{"type":"content_delta","text":"world"}',
      '{"type":"result","session_id":"s1","response":"Hello world","usage":null,"cost_usd":null,"status":"completed"}',
    ].join("\n");

    const result = parseAmplifierStream(stdout);

    expect(result.assistantText).toBe("Hello world");
  });

  it("collects tool events", () => {
    const stdout = [
      '{"type":"init","session_id":"s1","model":"m","bundle":"b"}',
      '{"type":"tool_start","tool":"bash","input":"ls"}',
      '{"type":"tool_end","tool":"bash","output":"file.txt"}',
      '{"type":"tool_start","tool":"read_file","input":"file.txt"}',
      '{"type":"tool_end","tool":"read_file","output":"contents"}',
      '{"type":"result","session_id":"s1","response":"done","usage":null,"cost_usd":null,"status":"completed"}',
    ].join("\n");

    const result = parseAmplifierStream(stdout);

    expect(result.toolEvents).toHaveLength(4);
    expect(result.toolEvents[0]).toEqual({ kind: "start", tool: "bash", input: "ls" });
    expect(result.toolEvents[1]).toEqual({ kind: "end", tool: "bash", output: "file.txt" });
  });
});
```

**Step 2: Run tests to verify they fail**

Run:
```bash
cd /home/bkrabach/dev/paperclip-adapter/amplifier-paperclip-adapter/adapter
npx vitest run tests/parse.test.ts
```
Expected: FAIL — `parseAmplifierStream` is not exported from `./src/server/parse.js`.

**Step 3: Write the implementation**

Replace contents of `adapter/src/server/parse.ts`:
```typescript
/**
 * Parse JSONL stdout from the amplifier-paperclip-bridge.
 *
 * The bridge emits 6 event types: init, content_delta, tool_start, tool_end, result, error.
 * This parser extracts session metadata, usage, cost, and the final response.
 */

export interface AmplifierToolEvent {
  kind: "start" | "end";
  tool: string;
  input?: string;
  output?: string;
}

export interface AmplifierStreamResult {
  sessionId: string | null;
  model: string;
  bundle: string;
  summary: string;
  assistantText: string;
  usage: { inputTokens: number; outputTokens: number } | null;
  costUsd: number | null;
  error: { message: string; code: string } | null;
  toolEvents: AmplifierToolEvent[];
}

function safeJsonParse(line: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(line);
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

function asString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function parseAmplifierStream(stdout: string): AmplifierStreamResult {
  let sessionId: string | null = null;
  let model = "";
  let bundle = "";
  let summary = "";
  const assistantChunks: string[] = [];
  let usage: { inputTokens: number; outputTokens: number } | null = null;
  let costUsd: number | null = null;
  let error: { message: string; code: string } | null = null;
  const toolEvents: AmplifierToolEvent[] = [];

  for (const rawLine of stdout.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const event = safeJsonParse(line);
    if (!event) continue;

    const type = asString(event.type, "");

    if (type === "init") {
      sessionId = asString(event.session_id, sessionId ?? "") || sessionId;
      model = asString(event.model, model);
      bundle = asString(event.bundle, bundle);
      continue;
    }

    if (type === "content_delta") {
      const text = asString(event.text, "");
      if (text) assistantChunks.push(text);
      continue;
    }

    if (type === "tool_start") {
      toolEvents.push({
        kind: "start",
        tool: asString(event.tool, "unknown"),
        input: asString(event.input, ""),
      });
      continue;
    }

    if (type === "tool_end") {
      toolEvents.push({
        kind: "end",
        tool: asString(event.tool, "unknown"),
        output: asString(event.output, ""),
      });
      continue;
    }

    if (type === "result") {
      sessionId = asString(event.session_id, sessionId ?? "") || sessionId;
      summary = asString(event.response, "");

      if (
        typeof event.usage === "object" &&
        event.usage !== null &&
        !Array.isArray(event.usage)
      ) {
        const u = event.usage as Record<string, unknown>;
        const inputTokens = asNumber(u.input_tokens);
        const outputTokens = asNumber(u.output_tokens);
        if (inputTokens !== null && outputTokens !== null) {
          usage = { inputTokens, outputTokens };
        }
      }

      costUsd = asNumber(event.cost_usd);
      continue;
    }

    if (type === "error") {
      error = {
        message: asString(event.message, "Unknown error"),
        code: asString(event.code, "UNKNOWN"),
      };
      continue;
    }
  }

  return {
    sessionId,
    model,
    bundle,
    summary,
    assistantText: assistantChunks.join(""),
    usage,
    costUsd,
    error,
    toolEvents,
  };
}
```

**Step 4: Run tests to verify they pass**

Run:
```bash
cd /home/bkrabach/dev/paperclip-adapter/amplifier-paperclip-adapter/adapter
npx vitest run tests/parse.test.ts
```
Expected: All 7 tests PASS.

**Step 5: Commit**

Run:
```bash
cd /home/bkrabach/dev/paperclip-adapter/amplifier-paperclip-adapter
git add adapter/src/server/parse.ts adapter/tests/parse.test.ts
git commit -m "feat: JSONL stream parser with tests"
```

---

### Task 14: Execute Function (TDD)

This is the core task — wiring Paperclip's heartbeat context through `runChildProcess` to the bridge, and converting the JSONL result into `AdapterExecutionResult`.

**Files:**
- Create: `adapter/tests/execute.test.ts`
- Modify: `adapter/src/server/execute.ts`

**Step 1: Write the failing tests**

Create `adapter/tests/execute.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { execute } from "../src/server/execute.js";
import type { AdapterExecutionContext } from "@paperclipai/adapter-utils";

/**
 * Helper to create a fake script that echoes JSONL to stdout.
 * Uses Node.js itself as the "bridge command" with an inline script.
 */
function buildFakeContext(overrides: {
  configOverrides?: Record<string, unknown>;
  stdout?: string;
  exitCode?: number;
} = {}): AdapterExecutionContext {
  const initEvent = '{"type":"init","session_id":"test-sid","model":"test-model","bundle":"amplifier-dev"}';
  const resultEvent = '{"type":"result","session_id":"test-sid","response":"I did the thing.","usage":{"input_tokens":100,"output_tokens":50},"cost_usd":0.01,"status":"completed"}';
  const defaultStdout = `${initEvent}\n${resultEvent}`;

  // Build an inline Node script that writes JSONL to stdout and exits
  const stdout = overrides.stdout ?? defaultStdout;
  const exitCode = overrides.exitCode ?? 0;
  const script = `process.stdout.write(${JSON.stringify(stdout)}); process.exit(${exitCode});`;

  return {
    runId: "test-run-001",
    agent: {
      id: "agent-1",
      companyId: "company-1",
      name: "Test Agent",
      adapterType: "amplifier_local",
      adapterConfig: {},
    },
    runtime: {
      sessionId: null,
      sessionParams: null,
      sessionDisplayId: null,
      taskKey: null,
    },
    config: {
      command: process.execPath,
      extraArgs: ["-e", script],
      cwd: process.cwd(),
      bundle: "amplifier-dev",
      timeout: 30,
      ...overrides.configOverrides,
    },
    context: {},
    onLog: vi.fn(async () => {}),
    onMeta: vi.fn(async () => {}),
    onSpawn: vi.fn(async () => {}),
  };
}

describe("execute", () => {
  it("returns a successful AdapterExecutionResult", async () => {
    const ctx = buildFakeContext();
    const result = await execute(ctx);

    expect(result.exitCode).toBe(0);
    expect(result.timedOut).toBe(false);
    expect(result.errorMessage).toBeFalsy();
    expect(result.summary).toBe("I did the thing.");
    expect(result.sessionId).toBe("test-sid");
    expect(result.model).toBe("test-model");
    expect(result.costUsd).toBe(0.01);
    expect(result.usage).toEqual({
      inputTokens: 100,
      outputTokens: 50,
    });
  });

  it("returns error result when bridge emits error event", async () => {
    const stdout = [
      '{"type":"init","session_id":"s1","model":"m","bundle":"b"}',
      '{"type":"error","message":"Bundle not found","code":"BUNDLE_NOT_FOUND"}',
    ].join("\n");

    const ctx = buildFakeContext({ stdout, exitCode: 1 });
    const result = await execute(ctx);

    expect(result.exitCode).toBe(1);
    expect(result.errorMessage).toContain("Bundle not found");
    expect(result.errorCode).toBe("BUNDLE_NOT_FOUND");
  });

  it("returns error when bridge exits non-zero with no output", async () => {
    const ctx = buildFakeContext({ stdout: "", exitCode: 1 });
    const result = await execute(ctx);

    expect(result.exitCode).toBe(1);
    expect(result.errorMessage).toBeTruthy();
  });

  it("uses default bundle when not configured", async () => {
    const ctx = buildFakeContext({ configOverrides: { bundle: undefined } });
    // The execute function should use "amplifier-dev" as default
    // We verify it doesn't throw and returns a valid result
    const result = await execute(ctx);
    expect(result.exitCode).toBe(0);
  });
});
```

**Step 2: Run tests to verify they fail**

Run:
```bash
cd /home/bkrabach/dev/paperclip-adapter/amplifier-paperclip-adapter/adapter
npx vitest run tests/execute.test.ts
```
Expected: FAIL — `execute` is not exported from `../src/server/execute.js`.

**Step 3: Write the implementation**

Replace contents of `adapter/src/server/execute.ts`:
```typescript
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type {
  AdapterExecutionContext,
  AdapterExecutionResult,
} from "@paperclipai/adapter-utils";
import {
  asString,
  asNumber,
  asStringArray,
  parseObject,
  buildPaperclipEnv,
  joinPromptSections,
  renderTemplate,
  renderPaperclipWakePrompt,
  stringifyPaperclipWakePayload,
  ensureAbsoluteDirectory,
  ensureCommandResolvable,
  ensurePathInEnv,
  buildInvocationEnvForLogs,
  resolveCommandForLogs,
  runChildProcess,
  readPaperclipRuntimeSkillEntries,
} from "@paperclipai/adapter-utils/server-utils";
import { type as adapterType } from "../index.js";
import { parseAmplifierStream } from "./parse.js";

/**
 * Build a temp directory with Paperclip skills symlinked into
 * .amplifier/skills/ so the bridge's tool-skills module discovers them.
 */
async function buildSkillsDir(
  config: Record<string, unknown>,
  moduleDir: string,
): Promise<string | null> {
  const availableEntries = await readPaperclipRuntimeSkillEntries(
    config,
    moduleDir,
  );
  if (availableEntries.length === 0) return null;

  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "amplifier-skills-"));
  const target = path.join(tmp, ".amplifier", "skills");
  await fs.mkdir(target, { recursive: true });

  for (const entry of availableEntries) {
    await fs.symlink(
      entry.source,
      path.join(target, entry.runtimeName),
    );
  }

  return tmp;
}

export async function execute(
  ctx: AdapterExecutionContext,
): Promise<AdapterExecutionResult> {
  const { runId, agent, runtime, config, context, onLog, onMeta, onSpawn } =
    ctx;

  // --- Read config ---
  const command = asString(config.command, "amplifier-paperclip-bridge");
  const bundle = asString(config.bundle, "amplifier-dev");
  const timeoutSec = asNumber(config.timeout, 300);
  const graceSec = asNumber(config.graceSec, 20);
  const extraArgs = asStringArray(config.extraArgs);
  const configuredCwd = asString(config.cwd, "");
  const cwd = configuredCwd || process.cwd();
  await ensureAbsoluteDirectory(cwd, { createIfMissing: true });

  // --- Build environment ---
  const envConfig = parseObject(config.env);
  const env: Record<string, string> = { ...buildPaperclipEnv(agent) };
  env.PAPERCLIP_RUN_ID = runId;

  // Pass through Paperclip wake context
  const wakePayloadJson = stringifyPaperclipWakePayload(
    context.paperclipWake,
  );
  if (wakePayloadJson) {
    env.PAPERCLIP_WAKE_PAYLOAD_JSON = wakePayloadJson;
  }

  // Merge user-configured env vars
  for (const [key, value] of Object.entries(envConfig)) {
    if (typeof value === "string") env[key] = value;
  }

  const runtimeEnv = ensurePathInEnv({ ...process.env, ...env });
  const resolvedCommand = await resolveCommandForLogs(
    command,
    cwd,
    runtimeEnv,
  );

  // --- Build skills directory ---
  const moduleDir = path.dirname(new URL(import.meta.url).pathname);
  const skillsDir = await buildSkillsDir(config, moduleDir);
  if (skillsDir) {
    env.AMPLIFIER_SKILLS_DIR = path.join(skillsDir, ".amplifier", "skills");
  }

  // --- Render prompt ---
  const promptTemplate = asString(
    config.promptTemplate,
    "You are agent {{agent.id}} ({{agent.name}}). Continue your Paperclip work.",
  );
  const bootstrapPromptTemplate = asString(
    config.bootstrapPromptTemplate,
    "",
  );
  const templateData = {
    agentId: agent.id,
    companyId: agent.companyId,
    runId,
    company: { id: agent.companyId },
    agent,
    run: { id: runId, source: "on_demand" },
    context,
  };
  const renderedBootstrapPrompt =
    bootstrapPromptTemplate.trim().length > 0
      ? renderTemplate(bootstrapPromptTemplate, templateData).trim()
      : "";
  const wakePrompt = renderPaperclipWakePrompt(context.paperclipWake, {
    resumedSession: false,
  });
  const renderedPrompt = renderTemplate(promptTemplate, templateData);
  const sessionHandoffNote = asString(
    context.paperclipSessionHandoffMarkdown,
    "",
  ).trim();
  const prompt = joinPromptSections([
    renderedBootstrapPrompt,
    wakePrompt,
    sessionHandoffNote,
    renderedPrompt,
  ]);

  // --- Build command args ---
  const args = [
    "--bundle",
    bundle,
    "--cwd",
    cwd,
    "--timeout",
    String(timeoutSec),
    ...extraArgs,
  ];

  // --- Emit invocation metadata ---
  const loggedEnv = buildInvocationEnvForLogs(env, {
    runtimeEnv,
    resolvedCommand,
  });
  if (onMeta) {
    await onMeta({
      adapterType,
      command: resolvedCommand,
      cwd,
      commandArgs: args,
      env: loggedEnv,
      prompt,
      context,
    });
  }

  // --- Spawn bridge ---
  try {
    const proc = await runChildProcess(runId, command, args, {
      cwd,
      env,
      stdin: prompt,
      timeoutSec,
      graceSec,
      onSpawn,
      onLog,
    });

    // --- Parse result ---
    const parsed = parseAmplifierStream(proc.stdout);

    if (proc.timedOut) {
      return {
        exitCode: proc.exitCode,
        signal: proc.signal,
        timedOut: true,
        errorMessage: `Timed out after ${timeoutSec}s`,
        errorCode: "timeout",
      };
    }

    if (parsed.error) {
      return {
        exitCode: proc.exitCode,
        signal: proc.signal,
        timedOut: false,
        errorMessage: parsed.error.message,
        errorCode: parsed.error.code,
        summary: parsed.summary || undefined,
        sessionId: parsed.sessionId,
      };
    }

    if ((proc.exitCode ?? 0) !== 0 && !parsed.summary) {
      // Bridge crashed with no parseable output
      const stderrLine = proc.stderr
        .split(/\r?\n/)
        .map((l) => l.trim())
        .find(Boolean);
      return {
        exitCode: proc.exitCode,
        signal: proc.signal,
        timedOut: false,
        errorMessage: stderrLine
          ? `Bridge exited with code ${proc.exitCode ?? -1}: ${stderrLine}`
          : `Bridge exited with code ${proc.exitCode ?? -1}`,
        errorCode: "ADAPTER_ERROR",
      };
    }

    return {
      exitCode: proc.exitCode,
      signal: proc.signal,
      timedOut: false,
      errorMessage:
        (proc.exitCode ?? 0) !== 0
          ? `Bridge exited with code ${proc.exitCode ?? -1}`
          : null,
      usage: parsed.usage
        ? { inputTokens: parsed.usage.inputTokens, outputTokens: parsed.usage.outputTokens }
        : undefined,
      sessionId: parsed.sessionId,
      provider: "amplifier",
      model: parsed.model || undefined,
      costUsd: parsed.costUsd,
      summary: parsed.summary || parsed.assistantText || undefined,
      resultJson: { stdout: proc.stdout },
    };
  } finally {
    // Clean up temp skills directory
    if (skillsDir) {
      fs.rm(skillsDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}
```

**Step 4: Run tests to verify they pass**

Run:
```bash
cd /home/bkrabach/dev/paperclip-adapter/amplifier-paperclip-adapter/adapter
npx vitest run tests/execute.test.ts
```
Expected: All 4 tests PASS.

> **Note:** The tests use `process.execPath` (Node.js itself) with `-e` to run inline scripts that simulate the bridge's JSONL output. This avoids needing the real bridge installed during unit testing.

**Step 5: Commit**

Run:
```bash
cd /home/bkrabach/dev/paperclip-adapter/amplifier-paperclip-adapter
git add adapter/src/server/execute.ts adapter/tests/execute.test.ts
git commit -m "feat: execute function spawning bridge with JSONL parsing"
```

---

### Task 15: Environment Test (TDD)

**Files:**
- Create: `adapter/tests/test-env.test.ts`
- Modify: `adapter/src/server/test.ts`

**Step 1: Write the failing tests**

Create `adapter/tests/test-env.test.ts`:
```typescript
import { describe, it, expect, vi } from "vitest";
import { testEnvironment } from "../src/server/test.js";

describe("testEnvironment", () => {
  it("returns pass when bridge is available", async () => {
    // Use node as a stand-in for the bridge command
    const result = await testEnvironment({
      companyId: "company-1",
      adapterType: "amplifier_local",
      config: {
        command: process.execPath,
        cwd: process.cwd(),
      },
    });

    expect(result.adapterType).toBe("amplifier_local");
    expect(result.status).toBe("pass");
    expect(result.checks.length).toBeGreaterThan(0);
    expect(result.testedAt).toBeTruthy();
  });

  it("returns fail when command is not found", async () => {
    const result = await testEnvironment({
      companyId: "company-1",
      adapterType: "amplifier_local",
      config: {
        command: "nonexistent-command-xyz-999",
        cwd: process.cwd(),
      },
    });

    expect(result.status).toBe("fail");
    const errorCheck = result.checks.find((c) => c.level === "error");
    expect(errorCheck).toBeTruthy();
    expect(errorCheck!.code).toBe("amplifier_command_unresolvable");
  });

  it("returns error for invalid cwd", async () => {
    const result = await testEnvironment({
      companyId: "company-1",
      adapterType: "amplifier_local",
      config: {
        command: process.execPath,
        cwd: "/nonexistent/path/that/does/not/exist",
      },
    });

    const errorCheck = result.checks.find(
      (c) => c.code === "amplifier_cwd_invalid",
    );
    expect(errorCheck).toBeTruthy();
    expect(errorCheck!.level).toBe("error");
  });

  it("warns when no API keys are set", async () => {
    // Save and clear API keys
    const saved = {
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    };
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;

    try {
      const result = await testEnvironment({
        companyId: "company-1",
        adapterType: "amplifier_local",
        config: {
          command: process.execPath,
          cwd: process.cwd(),
        },
      });

      const warnCheck = result.checks.find(
        (c) => c.code === "amplifier_no_api_keys",
      );
      expect(warnCheck).toBeTruthy();
      expect(warnCheck!.level).toBe("warn");
    } finally {
      // Restore API keys
      if (saved.ANTHROPIC_API_KEY)
        process.env.ANTHROPIC_API_KEY = saved.ANTHROPIC_API_KEY;
      if (saved.OPENAI_API_KEY)
        process.env.OPENAI_API_KEY = saved.OPENAI_API_KEY;
    }
  });
});
```

**Step 2: Run tests to verify they fail**

Run:
```bash
cd /home/bkrabach/dev/paperclip-adapter/amplifier-paperclip-adapter/adapter
npx vitest run tests/test-env.test.ts
```
Expected: FAIL — `testEnvironment` is not exported from `../src/server/test.js`.

**Step 3: Write the implementation**

Replace contents of `adapter/src/server/test.ts`:
```typescript
import type {
  AdapterEnvironmentCheck,
  AdapterEnvironmentTestContext,
  AdapterEnvironmentTestResult,
} from "@paperclipai/adapter-utils";
import {
  asString,
  parseObject,
  ensureAbsoluteDirectory,
  ensureCommandResolvable,
  ensurePathInEnv,
} from "@paperclipai/adapter-utils/server-utils";

function summarizeStatus(
  checks: AdapterEnvironmentCheck[],
): AdapterEnvironmentTestResult["status"] {
  if (checks.some((c) => c.level === "error")) return "fail";
  if (checks.some((c) => c.level === "warn")) return "warn";
  return "pass";
}

function isNonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function testEnvironment(
  ctx: AdapterEnvironmentTestContext,
): Promise<AdapterEnvironmentTestResult> {
  const checks: AdapterEnvironmentCheck[] = [];
  const config = parseObject(ctx.config);
  const command = asString(config.command, "amplifier-paperclip-bridge");
  const cwd = asString(config.cwd, process.cwd());

  // Check 1: CWD is valid
  try {
    await ensureAbsoluteDirectory(cwd, { createIfMissing: false });
    checks.push({
      code: "amplifier_cwd_valid",
      level: "info",
      message: `Working directory is valid: ${cwd}`,
    });
  } catch (err) {
    checks.push({
      code: "amplifier_cwd_invalid",
      level: "error",
      message:
        err instanceof Error ? err.message : "Invalid working directory",
      detail: cwd,
    });
  }

  // Check 2: Bridge command is resolvable
  const envConfig = parseObject(config.env);
  const env: Record<string, string> = {};
  for (const [key, value] of Object.entries(envConfig)) {
    if (typeof value === "string") env[key] = value;
  }
  const runtimeEnv = ensurePathInEnv({ ...process.env, ...env });

  try {
    await ensureCommandResolvable(command, cwd, runtimeEnv);
    checks.push({
      code: "amplifier_command_resolvable",
      level: "info",
      message: `Bridge command is executable: ${command}`,
    });
  } catch (err) {
    checks.push({
      code: "amplifier_command_unresolvable",
      level: "error",
      message:
        err instanceof Error ? err.message : "Bridge command not found",
      detail: command,
      hint: "Install the bridge: pip install amplifier-paperclip-bridge (or see install.sh)",
    });
  }

  // Check 3: API keys
  const configApiKeys = [
    env.ANTHROPIC_API_KEY,
    env.OPENAI_API_KEY,
  ];
  const hostApiKeys = [
    process.env.ANTHROPIC_API_KEY,
    process.env.OPENAI_API_KEY,
  ];
  const hasAnyKey =
    configApiKeys.some(isNonEmpty) || hostApiKeys.some(isNonEmpty);

  if (hasAnyKey) {
    checks.push({
      code: "amplifier_api_key_detected",
      level: "info",
      message: "At least one LLM API key is configured.",
    });
  } else {
    checks.push({
      code: "amplifier_no_api_keys",
      level: "warn",
      message:
        "No LLM API keys detected (ANTHROPIC_API_KEY, OPENAI_API_KEY).",
      hint: "Set at least one API key in the server environment or adapter config env.",
    });
  }

  // Check 4: Bundle configuration
  const bundle = asString(config.bundle, "amplifier-dev");
  checks.push({
    code: "amplifier_bundle_configured",
    level: "info",
    message: `Bundle: ${bundle}`,
  });

  return {
    adapterType: ctx.adapterType,
    status: summarizeStatus(checks),
    checks,
    testedAt: new Date().toISOString(),
  };
}
```

**Step 4: Run tests to verify they pass**

Run:
```bash
cd /home/bkrabach/dev/paperclip-adapter/amplifier-paperclip-adapter/adapter
npx vitest run tests/test-env.test.ts
```
Expected: All 4 tests PASS.

**Step 5: Commit**

Run:
```bash
cd /home/bkrabach/dev/paperclip-adapter/amplifier-paperclip-adapter
git add adapter/src/server/test.ts adapter/tests/test-env.test.ts
git commit -m "feat: environment test diagnostics with tests"
```

---

### Task 16: UI Parser (TDD)

**Files:**
- Create: `adapter/tests/parse-stdout.test.ts`
- Modify: `adapter/src/ui/parse-stdout.ts`
- Modify: `adapter/src/ui/index.ts`

**Step 1: Write the failing tests**

Create `adapter/tests/parse-stdout.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { parseAmplifierStdoutLine } from "../src/ui/parse-stdout.js";

const ts = "2026-04-06T12:00:00.000Z";

describe("parseAmplifierStdoutLine", () => {
  it("parses init event to init TranscriptEntry", () => {
    const line = '{"type":"init","session_id":"abc","model":"claude-sonnet-4-5","bundle":"amplifier-dev"}';
    const entries = parseAmplifierStdoutLine(line, ts);

    expect(entries).toHaveLength(1);
    expect(entries[0]).toEqual({
      kind: "init",
      ts,
      model: "claude-sonnet-4-5",
      sessionId: "abc",
    });
  });

  it("parses content_delta to assistant TranscriptEntry", () => {
    const line = '{"type":"content_delta","text":"Working on it..."}';
    const entries = parseAmplifierStdoutLine(line, ts);

    expect(entries).toHaveLength(1);
    expect(entries[0]).toEqual({
      kind: "assistant",
      ts,
      text: "Working on it...",
      delta: true,
    });
  });

  it("parses tool_start to tool_call TranscriptEntry", () => {
    const line = '{"type":"tool_start","tool":"bash","input":"git status"}';
    const entries = parseAmplifierStdoutLine(line, ts);

    expect(entries).toHaveLength(1);
    expect(entries[0]).toEqual({
      kind: "tool_call",
      ts,
      name: "bash",
      input: "git status",
    });
  });

  it("parses tool_end to tool_result TranscriptEntry", () => {
    const line = '{"type":"tool_end","tool":"bash","output":"On branch main"}';
    const entries = parseAmplifierStdoutLine(line, ts);

    expect(entries).toHaveLength(1);
    expect(entries[0]).toEqual({
      kind: "tool_result",
      ts,
      toolUseId: "",
      toolName: "bash",
      content: "On branch main",
      isError: false,
    });
  });

  it("parses result event to result TranscriptEntry", () => {
    const line = '{"type":"result","session_id":"abc","response":"Done.","usage":{"input_tokens":100,"output_tokens":50},"cost_usd":0.01,"status":"completed"}';
    const entries = parseAmplifierStdoutLine(line, ts);

    expect(entries).toHaveLength(1);
    expect(entries[0]).toEqual({
      kind: "result",
      ts,
      text: "Done.",
      inputTokens: 100,
      outputTokens: 50,
      cachedTokens: 0,
      costUsd: 0.01,
      subtype: "",
      isError: false,
      errors: [],
    });
  });

  it("parses error event to result TranscriptEntry with isError", () => {
    const line = '{"type":"error","message":"Timeout","code":"TIMEOUT"}';
    const entries = parseAmplifierStdoutLine(line, ts);

    expect(entries).toHaveLength(1);
    expect(entries[0]).toEqual({
      kind: "result",
      ts,
      text: "",
      inputTokens: 0,
      outputTokens: 0,
      cachedTokens: 0,
      costUsd: 0,
      subtype: "error",
      isError: true,
      errors: ["Timeout"],
    });
  });

  it("returns stdout entry for non-JSON lines", () => {
    const line = "plain text output";
    const entries = parseAmplifierStdoutLine(line, ts);

    expect(entries).toHaveLength(1);
    expect(entries[0]).toEqual({
      kind: "stdout",
      ts,
      text: "plain text output",
    });
  });

  it("skips empty content_delta text", () => {
    const line = '{"type":"content_delta","text":""}';
    const entries = parseAmplifierStdoutLine(line, ts);

    expect(entries).toHaveLength(1);
    expect(entries[0]).toEqual({
      kind: "stdout",
      ts,
      text: line,
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run:
```bash
cd /home/bkrabach/dev/paperclip-adapter/amplifier-paperclip-adapter/adapter
npx vitest run tests/parse-stdout.test.ts
```
Expected: FAIL — `parseAmplifierStdoutLine` is not exported from `../src/ui/parse-stdout.js`.

**Step 3: Write the implementation**

Replace contents of `adapter/src/ui/parse-stdout.ts`:
```typescript
import type { TranscriptEntry } from "@paperclipai/adapter-utils";

function safeJsonParse(text: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

function asNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

/**
 * Parse a single JSONL line from the Amplifier bridge stdout into
 * Paperclip TranscriptEntry objects for the run viewer UI.
 */
export function parseAmplifierStdoutLine(
  line: string,
  ts: string,
): TranscriptEntry[] {
  const parsed = safeJsonParse(line);
  if (!parsed) {
    return [{ kind: "stdout", ts, text: line }];
  }

  const type = typeof parsed.type === "string" ? parsed.type : "";

  // init -> init entry
  if (type === "init") {
    return [
      {
        kind: "init",
        ts,
        model: typeof parsed.model === "string" ? parsed.model : "unknown",
        sessionId:
          typeof parsed.session_id === "string" ? parsed.session_id : "",
      },
    ];
  }

  // content_delta -> assistant entry
  if (type === "content_delta") {
    const text = typeof parsed.text === "string" ? parsed.text : "";
    if (text) {
      return [{ kind: "assistant", ts, text, delta: true }];
    }
    return [{ kind: "stdout", ts, text: line }];
  }

  // tool_start -> tool_call entry
  if (type === "tool_start") {
    return [
      {
        kind: "tool_call",
        ts,
        name: typeof parsed.tool === "string" ? parsed.tool : "unknown",
        input: typeof parsed.input === "string" ? parsed.input : "",
      },
    ];
  }

  // tool_end -> tool_result entry
  if (type === "tool_end") {
    return [
      {
        kind: "tool_result",
        ts,
        toolUseId: "",
        toolName: typeof parsed.tool === "string" ? parsed.tool : "unknown",
        content: typeof parsed.output === "string" ? parsed.output : "",
        isError: false,
      },
    ];
  }

  // result -> result entry
  if (type === "result") {
    const usage =
      typeof parsed.usage === "object" &&
      parsed.usage !== null &&
      !Array.isArray(parsed.usage)
        ? (parsed.usage as Record<string, unknown>)
        : {};
    return [
      {
        kind: "result",
        ts,
        text: typeof parsed.response === "string" ? parsed.response : "",
        inputTokens: asNumber(usage.input_tokens),
        outputTokens: asNumber(usage.output_tokens),
        cachedTokens: 0,
        costUsd: asNumber(parsed.cost_usd),
        subtype: "",
        isError: false,
        errors: [],
      },
    ];
  }

  // error -> result entry with isError=true
  if (type === "error") {
    const message =
      typeof parsed.message === "string" ? parsed.message : "Unknown error";
    return [
      {
        kind: "result",
        ts,
        text: "",
        inputTokens: 0,
        outputTokens: 0,
        cachedTokens: 0,
        costUsd: 0,
        subtype: "error",
        isError: true,
        errors: [message],
      },
    ];
  }

  // Unknown event type — pass through as stdout
  return [{ kind: "stdout", ts, text: line }];
}
```

**Step 4: Update the UI barrel export**

Replace contents of `adapter/src/ui/index.ts`:
```typescript
export { parseAmplifierStdoutLine } from "./parse-stdout.js";
```

**Step 5: Run tests to verify they pass**

Run:
```bash
cd /home/bkrabach/dev/paperclip-adapter/amplifier-paperclip-adapter/adapter
npx vitest run tests/parse-stdout.test.ts
```
Expected: All 8 tests PASS.

**Step 6: Commit**

Run:
```bash
cd /home/bkrabach/dev/paperclip-adapter/amplifier-paperclip-adapter
git add adapter/src/ui/parse-stdout.ts adapter/src/ui/index.ts adapter/tests/parse-stdout.test.ts
git commit -m "feat: UI stdout parser for TranscriptEntry conversion"
```

---

### Task 17: CLI Formatter (TDD)

**Files:**
- Create: `adapter/tests/format-event.test.ts`
- Modify: `adapter/src/cli/format-event.ts`
- Modify: `adapter/src/cli/index.ts`

**Step 1: Write the failing tests**

Create `adapter/tests/format-event.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { printAmplifierStreamEvent } from "../src/cli/format-event.js";

describe("printAmplifierStreamEvent", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("prints init event with model and session", () => {
    printAmplifierStreamEvent(
      '{"type":"init","session_id":"abc","model":"claude-sonnet-4-5","bundle":"amplifier-dev"}',
      false,
    );

    expect(consoleSpy).toHaveBeenCalled();
    const output = consoleSpy.mock.calls[0]![0] as string;
    expect(output).toContain("claude-sonnet-4-5");
    expect(output).toContain("abc");
  });

  it("prints content_delta as assistant text", () => {
    printAmplifierStreamEvent(
      '{"type":"content_delta","text":"Working on it..."}',
      false,
    );

    expect(consoleSpy).toHaveBeenCalled();
    const output = consoleSpy.mock.calls[0]![0] as string;
    expect(output).toContain("Working on it...");
  });

  it("prints tool_start with tool name", () => {
    printAmplifierStreamEvent(
      '{"type":"tool_start","tool":"bash","input":"git status"}',
      false,
    );

    expect(consoleSpy).toHaveBeenCalled();
    const output = consoleSpy.mock.calls[0]![0] as string;
    expect(output).toContain("bash");
  });

  it("prints result with usage and cost", () => {
    printAmplifierStreamEvent(
      '{"type":"result","session_id":"abc","response":"Done.","usage":{"input_tokens":100,"output_tokens":50},"cost_usd":0.01,"status":"completed"}',
      false,
    );

    // Should print at least result text and tokens
    expect(consoleSpy).toHaveBeenCalled();
    const allOutput = consoleSpy.mock.calls.map((c) => c[0]).join("\n");
    expect(allOutput).toContain("Done.");
  });

  it("prints error with message", () => {
    printAmplifierStreamEvent(
      '{"type":"error","message":"Timeout exceeded","code":"TIMEOUT"}',
      false,
    );

    expect(consoleSpy).toHaveBeenCalled();
    const allOutput = consoleSpy.mock.calls.map((c) => c[0]).join("\n");
    expect(allOutput).toContain("Timeout exceeded");
  });

  it("prints raw line for non-JSON", () => {
    printAmplifierStreamEvent("plain text", false);

    expect(consoleSpy).toHaveBeenCalledWith("plain text");
  });

  it("skips empty lines", () => {
    printAmplifierStreamEvent("", false);
    printAmplifierStreamEvent("   ", false);

    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it("prints unknown events in debug mode", () => {
    printAmplifierStreamEvent(
      '{"type":"unknown_future_event","data":"test"}',
      true,
    );

    expect(consoleSpy).toHaveBeenCalled();
  });

  it("does not print unknown events in non-debug mode", () => {
    printAmplifierStreamEvent(
      '{"type":"unknown_future_event","data":"test"}',
      false,
    );

    expect(consoleSpy).not.toHaveBeenCalled();
  });
});
```

**Step 2: Run tests to verify they fail**

Run:
```bash
cd /home/bkrabach/dev/paperclip-adapter/amplifier-paperclip-adapter/adapter
npx vitest run tests/format-event.test.ts
```
Expected: FAIL — `printAmplifierStreamEvent` is not exported from `../src/cli/format-event.js`.

**Step 3: Write the implementation**

Replace contents of `adapter/src/cli/format-event.ts`:
```typescript
import pc from "picocolors";

/**
 * Print a single JSONL line from the Amplifier bridge to the terminal.
 * Used by `paperclipai run --watch` for live output.
 */
export function printAmplifierStreamEvent(
  raw: string,
  debug: boolean,
): void {
  const line = raw.trim();
  if (!line) return;

  let parsed: Record<string, unknown> | null = null;
  try {
    parsed = JSON.parse(line) as Record<string, unknown>;
  } catch {
    console.log(line);
    return;
  }

  const type = typeof parsed.type === "string" ? parsed.type : "";

  if (type === "init") {
    const model =
      typeof parsed.model === "string" ? parsed.model : "unknown";
    const sessionId =
      typeof parsed.session_id === "string" ? parsed.session_id : "";
    const bundle =
      typeof parsed.bundle === "string" ? parsed.bundle : "";
    console.log(
      pc.blue(
        `Amplifier initialized (model: ${model}${sessionId ? `, session: ${sessionId}` : ""}${bundle ? `, bundle: ${bundle}` : ""})`,
      ),
    );
    return;
  }

  if (type === "content_delta") {
    const text = typeof parsed.text === "string" ? parsed.text : "";
    if (text) {
      console.log(pc.green(`assistant: ${text}`));
    }
    return;
  }

  if (type === "tool_start") {
    const tool = typeof parsed.tool === "string" ? parsed.tool : "unknown";
    console.log(pc.yellow(`tool_call: ${tool}`));
    if (typeof parsed.input === "string" && parsed.input) {
      console.log(pc.gray(parsed.input));
    }
    return;
  }

  if (type === "tool_end") {
    const tool = typeof parsed.tool === "string" ? parsed.tool : "unknown";
    const output =
      typeof parsed.output === "string" ? parsed.output : "";
    console.log(pc.cyan(`tool_result: ${tool}`));
    if (output) {
      console.log(pc.gray(output));
    }
    return;
  }

  if (type === "result") {
    const response =
      typeof parsed.response === "string" ? parsed.response : "";
    if (response) {
      console.log(pc.green("result:"));
      console.log(response);
    }
    const usage =
      typeof parsed.usage === "object" &&
      parsed.usage !== null &&
      !Array.isArray(parsed.usage)
        ? (parsed.usage as Record<string, unknown>)
        : {};
    const input = Number(usage.input_tokens ?? 0);
    const output = Number(usage.output_tokens ?? 0);
    const cost = Number(parsed.cost_usd ?? 0);
    console.log(
      pc.blue(
        `tokens: in=${Number.isFinite(input) ? input : 0} out=${Number.isFinite(output) ? output : 0} cost=$${Number.isFinite(cost) ? cost.toFixed(6) : "0.000000"}`,
      ),
    );
    return;
  }

  if (type === "error") {
    const message =
      typeof parsed.message === "string"
        ? parsed.message
        : "Unknown error";
    const code =
      typeof parsed.code === "string" ? parsed.code : "UNKNOWN";
    console.log(pc.red(`error [${code}]: ${message}`));
    return;
  }

  // Unknown event type
  if (debug) {
    console.log(pc.gray(line));
  }
}
```

**Step 4: Update the CLI barrel export**

Replace contents of `adapter/src/cli/index.ts`:
```typescript
export { printAmplifierStreamEvent } from "./format-event.js";
```

**Step 5: Run tests to verify they pass**

Run:
```bash
cd /home/bkrabach/dev/paperclip-adapter/amplifier-paperclip-adapter/adapter
npx vitest run tests/format-event.test.ts
```
Expected: All 9 tests PASS.

**Step 6: Commit**

Run:
```bash
cd /home/bkrabach/dev/paperclip-adapter/amplifier-paperclip-adapter
git add adapter/src/cli/format-event.ts adapter/src/cli/index.ts adapter/tests/format-event.test.ts
git commit -m "feat: CLI terminal formatter for JSONL events"
```

---

### Task 18: Full Smoke Test

This test verifies the entire pipeline: TypeScript adapter `execute()` -> bridge subprocess -> Amplifier session -> JSONL -> `AdapterExecutionResult`. It requires the real bridge installed and an API key set.

**Files:**
- Create: `adapter/tests/smoke.test.ts`

**Step 1: Write the smoke test**

Create `adapter/tests/smoke.test.ts`:
```typescript
/**
 * Full-stack smoke test: adapter -> bridge -> Amplifier -> JSONL -> result.
 *
 * This test requires:
 * - amplifier-paperclip-bridge installed and in PATH
 * - At least one API key set (ANTHROPIC_API_KEY or OPENAI_API_KEY)
 * - amplifier-core and amplifier-foundation installed
 *
 * Skip in CI unless the full stack is available.
 */
import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import { execute } from "../src/server/execute.js";
import type { AdapterExecutionContext } from "@paperclipai/adapter-utils";

// Check prerequisites
let bridgeAvailable = false;
try {
  execSync("amplifier-paperclip-bridge --version", {
    stdio: "pipe",
    timeout: 10_000,
  });
  bridgeAvailable = true;
} catch {
  bridgeAvailable = false;
}

const hasApiKey =
  (process.env.ANTHROPIC_API_KEY?.trim().length ?? 0) > 0 ||
  (process.env.OPENAI_API_KEY?.trim().length ?? 0) > 0;

const shouldRun = bridgeAvailable && hasApiKey;

describe.skipIf(!shouldRun)("smoke test (full stack)", () => {
  it(
    "executes a simple prompt through the full pipeline",
    async () => {
      const ctx: AdapterExecutionContext = {
        runId: `smoke-${Date.now()}`,
        agent: {
          id: "smoke-agent",
          companyId: "smoke-company",
          name: "Smoke Test Agent",
          adapterType: "amplifier_local",
          adapterConfig: {},
        },
        runtime: {
          sessionId: null,
          sessionParams: null,
          sessionDisplayId: null,
          taskKey: null,
        },
        config: {
          bundle: "amplifier-dev",
          timeout: 60,
          cwd: process.cwd(),
          promptTemplate: "Respond with exactly: SMOKE_TEST_OK",
        },
        context: {},
        onLog: async () => {},
        onMeta: async () => {},
        onSpawn: async () => {},
      };

      const result = await execute(ctx);

      expect(result.exitCode).toBe(0);
      expect(result.timedOut).toBe(false);
      expect(result.errorMessage).toBeFalsy();
      expect(result.summary).toBeTruthy();
      expect(result.sessionId).toBeTruthy();
      // We don't assert on exact content because LLMs are non-deterministic,
      // but the summary should contain something
      expect(typeof result.summary).toBe("string");
    },
    { timeout: 120_000 },
  );
});
```

**Step 2: Run the smoke test**

Run:
```bash
cd /home/bkrabach/dev/paperclip-adapter/amplifier-paperclip-adapter/adapter
npx vitest run tests/smoke.test.ts
```
Expected: Either PASS (if bridge + API key available) or SKIPPED (if prerequisites aren't met). This test is for manual pre-release verification, not CI.

**Step 3: Commit**

Run:
```bash
cd /home/bkrabach/dev/paperclip-adapter/amplifier-paperclip-adapter
git add adapter/tests/smoke.test.ts
git commit -m "test: full-stack smoke test for adapter -> bridge -> Amplifier pipeline"
```

---

### Final Step: Run Full Test Suite, Typecheck & Push

**Step 1: Run all adapter tests**

Run:
```bash
cd /home/bkrabach/dev/paperclip-adapter/amplifier-paperclip-adapter/adapter
npx vitest run
```
Expected: All unit tests PASS (smoke test may skip).

**Step 2: Run typecheck**

Run:
```bash
cd /home/bkrabach/dev/paperclip-adapter/amplifier-paperclip-adapter/adapter
npx tsc --noEmit
```
Expected: No type errors.

**Step 3: Build the package**

Run:
```bash
cd /home/bkrabach/dev/paperclip-adapter/amplifier-paperclip-adapter/adapter
npx tsc
```
Expected: `dist/` directory created with compiled JavaScript and type declarations.

**Step 4: Update the installer script**

The install.sh from Phase 1 noted "The TypeScript adapter (Phase 2) will be installed separately." Now update it to include the adapter installation step. Edit `install.sh` and add after the bridge installation section:

```bash
# --- Install TypeScript adapter ---

echo "Installing TypeScript adapter (@amplifier/paperclip-adapter)..."
# For local development, link to the adapter directory
# For production, this would be: npm install -g "@amplifier/paperclip-adapter@git+${REPO}#subdirectory=adapter"
echo "  Note: TypeScript adapter registration in Paperclip is done via the adapter-plugins.json file."
echo "  See README.md for setup instructions."
echo ""
```

**Step 5: Push to GitHub**

Run:
```bash
cd /home/bkrabach/dev/paperclip-adapter/amplifier-paperclip-adapter
git push origin main
```
Expected: All commits pushed to `bkrabach/amplifier-paperclip-adapter`.

---

## Summary of Deliverables

| File | Purpose |
|------|---------|
| `adapter/package.json` | Package config with peer dep on adapter-utils, vitest |
| `adapter/tsconfig.json` | TypeScript config for external adapter (ES2022, Node16) |
| `adapter/src/index.ts` | Root metadata: type, label, models, configDoc, createServerAdapter re-export |
| `adapter/src/server/index.ts` | createServerAdapter() factory returning ServerAdapterModule |
| `adapter/src/server/parse.ts` | `parseAmplifierStream()` — JSONL stdout parser |
| `adapter/src/server/execute.ts` | `execute()` — spawns bridge, renders prompt, parses result |
| `adapter/src/server/test.ts` | `testEnvironment()` — diagnostics for bridge/keys/cwd |
| `adapter/src/ui/index.ts` | UI barrel export |
| `adapter/src/ui/parse-stdout.ts` | `parseAmplifierStdoutLine()` — JSONL to TranscriptEntry[] |
| `adapter/src/cli/index.ts` | CLI barrel export |
| `adapter/src/cli/format-event.ts` | `printAmplifierStreamEvent()` — terminal formatter |
| `adapter/tests/parse.test.ts` | 7 tests for JSONL parser |
| `adapter/tests/execute.test.ts` | 4 tests for execute function |
| `adapter/tests/test-env.test.ts` | 4 tests for environment diagnostics |
| `adapter/tests/parse-stdout.test.ts` | 8 tests for UI parser |
| `adapter/tests/format-event.test.ts` | 9 tests for CLI formatter |
| `adapter/tests/smoke.test.ts` | 1 full-stack smoke test (requires real bridge + API key) |