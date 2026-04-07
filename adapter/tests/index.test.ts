import { describe, it, expect, beforeAll } from 'vitest';

// Note: These tests are for task-12, verifying root metadata exports and createServerAdapter re-export.
// Downstream modules (execute.ts, test.ts, parse.ts) are stubs; only static values are tested here.

describe('adapter root metadata (src/index.ts)', () => {
  let mod: typeof import('../src/index.js');

  beforeAll(async () => {
    mod = await import('../src/index.js');
  });

  it('exports type as amplifier_local', () => {
    expect(mod.type).toBe('amplifier_local');
  });

  it('exports human-readable label', () => {
    expect(mod.label).toBe('Amplifier (local)');
  });

  it('exports models as an array', () => {
    expect(Array.isArray(mod.models)).toBe(true);
  });

  it('exports exactly one model entry', () => {
    expect(mod.models).toHaveLength(1);
  });

  it('models[0] has id bundle-default', () => {
    expect(mod.models[0].id).toBe('bundle-default');
  });

  it('models[0] has label Bundle Default', () => {
    expect(mod.models[0].label).toBe('Bundle Default');
  });

  it('exports agentConfigurationDoc as a non-empty string', () => {
    expect(typeof mod.agentConfigurationDoc).toBe('string');
    expect(mod.agentConfigurationDoc.trim().length).toBeGreaterThan(0);
  });

  it('agentConfigurationDoc documents cwd field', () => {
    expect(mod.agentConfigurationDoc).toContain('cwd');
  });

  it('agentConfigurationDoc documents bundle field', () => {
    expect(mod.agentConfigurationDoc).toContain('bundle');
  });

  it('agentConfigurationDoc documents timeout field', () => {
    expect(mod.agentConfigurationDoc).toContain('timeout');
  });

  it('agentConfigurationDoc documents promptTemplate field', () => {
    expect(mod.agentConfigurationDoc).toContain('promptTemplate');
  });

  it('agentConfigurationDoc documents command field', () => {
    expect(mod.agentConfigurationDoc).toContain('command');
  });

  it('agentConfigurationDoc documents env field', () => {
    expect(mod.agentConfigurationDoc).toContain('env');
  });

  it('agentConfigurationDoc contains session lifecycle notes', () => {
    expect(mod.agentConfigurationDoc.toLowerCase()).toContain('session');
  });

  it('agentConfigurationDoc contains API key passthrough notes', () => {
    expect(mod.agentConfigurationDoc).toContain('API key passthrough');
  });

  it('re-exports createServerAdapter as a function', () => {
    expect(typeof mod.createServerAdapter).toBe('function');
  });
});
