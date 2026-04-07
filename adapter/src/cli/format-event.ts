// Terminal formatter - formats bridge events for terminal/CLI output
import pc from 'picocolors';

/**
 * Formats and prints a raw JSONL event line to the terminal.
 *
 * @param raw - A raw line of output from the Amplifier bridge (JSONL or plain text)
 * @param debug - When true, unknown event types are printed in gray; when false, they are suppressed
 */
export function printAmplifierStreamEvent(raw: string, debug: boolean): void {
  const trimmed = raw.trim();
  if (trimmed === '') return;

  let parsed: Record<string, unknown>;
  try {
    const result: unknown = JSON.parse(trimmed);
    if (result === null || typeof result !== 'object' || Array.isArray(result)) {
      console.log(raw);
      return;
    }
    parsed = result as Record<string, unknown>;
  } catch {
    console.log(raw);
    return;
  }

  const event = parsed['event'];

  if (event === 'init') {
    const model = typeof parsed['model'] === 'string' ? parsed['model'] : '';
    const sessionId = typeof parsed['sessionId'] === 'string' ? parsed['sessionId'] : '';
    const bundle = typeof parsed['bundle'] === 'string' ? parsed['bundle'] : '';
    const parts = [`model: ${model}`, `session: ${sessionId}`];
    if (bundle) parts.push(`bundle: ${bundle}`);
    console.log(pc.blue(parts.join(' ')));
    return;
  }

  if (event === 'content_delta') {
    const text = typeof parsed['text'] === 'string' ? parsed['text'] : '';
    if (text) {
      console.log(pc.green(`assistant: ${text}`));
    }
    return;
  }

  if (event === 'tool_start') {
    const tool = typeof parsed['tool'] === 'string' ? parsed['tool'] : '';
    const input = typeof parsed['input'] === 'string'
      ? parsed['input']
      : parsed['input'] != null ? JSON.stringify(parsed['input']) : '';
    console.log(pc.yellow(`tool_call: ${tool}`));
    if (input) {
      console.log(pc.gray(input));
    }
    return;
  }

  if (event === 'tool_end') {
    const tool = typeof parsed['tool'] === 'string' ? parsed['tool'] : '';
    const output = typeof parsed['output'] === 'string'
      ? parsed['output']
      : parsed['output'] != null ? JSON.stringify(parsed['output']) : '';
    console.log(pc.cyan(`tool_result: ${tool}`));
    if (output) {
      console.log(pc.gray(output));
    }
    return;
  }

  if (event === 'result') {
    const summary = typeof parsed['summary'] === 'string' ? parsed['summary'] : '';
    const usage = parsed['usage'] != null && typeof parsed['usage'] === 'object' && !Array.isArray(parsed['usage'])
      ? parsed['usage'] as Record<string, unknown>
      : {};
    const costUsd = typeof parsed['costUsd'] === 'number' ? parsed['costUsd'] : 0;
    const inputTokens = typeof usage['inputTokens'] === 'number' ? usage['inputTokens'] : 0;
    const outputTokens = typeof usage['outputTokens'] === 'number' ? usage['outputTokens'] : 0;
    const cachedTokens = typeof usage['cachedTokens'] === 'number' ? usage['cachedTokens'] : 0;

    console.log(pc.green('result:'));
    if (summary) console.log(summary);
    console.log(pc.blue(
      `tokens: in=${inputTokens} out=${outputTokens} cached=${cachedTokens} cost=$${costUsd.toFixed(4)}`,
    ));
    return;
  }

  if (event === 'error') {
    const code = typeof parsed['code'] === 'string' ? parsed['code'] : '';
    const message = typeof parsed['message'] === 'string' ? parsed['message'] : '';
    const errorStr = code ? `error [${code}]: ${message}` : `error: ${message}`;
    console.log(pc.red(errorStr));
    return;
  }

  // Unknown event type - only print in debug mode
  if (debug) {
    console.log(pc.gray(JSON.stringify(parsed)));
  }
}
