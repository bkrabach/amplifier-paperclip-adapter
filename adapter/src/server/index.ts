// Server barrel - exports for @amplifier/paperclip-adapter/server subpath

import type { ServerAdapterModule } from '@paperclipai/adapter-utils';
import { type, models, agentConfigurationDoc } from '../index.js';

// The following re-exports will produce TypeScript errors until the downstream modules are
// implemented in subsequent tasks. This is expected — treat these errors as placeholders.
// These symbols are also imported individually below for use in the createServerAdapter factory
// (TypeScript/ESM does not allow re-export bindings to appear in value expressions).
export { execute } from './execute.js';
export { testEnvironment } from './test.js';
export { parseAmplifierStream } from './parse.js';

// Imported here so they can be included in the ServerAdapterModule returned by createServerAdapter.
// TypeScript errors on these imports are expected until execute.ts / test.ts are implemented.
import { execute } from './execute.js'; // re-exported above; imported again here for factory use
import { testEnvironment } from './test.js'; // re-exported above; imported again here for factory use

/**
 * Factory that assembles and returns the Amplifier (local) ServerAdapterModule.
 *
 * `execute` and `testEnvironment` are stubs at this stage and will be wired up when
 * their respective source files (execute.ts, test.ts) are implemented.
 */
export function createServerAdapter(): ServerAdapterModule {
  return {
    type,
    // Type assertions needed because downstream stubs are not yet implemented.
    // These will resolve to proper function implementations in subsequent tasks.
    execute: execute as unknown as ServerAdapterModule['execute'],
    testEnvironment: testEnvironment as unknown as ServerAdapterModule['testEnvironment'],
    models,
    agentConfigurationDoc,
  };
}
