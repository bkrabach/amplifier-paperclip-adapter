// JSONL parser - parses newline-delimited JSON from bridge stdout

export interface AmplifierToolEvent {
  kind: 'start' | 'end';
  tool: string;
  input?: string;
  output?: string;
}

export interface AmplifierStreamResult {
  sessionId: string | null;
  model: string;
  bundle: string;
  summary: string;
  assistantText: string;
  usage: { inputTokens: number; outputTokens: number } | null;
  costUsd: number | null;
  error: { message: string; code: string } | null;
  toolEvents: AmplifierToolEvent[];
}

function safeJsonParse(line: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(line);
    if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' ? value : null;
}

export function parseAmplifierStream(stdout: string): AmplifierStreamResult {
  const result: AmplifierStreamResult = {
    sessionId: null,
    model: '',
    bundle: '',
    summary: '',
    assistantText: '',
    usage: null,
    costUsd: null,
    error: null,
    toolEvents: [],
  };

  if (!stdout.trim()) {
    return result;
  }

  const lines = stdout.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const event = safeJsonParse(trimmed);
    if (!event) continue;

    const kind = asString(event['event'], '');

    switch (kind) {
      case 'init':
        result.sessionId = asString(event['sessionId'], '') || null;
        result.model = asString(event['model'], '');
        result.bundle = asString(event['bundle'], '');
        break;

      case 'content_delta':
        result.assistantText += asString(event['text'], '');
        break;

      case 'tool_start': {
        const toolEvent: AmplifierToolEvent = {
          kind: 'start',
          tool: asString(event['tool'], ''),
          input: asString(event['input'], ''),
        };
        result.toolEvents.push(toolEvent);
        break;
      }

      case 'tool_end': {
        const toolEvent: AmplifierToolEvent = {
          kind: 'end',
          tool: asString(event['tool'], ''),
          output: asString(event['output'], ''),
        };
        result.toolEvents.push(toolEvent);
        break;
      }

      case 'result': {
        result.summary = asString(event['summary'], '');
        result.costUsd = asNumber(event['costUsd']);

        const usageRaw = event['usage'];
        if (usageRaw !== null && typeof usageRaw === 'object' && !Array.isArray(usageRaw)) {
          const usageObj = usageRaw as Record<string, unknown>;
          result.usage = {
            inputTokens: asNumber(usageObj['inputTokens']) ?? 0,
            outputTokens: asNumber(usageObj['outputTokens']) ?? 0,
          };
        }
        break;
      }

      case 'error':
        result.error = {
          message: asString(event['message'], ''),
          code: asString(event['code'], ''),
        };
        break;
    }
  }

  return result;
}
