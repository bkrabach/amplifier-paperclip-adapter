import { describe, it, expect } from 'vitest';
import type { AdapterEnvironmentTestContext } from '@paperclipai/adapter-utils';
import { testEnvironment } from '../src/server/test.js';

function buildContext(overrides: Partial<Record<string, unknown>> = {}): AdapterEnvironmentTestContext {
  return {
    companyId: 'test-company',
    adapterType: 'amplifier_local',
    config: {
      command: process.execPath,
      cwd: process.cwd(),
      env: { ANTHROPIC_API_KEY: 'test-key-for-pass' },
      ...overrides,
    },
  };
}

describe('testEnvironment', () => {
  it('returns pass when bridge is available', async () => {
    const ctx = buildContext({ command: process.execPath });
    const result = await testEnvironment(ctx);

    expect(result.adapterType).toBe('amplifier_local');
    expect(result.status).toBe('pass');
    expect(result.checks.length).toBeGreaterThan(0);
    expect(result.testedAt).toBeTruthy();
  });

  it('returns fail when command not found', async () => {
    const ctx = buildContext({ command: 'nonexistent-command-xyz-999' });
    const result = await testEnvironment(ctx);

    expect(result.status).toBe('fail');
    const errorCheck = result.checks.find(c => c.code === 'amplifier_command_unresolvable');
    expect(errorCheck).toBeDefined();
  });

  it('returns error for invalid cwd', async () => {
    const ctx = buildContext({ cwd: '/nonexistent/path/that/does/not/exist' });
    const result = await testEnvironment(ctx);

    const cwdCheck = result.checks.find(c => c.code === 'amplifier_cwd_invalid');
    expect(cwdCheck).toBeDefined();
    expect(cwdCheck?.level).toBe('error');
  });

  it('uses amplifier-paperclip-bridge as the default command in diagnostics', async () => {
    // When no command is configured, the default must match execute.ts DEFAULT_COMMAND
    const ctx: AdapterEnvironmentTestContext = {
      companyId: 'test-company',
      adapterType: 'amplifier_local',
      config: {
        // Intentionally omit 'command' so the default kicks in
        cwd: process.cwd(),
        env: { ANTHROPIC_API_KEY: 'test-key' },
      },
    };
    const result = await testEnvironment(ctx);
    // The default command ('amplifier-paperclip-bridge') is not installed, so we expect an error check
    const commandCheck = result.checks.find(
      c => c.code === 'amplifier_command_unresolvable' || c.code === 'amplifier_command_resolvable',
    );
    expect(commandCheck).toBeDefined();
    // The check message must reference 'amplifier-paperclip-bridge', not bare 'amplifier'
    expect(commandCheck!.message).toContain('amplifier-paperclip-bridge');
  });

  it('warns when no API keys set', async () => {
    const savedAnthropicKey = process.env['ANTHROPIC_API_KEY'];
    const savedOpenaiKey = process.env['OPENAI_API_KEY'];

    try {
      delete process.env['ANTHROPIC_API_KEY'];
      delete process.env['OPENAI_API_KEY'];

      // Use a context with no env keys so neither config nor process.env has keys
      const ctx = buildContext({ env: {} });
      const result = await testEnvironment(ctx);

      const warnCheck = result.checks.find(c => c.code === 'amplifier_no_api_keys');
      expect(warnCheck).toBeDefined();
      expect(warnCheck?.level).toBe('warn');
    } finally {
      if (savedAnthropicKey !== undefined) {
        process.env['ANTHROPIC_API_KEY'] = savedAnthropicKey;
      }
      if (savedOpenaiKey !== undefined) {
        process.env['OPENAI_API_KEY'] = savedOpenaiKey;
      }
    }
  });
});
