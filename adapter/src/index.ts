// Root metadata for @amplifier/paperclip-adapter
// Re-exports adapter identification and version info

import type { AdapterModel } from '@paperclipai/adapter-utils';

/** Adapter type identifier used by the Paperclip platform to route executions. */
export const type = 'amplifier_local';

/** Human-readable display name shown in the Paperclip UI. */
export const label = 'Amplifier (local)';

/**
 * Available models for this adapter.
 * "bundle-default" delegates model selection to the Amplifier bundle configuration.
 */
export const models: AdapterModel[] = [
  { id: 'bundle-default', label: 'Bundle Default' },
];

/**
 * Markdown documentation shown to users when configuring an agent with this adapter.
 *
 * Covers core configuration fields, session lifecycle behaviour, bundle URI formats,
 * and API key / auth-token passthrough.
 */
export const agentConfigurationDoc = `
## Amplifier (local) — Agent Configuration

Configure a locally-running Amplifier bundle as a Paperclip agent.

### Core fields

| Field | Type | Description |
|-------|------|-------------|
| \`cwd\` | string | Working directory passed to the Amplifier process. Defaults to the process working directory of the bridge. |
| \`bundle\` | string | Bundle URI to load. Accepts file paths, npm package names, or \`@namespace:path\` references (see Bundle URI formats below). |
| \`timeout\` | number | Maximum time in seconds to wait for a single execution to complete. Defaults to 300 (5 minutes). |
| \`promptTemplate\` | string | Handlebars-style template used to construct the prompt sent to Amplifier. Receives \`{{task}}\`, \`{{context}}\`, and other run-time variables. |
| \`command\` | string | Override the Amplifier CLI command. Defaults to \`amplifier-paperclip-bridge\`. Use an absolute path or a wrapper script if needed. |
| \`env\` | object | Additional environment variables merged into the bridge process environment. Keys and values must be strings. |

### Session lifecycle

Amplifier sessions persist across agent turns within a single Paperclip run. The bridge
maintains a session ID returned in the execution result (\`sessionId\`). Subsequent turns
within the same run reuse that session, allowing the underlying LLM context to accumulate.

Session clearing is controlled by the Paperclip platform; refer to your Paperclip
configuration for session-expiry settings. The \`sessionId\` returned in the execution result
can be used by the platform to manage session continuity.

### Bundle URI formats

- **File path**: \`/absolute/path/to/bundle\` or \`./relative/path\`
- **npm package**: \`my-bundle-package\` (resolved via Node.js module resolution in \`cwd\`)
- **Namespace reference**: \`@namespace:bundle-name\` (resolved against configured Amplifier skill paths)
- **Inline default**: omit \`bundle\` to use whatever bundle is configured as the Amplifier default

### API key passthrough

The Paperclip \`authToken\` is forwarded to the bridge as the \`PAPERCLIP_AUTH_TOKEN\`
environment variable. Amplifier bundles that call back to Paperclip APIs should read this
variable rather than requiring a separate credential.

Provider API keys (e.g. \`ANTHROPIC_API_KEY\`) are **not** injected automatically. Set them
in the \`env\` field or ensure they are present in the bridge process environment.
`;

export { createServerAdapter } from './server/index.js';
