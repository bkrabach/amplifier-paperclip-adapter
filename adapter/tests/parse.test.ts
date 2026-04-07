import { describe, it, expect } from 'vitest';
import { parseAmplifierStream } from '../src/server/parse.js';

// Helper to build JSONL stdout from an array of event objects
function makeStdout(events: object[]): string {
  return events.map((e) => JSON.stringify(e)).join('\n');
}

describe('parseAmplifierStream', () => {
  it('parses complete successful session', () => {
    const stdout = makeStdout([
      { event: 'init', sessionId: 'sess-abc', model: 'claude-3-5-sonnet', bundle: 'my-bundle' },
      { event: 'content_delta', text: 'Hello world' },
      { event: 'tool_start', tool: 'read_file', input: '{"path": "/foo.ts"}' },
      { event: 'tool_end', tool: 'read_file', output: 'file contents here' },
      {
        event: 'result',
        summary: 'Task completed successfully',
        usage: { inputTokens: 1234, outputTokens: 567 },
        costUsd: 0.0089,
      },
    ]);

    const result = parseAmplifierStream(stdout);

    expect(result.sessionId).toBe('sess-abc');
    expect(result.model).toBe('claude-3-5-sonnet');
    expect(result.bundle).toBe('my-bundle');
    expect(result.summary).toBe('Task completed successfully');
    expect(result.usage).toEqual({ inputTokens: 1234, outputTokens: 567 });
    expect(result.costUsd).toBe(0.0089);
    expect(result.error).toBeNull();
  });

  it('parses error session', () => {
    const stdout = makeStdout([
      { event: 'init', sessionId: 'sess-xyz', model: 'claude-3-5-sonnet', bundle: 'my-bundle' },
      { event: 'error', message: 'Rate limit exceeded', code: 'RATE_LIMIT' },
    ]);

    const result = parseAmplifierStream(stdout);

    expect(result.error).toEqual({ message: 'Rate limit exceeded', code: 'RATE_LIMIT' });
    expect(result.summary).toBe('');
  });

  it('handles empty stdout', () => {
    const result = parseAmplifierStream('');

    expect(result.sessionId).toBeNull();
    expect(result.model).toBe('');
    expect(result.summary).toBe('');
    expect(result.error).toBeNull();
  });

  it('handles malformed JSON lines gracefully', () => {
    const stdout = [
      'not json at all',
      JSON.stringify({ event: 'init', sessionId: 'sess-ok', model: 'claude', bundle: 'b' }),
      '{ broken json',
      JSON.stringify({ event: 'result', summary: 'Done', usage: null, costUsd: null }),
    ].join('\n');

    const result = parseAmplifierStream(stdout);

    // Malformed lines are skipped; valid events are parsed
    expect(result.sessionId).toBe('sess-ok');
    expect(result.summary).toBe('Done');
  });

  it('handles result with null usage and cost', () => {
    const stdout = makeStdout([
      { event: 'init', sessionId: 'sess-1', model: 'claude', bundle: 'b' },
      { event: 'result', summary: 'Done', usage: null, costUsd: null },
    ]);

    const result = parseAmplifierStream(stdout);

    expect(result.usage).toBeNull();
    expect(result.costUsd).toBeNull();
  });

  it('accumulates content_delta text as assistantText', () => {
    const stdout = makeStdout([
      { event: 'init', sessionId: 's1', model: 'm', bundle: 'b' },
      { event: 'content_delta', text: 'Hello ' },
      { event: 'content_delta', text: 'world' },
      { event: 'content_delta', text: '!' },
    ]);

    const result = parseAmplifierStream(stdout);

    expect(result.assistantText).toBe('Hello world!');
  });

  it('collects tool events', () => {
    const stdout = makeStdout([
      { event: 'init', sessionId: 's1', model: 'm', bundle: 'b' },
      { event: 'tool_start', tool: 'read_file', input: '{"path":"/a.ts"}' },
      { event: 'tool_end', tool: 'read_file', output: 'content' },
      { event: 'tool_start', tool: 'write_file', input: '{"path":"/b.ts","content":"x"}' },
      { event: 'tool_end', tool: 'write_file', output: 'ok' },
    ]);

    const result = parseAmplifierStream(stdout);

    expect(result.toolEvents).toHaveLength(4);
    expect(result.toolEvents[0]).toEqual({ kind: 'start', tool: 'read_file', input: '{"path":"/a.ts"}' });
    expect(result.toolEvents[1]).toEqual({ kind: 'end', tool: 'read_file', output: 'content' });
    expect(result.toolEvents[2]).toEqual({ kind: 'start', tool: 'write_file', input: '{"path":"/b.ts","content":"x"}' });
    expect(result.toolEvents[3]).toEqual({ kind: 'end', tool: 'write_file', output: 'ok' });
  });
});
