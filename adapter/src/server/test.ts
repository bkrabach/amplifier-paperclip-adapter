// Environment diagnostics - tests connectivity and environment for the bridge
import type {
  AdapterEnvironmentCheck,
  AdapterEnvironmentTestContext,
  AdapterEnvironmentTestResult,
} from '@paperclipai/adapter-utils';
import {
  asString,
  parseObject,
  ensureAbsoluteDirectory,
  ensureCommandResolvable,
  ensurePathInEnv,
} from '@paperclipai/adapter-utils/server-utils';

/** Derives overall status from a list of checks. */
function summarizeStatus(checks: AdapterEnvironmentCheck[]): AdapterEnvironmentTestResult['status'] {
  if (checks.some(c => c.level === 'error')) return 'fail';
  if (checks.some(c => c.level === 'warn')) return 'warn';
  return 'pass';
}

/** Type guard: returns true when value is a non-empty string. */
function isNonEmpty(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Run environment diagnostics and return a structured result.
 *
 * Performs four checks:
 *  1. CWD validity
 *  2. Bridge command resolvability
 *  3. API key presence (ANTHROPIC_API_KEY / OPENAI_API_KEY)
 *  4. Bundle configuration info
 */
export async function testEnvironment(
  ctx: AdapterEnvironmentTestContext,
): Promise<AdapterEnvironmentTestResult> {
  const checks: AdapterEnvironmentCheck[] = [];
  const config = parseObject(ctx.config);
  const cwd = asString(config['cwd'], process.cwd());
  const command = asString(config['command'], 'amplifier-paperclip-bridge');
  const configEnv = parseObject(config['env']);
  const bundle = asString(config['bundle'], '');

  // --- Check 1: CWD validity ---
  try {
    await ensureAbsoluteDirectory(cwd, { createIfMissing: false });
    checks.push({
      code: 'amplifier_cwd_valid',
      level: 'info',
      message: `Working directory is valid: "${cwd}"`,
    });
  } catch (err) {
    checks.push({
      code: 'amplifier_cwd_invalid',
      level: 'error',
      message: `Working directory is not valid: "${cwd}"`,
      detail: err instanceof Error ? err.message : String(err),
    });
  }

  // --- Check 2: Bridge command resolvability ---
  try {
    const mergedEnv = ensurePathInEnv({ ...process.env } as NodeJS.ProcessEnv);
    await ensureCommandResolvable(command, cwd, mergedEnv);
    checks.push({
      code: 'amplifier_command_resolvable',
      level: 'info',
      message: `Bridge command is resolvable: "${command}"`,
    });
  } catch (err) {
    checks.push({
      code: 'amplifier_command_unresolvable',
      level: 'error',
      message: `Bridge command not found: "${command}"`,
      detail: err instanceof Error ? err.message : String(err),
      hint: 'Install the Amplifier bridge: npm install -g amplifier-paperclip-bridge',
    });
  }

  // --- Check 3: API key detection ---
  const anthropicKey =
    asString(configEnv['ANTHROPIC_API_KEY'], '') ||
    asString(process.env['ANTHROPIC_API_KEY'], '');
  const openaiKey =
    asString(configEnv['OPENAI_API_KEY'], '') ||
    asString(process.env['OPENAI_API_KEY'], '');

  if (isNonEmpty(anthropicKey) || isNonEmpty(openaiKey)) {
    checks.push({
      code: 'amplifier_api_key_detected',
      level: 'info',
      message: 'At least one provider API key detected.',
    });
  } else {
    checks.push({
      code: 'amplifier_no_api_keys',
      level: 'warn',
      message: 'No provider API keys detected (ANTHROPIC_API_KEY, OPENAI_API_KEY).',
      hint: 'Set ANTHROPIC_API_KEY or OPENAI_API_KEY in the adapter env config or the bridge process environment.',
    });
  }

  // --- Check 4: Bundle configuration info ---
  checks.push({
    code: 'amplifier_bundle_configured',
    level: 'info',
    message: isNonEmpty(bundle)
      ? `Bundle configured: "${bundle}"`
      : 'No bundle specified; Amplifier will use the default bundle.',
  });

  return {
    adapterType: ctx.adapterType,
    status: summarizeStatus(checks),
    checks,
    testedAt: new Date().toISOString(),
  };
}
