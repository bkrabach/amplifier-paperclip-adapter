import { describe, it, expect } from 'vitest';

// Note: These tests are for task-12, verifying root metadata exports and createServerAdapter re-export.
// Downstream modules (execute.ts, test.ts, parse.ts) are stubs; only static values are tested here.

describe('adapter root metadata (src/index.ts)', () => {
  it('exports type as amplifier_local', async () => {
    const mod = await import('../src/index.js');
    expect(mod.type).toBe('amplifier_local');
  });

  it('exports human-readable label', async () => {
    const mod = await import('../src/index.js');
    expect(mod.label).toBe('Amplifier (local)');
  });

  it('exports models as an array', async () => {
    const mod = await import('../src/index.js');
    expect(Array.isArray(mod.models)).toBe(true);
  });

  it('exports exactly one model entry', async () => {
    const mod = await import('../src/index.js');
    expect(mod.models).toHaveLength(1);
  });

  it('models[0] has id bundle-default', async () => {
    const mod = await import('../src/index.js');
    expect(mod.models[0].id).toBe('bundle-default');
  });

  it('models[0] has label Bundle Default', async () => {
    const mod = await import('../src/index.js');
    expect(mod.models[0].label).toBe('Bundle Default');
  });

  it('exports agentConfigurationDoc as a non-empty string', async () => {
    const mod = await import('../src/index.js');
    expect(typeof mod.agentConfigurationDoc).toBe('string');
    expect(mod.agentConfigurationDoc.trim().length).toBeGreaterThan(0);
  });

  it('agentConfigurationDoc documents cwd field', async () => {
    const mod = await import('../src/index.js');
    expect(mod.agentConfigurationDoc).toContain('cwd');
  });

  it('agentConfigurationDoc documents bundle field', async () => {
    const mod = await import('../src/index.js');
    expect(mod.agentConfigurationDoc).toContain('bundle');
  });

  it('agentConfigurationDoc documents timeout field', async () => {
    const mod = await import('../src/index.js');
    expect(mod.agentConfigurationDoc).toContain('timeout');
  });

  it('agentConfigurationDoc documents promptTemplate field', async () => {
    const mod = await import('../src/index.js');
    expect(mod.agentConfigurationDoc).toContain('promptTemplate');
  });

  it('agentConfigurationDoc documents command field', async () => {
    const mod = await import('../src/index.js');
    expect(mod.agentConfigurationDoc).toContain('command');
  });

  it('agentConfigurationDoc documents env field', async () => {
    const mod = await import('../src/index.js');
    expect(mod.agentConfigurationDoc).toContain('env');
  });

  it('agentConfigurationDoc contains session lifecycle notes', async () => {
    const mod = await import('../src/index.js');
    expect(mod.agentConfigurationDoc.toLowerCase()).toContain('session');
  });

  it('agentConfigurationDoc contains API key passthrough notes', async () => {
    const mod = await import('../src/index.js');
    // Should mention API key passthrough
    const doc = mod.agentConfigurationDoc.toLowerCase();
    expect(doc.includes('api key') || doc.includes('apikey') || doc.includes('passthrough') || doc.includes('auth')).toBe(true);
  });

  it('re-exports createServerAdapter as a function', async () => {
    const mod = await import('../src/index.js');
    expect(typeof mod.createServerAdapter).toBe('function');
  });
});
