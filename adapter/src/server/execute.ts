// Spawn bridge - handles spawning the Paperclip bridge process
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type {
  AdapterExecutionContext,
  AdapterExecutionResult,
} from '@paperclipai/adapter-utils';
import {
  asString,
  asNumber,
  asStringArray,
  parseObject,
  buildPaperclipEnv,
  joinPromptSections,
  renderTemplate,
  renderPaperclipWakePrompt,
  stringifyPaperclipWakePayload,
  ensureAbsoluteDirectory,
  ensureCommandResolvable,
  ensurePathInEnv,
  buildInvocationEnvForLogs,
  resolveCommandForLogs,
  runChildProcess,
  readPaperclipRuntimeSkillEntries,
} from '@paperclipai/adapter-utils/server-utils';
import { parseAmplifierStream } from './parse.js';

const MODULE_DIR = path.dirname(new URL(import.meta.url).pathname);

const DEFAULT_COMMAND = 'amplifier-paperclip-bridge';
const DEFAULT_BUNDLE = 'amplifier-dev';
const DEFAULT_TIMEOUT_SEC = 0; // 0 = no timeout, matching claude-local behaviour
const DEFAULT_GRACE_SEC = 20;
const DEFAULT_PROMPT_TEMPLATE = 'You are agent {{agent.id}} ({{agent.name}}). Continue your Paperclip work.';
const DEFAULT_FALLBACK_PROMPT = 'You are an Amplifier agent. Continue your Paperclip work.';

/**
 * Create a temporary directory containing Paperclip skills symlinked into
 * `.amplifier/skills/` so the bridge process can find them via AMPLIFIER_HOME.
 */
async function buildSkillsDir(
  config: Record<string, unknown>,
  moduleDir: string,
): Promise<string> {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'paperclip-skills-'));
  const skillsDir = path.join(tmp, '.amplifier', 'skills');
  await fs.mkdir(skillsDir, { recursive: true });

  try {
    const entries = await readPaperclipRuntimeSkillEntries(config, moduleDir);
    for (const entry of entries) {
      const linkPath = path.join(skillsDir, entry.runtimeName);
      await fs.symlink(entry.source, linkPath).catch(() => {
        // Non-fatal: skip skills that can't be linked (missing source, etc.)
      });
    }
  } catch {
    // Non-fatal: skills dir may be empty if no skills are configured
  }

  return tmp;
}

/**
 * Execute a Paperclip heartbeat context by wiring it through the
 * Amplifier bridge process and returning a structured AdapterExecutionResult.
 */
export async function execute(ctx: AdapterExecutionContext): Promise<AdapterExecutionResult> {
  // authToken is destructured separately below because it is optional — accessing
  // it as `undefined` is intentional and avoids spreading it into the env unconditionally.
  const { runId, agent, runtime, config, context, authToken, onLog, onMeta, onSpawn } = ctx;

  // --- Read config values ---
  const command = asString(config['command'], DEFAULT_COMMAND);
  const bundle = asString(config['bundle'], DEFAULT_BUNDLE);
  const timeoutSec = asNumber(config['timeout'], DEFAULT_TIMEOUT_SEC);
  const graceSec = asNumber(config['graceSec'], DEFAULT_GRACE_SEC);
  const extraArgs = asStringArray(config['extraArgs']);
  const rawCwd = asString(config['cwd'], process.cwd());
  const cwd = path.isAbsolute(rawCwd) ? rawCwd : path.resolve(process.cwd(), rawCwd);

  // --- Build environment ---
  const paperclipEnv = buildPaperclipEnv(agent);

  const wakePayloadJson = stringifyPaperclipWakePayload(context);

  // Merge user-supplied env vars from config (must be string values)
  const userEnv: Record<string, string> = {};
  for (const [k, v] of Object.entries(parseObject(config['env']))) {
    if (typeof v === 'string') userEnv[k] = v;
  }
  // Forward Paperclip auth token if provided
  if (typeof authToken === 'string' && authToken.length > 0) {
    userEnv['PAPERCLIP_AUTH_TOKEN'] = authToken;
  }

  const env: Record<string, string> = {
    ...paperclipEnv,
    PAPERCLIP_RUN_ID: runId,
    ...(wakePayloadJson != null ? { PAPERCLIP_WAKE_PAYLOAD_JSON: wakePayloadJson } : {}),
    ...userEnv,
  };

  let skillsTempDir: string | null = null;

  try {
    // --- Build skills directory ---
    skillsTempDir = await buildSkillsDir(config, MODULE_DIR);
    // Expose the temp home so the bridge's Amplifier process finds skills
    env['AMPLIFIER_HOME'] = skillsTempDir;

    // --- Validate working directory and command ---
    await ensureAbsoluteDirectory(cwd);
    // The spread produces Record<string,string|undefined>, which is the same
    // shape as NodeJS.ProcessEnv — the cast is safe and required by the type signature.
    const mergedEnv = ensurePathInEnv({ ...process.env, ...env } as NodeJS.ProcessEnv);
    await ensureCommandResolvable(command, cwd, mergedEnv);

    // --- Render prompt ---
    const promptTemplate = asString(config['promptTemplate'], DEFAULT_PROMPT_TEMPLATE);
    const wakeSection = renderPaperclipWakePrompt(context);
    const templateData: Record<string, unknown> = {
      ...context,
      sessionId: runtime.sessionId ?? '',
      agentId: agent.id,
      companyId: agent.companyId,
      runId,
      company: { id: agent.companyId },
      agent,
      run: { id: runId, source: 'on_demand' },
      context,
    };
    const renderedPrompt = renderTemplate(promptTemplate, templateData);
    // Wake section first (highest-priority context), rendered template last — mirrors claude-local ordering.
    const joinedPrompt = joinPromptSections([wakeSection, renderedPrompt]);
    // Safety net: if every section rendered empty, fall back to a known-non-empty string so
    // the bridge never receives an empty --prompt flag and errors with "No prompt provided".
    const prompt = joinedPrompt.length > 0 ? joinedPrompt : DEFAULT_FALLBACK_PROMPT;

    // --- Build command args ---
    // extraArgs come first so that flag-based overrides (e.g. -e <script> in
    // tests, or --debug in production) are processed before bridge-specific flags.
    const args = [
      ...extraArgs,
      '--bundle', bundle,
      '--cwd', cwd,
      '--timeout', String(timeoutSec),
      '--prompt', prompt,
    ];

    // --- Emit invocation metadata ---
    if (onMeta) {
      const resolvedCmd = await resolveCommandForLogs(command, cwd, mergedEnv);
      await onMeta({
        adapterType: 'amplifier_local',
        command,
        cwd,
        commandArgs: args,
        env: buildInvocationEnvForLogs(env, {
          runtimeEnv: process.env,
          resolvedCommand: resolvedCmd,
        }),
        prompt,
        context,
      });
    }

    // --- Spawn bridge ---
    const result = await runChildProcess(runId, command, args, {
      cwd,
      env,
      timeoutSec,
      graceSec,
      onLog,
      onSpawn,
      stdin: prompt,
    });

    // --- Parse JSONL stream from bridge stdout ---
    const parsed = parseAmplifierStream(result.stdout);

    // Handle timeout
    if (result.timedOut) {
      return {
        exitCode: result.exitCode,
        signal: result.signal,
        timedOut: true,
        errorMessage: `Bridge timed out after ${timeoutSec}s.`,
      };
    }

    // Handle structured error emitted by the bridge via JSONL
    if (parsed.error) {
      return {
        exitCode: result.exitCode ?? 1,
        signal: result.signal,
        timedOut: false,
        errorMessage: parsed.error.message,
        errorCode: parsed.error.code || undefined,
        sessionId: parsed.sessionId,
        model: parsed.model || undefined,
      };
    }

    // Handle non-zero exit with no usable output (crash or config error)
    if ((result.exitCode ?? 0) !== 0 && !parsed.summary) {
      const msg =
        result.stderr.trim() ||
        `Bridge exited with code ${String(result.exitCode)}.`;
      return {
        exitCode: result.exitCode,
        signal: result.signal,
        timedOut: false,
        errorMessage: msg,
        sessionId: parsed.sessionId,
        model: parsed.model || undefined,
      };
    }

    // Success
    return {
      exitCode: result.exitCode,
      signal: result.signal,
      timedOut: false,
      summary: parsed.summary || undefined,
      sessionId: parsed.sessionId,
      model: parsed.model || undefined,
      costUsd: parsed.costUsd ?? undefined,
      usage: parsed.usage ?? undefined,
    };
  } finally {
    // Always clean up the temporary skills directory
    if (skillsTempDir !== null) {
      await fs.rm(skillsTempDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}
