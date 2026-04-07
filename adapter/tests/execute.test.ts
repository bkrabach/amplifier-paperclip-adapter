import { describe, it, expect } from 'vitest';
import type { AdapterExecutionContext } from '@paperclipai/adapter-utils';
import { execute } from '../src/server/execute.js';

/**
 * Build a fake AdapterExecutionContext that uses process.execPath (node)
 * as the bridge command and an inline Node.js script via -e to simulate
 * bridge JSONL output without a real bridge binary.
 *
 * extraArgs are placed before bridge-specific flags by execute(), so the
 * spawn looks like: `node -e '<script>' -- --bundle ... --cwd ... --timeout ...`
 *
 * The `--` separator tells Node.js to stop processing its own flags, allowing
 * --bundle, --cwd, --timeout to be passed as process.argv to the inline script
 * without Node.js rejecting them as unknown options.
 */
function buildFakeContext(
  script: string,
  configOverrides: Record<string, unknown> = {},
): AdapterExecutionContext {
  return {
    runId: 'test-run-id',
    agent: {
      id: 'test-agent-id',
      companyId: 'test-company-id',
      name: 'Test Agent',
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
      command: process.execPath,
      bundle: 'amplifier-dev',
      // '-e' evaluates the inline script; '--' ends node flag processing so the
      // bridge-specific flags (--bundle, --cwd, --timeout) become process.argv
      extraArgs: ['-e', script, '--'],
      cwd: process.cwd(),
      ...configOverrides,
    },
    context: {
      task: 'Do a thing',
    },
    onLog: async () => {},
    onMeta: async () => {},
    onSpawn: async () => {},
  };
}

describe('execute', () => {
  it('returns successful AdapterExecutionResult', async () => {
    const script = [
      'process.stdout.write(JSON.stringify({event:"init",sessionId:"test-sid",model:"test-model",bundle:"amplifier-dev"}) + "\\n");',
      'process.stdout.write(JSON.stringify({event:"result",summary:"I did the thing.",usage:{inputTokens:100,outputTokens:50},costUsd:0.01}) + "\\n");',
    ].join('');

    const ctx = buildFakeContext(script);
    const result = await execute(ctx);

    expect(result.exitCode).toBe(0);
    expect(result.timedOut).toBe(false);
    expect(result.errorMessage).toBeFalsy();
    expect(result.summary).toBe('I did the thing.');
    expect(result.sessionId).toBe('test-sid');
    expect(result.model).toBe('test-model');
    expect(result.costUsd).toBe(0.01);
    expect(result.usage).toEqual({ inputTokens: 100, outputTokens: 50 });
  });

  it('returns error result when bridge emits error event', async () => {
    const script = [
      'process.stdout.write(JSON.stringify({event:"init",sessionId:"test-sid",model:"test-model",bundle:"amplifier-dev"}) + "\\n");',
      'process.stdout.write(JSON.stringify({event:"error",message:"Bundle not found",code:"BUNDLE_NOT_FOUND"}) + "\\n");',
      'process.exit(1);',
    ].join('');

    const ctx = buildFakeContext(script);
    const result = await execute(ctx);

    expect(result.exitCode).toBe(1);
    expect(result.errorMessage).toContain('Bundle not found');
    expect(result.errorCode).toBe('BUNDLE_NOT_FOUND');
  });

  it('returns error when bridge exits non-zero with no output', async () => {
    const script = 'process.exit(1);';

    const ctx = buildFakeContext(script);
    const result = await execute(ctx);

    expect(result.exitCode).toBe(1);
    expect(result.errorMessage).toBeTruthy();
  });

  it('passes --prompt flag as a CLI argument', async () => {
    let capturedCommandArgs: string[] = [];

    const script = [
      'process.stdout.write(JSON.stringify({event:"init",sessionId:"test-sid",model:"test-model",bundle:"amplifier-dev"}) + "\\n");',
      'process.stdout.write(JSON.stringify({event:"result",summary:"OK",usage:{inputTokens:1,outputTokens:1},costUsd:0}) + "\\n");',
    ].join('');

    const ctx = buildFakeContext(script);
    ctx.onMeta = async (meta: Record<string, unknown>) => {
      capturedCommandArgs = meta['commandArgs'] as string[];
    };

    await execute(ctx);

    expect(capturedCommandArgs).toContain('--prompt');
    const promptIdx = capturedCommandArgs.indexOf('--prompt');
    expect(capturedCommandArgs[promptIdx + 1]).toContain('Do a thing');
  });

  it('uses default bundle when not configured - does not throw, returns valid result', async () => {
    const script = [
      'process.stdout.write(JSON.stringify({event:"init",sessionId:"test-sid",model:"test-model",bundle:"amplifier-dev"}) + "\\n");',
      'process.stdout.write(JSON.stringify({event:"result",summary:"OK",usage:{inputTokens:1,outputTokens:1},costUsd:0}) + "\\n");',
    ].join('');

    // Omit bundle from config — execute() should fall back to the default
    const ctx = buildFakeContext(script, { bundle: undefined });

    const result = await execute(ctx);

    expect(result.exitCode).toBe(0);
    expect(result.timedOut).toBe(false);
  });
});
