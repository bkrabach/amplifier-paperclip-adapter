import { describe, it, expect } from 'vitest';

// Note: These tests are for task-12, verifying createServerAdapter factory.
// execute.ts, test.ts, parse.ts are stubs (future tasks); only static shape is tested here.

describe('createServerAdapter (src/server/index.ts)', () => {
  it('exports createServerAdapter as a function', async () => {
    const mod = await import('../../src/server/index.js');
    expect(typeof mod.createServerAdapter).toBe('function');
  });

  it('createServerAdapter() returns an object', async () => {
    const mod = await import('../../src/server/index.js');
    const adapter = mod.createServerAdapter();
    expect(typeof adapter).toBe('object');
    expect(adapter).not.toBeNull();
  });

  it('returned ServerAdapterModule has type amplifier_local', async () => {
    const mod = await import('../../src/server/index.js');
    const adapter = mod.createServerAdapter();
    expect(adapter.type).toBe('amplifier_local');
  });

  it('returned ServerAdapterModule has models array with one entry', async () => {
    const mod = await import('../../src/server/index.js');
    const adapter = mod.createServerAdapter();
    expect(Array.isArray(adapter.models)).toBe(true);
    expect(adapter.models).toHaveLength(1);
    expect(adapter.models![0]).toEqual({ id: 'bundle-default', label: 'Bundle Default' });
  });

  it('returned ServerAdapterModule has agentConfigurationDoc string', async () => {
    const mod = await import('../../src/server/index.js');
    const adapter = mod.createServerAdapter();
    expect(typeof adapter.agentConfigurationDoc).toBe('string');
    expect(adapter.agentConfigurationDoc!.trim().length).toBeGreaterThan(0);
  });

  it('returned ServerAdapterModule has execute property', async () => {
    const mod = await import('../../src/server/index.js');
    const adapter = mod.createServerAdapter();
    // execute is a stub at this stage; it must be a property on the returned module
    expect('execute' in adapter).toBe(true);
  });

  it('returned ServerAdapterModule has testEnvironment property', async () => {
    const mod = await import('../../src/server/index.js');
    const adapter = mod.createServerAdapter();
    // testEnvironment is a stub at this stage; it must be a property on the returned module
    expect('testEnvironment' in adapter).toBe(true);
  });
});
