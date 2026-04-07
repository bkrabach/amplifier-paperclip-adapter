// TranscriptEntry conversion - converts bridge stdout lines to UI-ready transcript entries
import type { TranscriptEntry } from '@paperclipai/adapter-utils';

function safeJsonParse(text: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(text);
    if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

function asNumberOrZero(value: unknown): number {
  return typeof value === 'number' ? value : 0;
}

export function parseAmplifierStdoutLine(line: string, ts: string): TranscriptEntry[] {
  const parsed = safeJsonParse(line);

  if (parsed === null) {
    return [{ kind: 'stdout', ts, text: line }];
  }

  const event = parsed['event'];

  if (event === 'init') {
    return [{
      kind: 'init',
      ts,
      model: typeof parsed['model'] === 'string' ? parsed['model'] : '',
      sessionId: typeof parsed['sessionId'] === 'string' ? parsed['sessionId'] : '',
    }];
  }

  if (event === 'content_delta') {
    const text = typeof parsed['text'] === 'string' ? parsed['text'] : '';
    if (text === '') {
      return [{ kind: 'stdout', ts, text: line }];
    }
    return [{ kind: 'assistant', ts, text, delta: true }];
  }

  if (event === 'tool_start') {
    return [{
      kind: 'tool_call',
      ts,
      name: typeof parsed['tool'] === 'string' ? parsed['tool'] : '',
      input: parsed['input'] ?? '',
    }];
  }

  if (event === 'tool_end') {
    return [{
      kind: 'tool_result',
      ts,
      toolUseId: '',
      toolName: typeof parsed['tool'] === 'string' ? parsed['tool'] : '',
      content: typeof parsed['output'] === 'string' ? parsed['output'] : '',
      isError: false,
    }];
  }

  if (event === 'result') {
    const usage = parsed['usage'];
    const usageObj = usage !== null && typeof usage === 'object' && !Array.isArray(usage)
      ? usage as Record<string, unknown>
      : null;
    return [{
      kind: 'result',
      ts,
      text: typeof parsed['summary'] === 'string' ? parsed['summary'] : '',
      inputTokens: usageObj ? asNumberOrZero(usageObj['inputTokens']) : 0,
      outputTokens: usageObj ? asNumberOrZero(usageObj['outputTokens']) : 0,
      cachedTokens: usageObj ? asNumberOrZero(usageObj['cachedTokens']) : 0,
      costUsd: asNumberOrZero(parsed['costUsd']),
      subtype: '',
      isError: false,
      errors: [],
    }];
  }

  if (event === 'error') {
    const message = typeof parsed['message'] === 'string' ? parsed['message'] : '';
    return [{
      kind: 'result',
      ts,
      text: '',
      inputTokens: 0,
      outputTokens: 0,
      cachedTokens: 0,
      costUsd: 0,
      subtype: 'error',
      isError: true,
      errors: message ? [message] : [],
    }];
  }

  // Unknown event type - fall back to stdout
  return [{ kind: 'stdout', ts, text: line }];
}
