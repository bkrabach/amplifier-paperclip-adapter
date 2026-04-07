import { describe, it, expect } from 'vitest';
import { parseAmplifierStdoutLine } from '../src/ui/parse-stdout.js';

const TS = '2026-04-06T12:00:00.000Z';

describe('parseAmplifierStdoutLine', () => {
  it('parses init event to init TranscriptEntry', () => {
    const line = JSON.stringify({ event: 'init', model: 'claude-sonnet-4-5', sessionId: 'abc' });
    const result = parseAmplifierStdoutLine(line, TS);
    expect(result).toEqual([{ kind: 'init', ts: TS, model: 'claude-sonnet-4-5', sessionId: 'abc' }]);
  });

  it('parses content_delta to assistant TranscriptEntry', () => {
    const line = JSON.stringify({ event: 'content_delta', text: 'Working on it...' });
    const result = parseAmplifierStdoutLine(line, TS);
    expect(result).toEqual([{ kind: 'assistant', ts: TS, text: 'Working on it...', delta: true }]);
  });

  it('parses tool_start to tool_call TranscriptEntry', () => {
    const line = JSON.stringify({ event: 'tool_start', tool: 'bash', input: 'git status' });
    const result = parseAmplifierStdoutLine(line, TS);
    expect(result).toEqual([{ kind: 'tool_call', ts: TS, name: 'bash', input: 'git status' }]);
  });

  it('parses tool_end to tool_result TranscriptEntry', () => {
    const line = JSON.stringify({ event: 'tool_end', tool: 'bash', output: 'On branch main' });
    const result = parseAmplifierStdoutLine(line, TS);
    expect(result).toEqual([{ kind: 'tool_result', ts: TS, toolUseId: '', toolName: 'bash', content: 'On branch main', isError: false }]);
  });

  it('parses result event to result TranscriptEntry', () => {
    const line = JSON.stringify({
      event: 'result',
      summary: 'Done.',
      usage: { inputTokens: 100, outputTokens: 50, cachedTokens: 0 },
      costUsd: 0.01,
    });
    const result = parseAmplifierStdoutLine(line, TS);
    expect(result).toEqual([{
      kind: 'result',
      ts: TS,
      text: 'Done.',
      inputTokens: 100,
      outputTokens: 50,
      cachedTokens: 0,
      costUsd: 0.01,
      subtype: '',
      isError: false,
      errors: [],
    }]);
  });

  it('parses error event to result TranscriptEntry with isError:true', () => {
    const line = JSON.stringify({ event: 'error', message: 'Timeout' });
    const result = parseAmplifierStdoutLine(line, TS);
    expect(result).toEqual([{
      kind: 'result',
      ts: TS,
      text: '',
      inputTokens: 0,
      outputTokens: 0,
      cachedTokens: 0,
      costUsd: 0,
      subtype: 'error',
      isError: true,
      errors: ['Timeout'],
    }]);
  });

  it('returns stdout entry for non-JSON lines', () => {
    const line = 'plain text output';
    const result = parseAmplifierStdoutLine(line, TS);
    expect(result).toEqual([{ kind: 'stdout', ts: TS, text: 'plain text output' }]);
  });

  it('skips empty content_delta text - returns stdout entry for the raw line', () => {
    const line = JSON.stringify({ event: 'content_delta', text: '' });
    const result = parseAmplifierStdoutLine(line, TS);
    expect(result).toEqual([{ kind: 'stdout', ts: TS, text: line }]);
  });
});
