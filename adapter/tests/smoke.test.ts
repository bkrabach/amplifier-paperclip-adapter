import { execSync } from 'node:child_process';
import { describe, it, expect } from 'vitest';
import type { AdapterExecutionContext } from '@paperclipai/adapter-utils';
import { execute } from '../src/server/execute.js';

// ---------------------------------------------------------------------------
// Prerequisites check (module-level, runs before any test)
// ---------------------------------------------------------------------------

let bridgeAvailable = false;
try {
  execSync('amplifier-paperclip-bridge --version', { stdio: 'ignore' });
  bridgeAvailable = true;
} catch {
  // Bridge binary not installed or not on PATH — skip the suite
}

const hasApiKey = Boolean(
  process.env['ANTHROPIC_API_KEY'] || process.env['OPENAI_API_KEY'],
);

const shouldRun = bridgeAvailable && hasApiKey;

// ---------------------------------------------------------------------------
// Smoke test suite
// Skipped automatically when the bridge or an API key is not available.
// Run manually before releases to verify the full adapter -> bridge ->
// Amplifier -> JSONL -> AdapterExecutionResult pipeline.
// ---------------------------------------------------------------------------

describe.skipIf(!shouldRun)('smoke test - full pipeline', () => {
  it(
    'executes a simple prompt through the full pipeline',
    async () => {
      const timestamp = Date.now();

      const ctx: AdapterExecutionContext = {
        runId: `smoke-${timestamp}`,
        agent: {
          id: 'smoke-agent',
          companyId: 'smoke-company',
          name: 'Smoke Test Agent',
          adapterType: 'amplifier_local',
          adapterConfig: {},
        },
        runtime: {
          sessionId: null,
          sessionParams: null,
          sessionDisplayId: null,
          taskKey: null,
        },
        config: {
          bundle: 'amplifier-dev',
          timeout: 60,
          cwd: process.cwd(),
          promptTemplate: 'Respond with exactly: SMOKE_TEST_OK',
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
      expect(typeof result.summary).toBe('string');
    },
    120_000,
  );
});
