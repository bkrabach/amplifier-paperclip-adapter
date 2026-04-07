// Server barrel - exports for @amplifier/paperclip-adapter/server subpath

import type { ServerAdapterModule } from '@paperclipai/adapter-utils';
import { type, models, agentConfigurationDoc } from '../index.js';

// Re-exported for consumers of the /server subpath.
// Also imported individually below for use in the createServerAdapter factory
// (TypeScript/ESM does not allow re-export bindings to appear in value expressions).
export { execute } from './execute.js';
export { testEnvironment } from './test.js';
export { parseAmplifierStream } from './parse.js';

import { execute } from './execute.js'; // re-exported above; imported again here for factory use
import { testEnvironment } from './test.js'; // re-exported above; imported again here for factory use

/**
 * Factory that assembles and returns the Amplifier (local) ServerAdapterModule.
 */
export function createServerAdapter(): ServerAdapterModule {
  return {
    type,
    execute,
    testEnvironment,
    models,
    agentConfigurationDoc,
  };
}
