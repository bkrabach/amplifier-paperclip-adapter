import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { printAmplifierStreamEvent } from '../src/cli/format-event.js';

describe('printAmplifierStreamEvent', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('prints init event with model and session', () => {
    const line = JSON.stringify({ event: 'init', model: 'claude-sonnet-4-5', sessionId: 'abc' });
    printAmplifierStreamEvent(line, false);
    expect(consoleSpy).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('claude-sonnet-4-5'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('abc'));
  });

  it('prints content_delta as assistant text', () => {
    const line = JSON.stringify({ event: 'content_delta', text: 'Working on it...' });
    printAmplifierStreamEvent(line, false);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Working on it...'));
  });

  it('prints tool_start with tool name', () => {
    const line = JSON.stringify({ event: 'tool_start', tool: 'bash', input: 'git status' });
    printAmplifierStreamEvent(line, false);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('bash'));
  });

  it('prints result with usage and cost', () => {
    const line = JSON.stringify({
      event: 'result',
      summary: 'Done.',
      usage: { inputTokens: 100, outputTokens: 50, cachedTokens: 0 },
      costUsd: 0.01,
    });
    printAmplifierStreamEvent(line, false);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Done.'));
  });

  it('prints error with message', () => {
    const line = JSON.stringify({ event: 'error', message: 'Timeout exceeded' });
    printAmplifierStreamEvent(line, false);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Timeout exceeded'));
  });

  it('prints raw line for non-JSON', () => {
    printAmplifierStreamEvent('plain text', false);
    expect(consoleSpy).toHaveBeenCalledWith('plain text');
  });

  it('skips empty lines', () => {
    printAmplifierStreamEvent('', false);
    printAmplifierStreamEvent('   ', false);
    expect(consoleSpy).not.toHaveBeenCalled();
  });

  it('prints unknown events in debug mode', () => {
    const line = JSON.stringify({ event: 'unknown_type', data: 'some data' });
    printAmplifierStreamEvent(line, true);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('does not print unknown events in non-debug mode', () => {
    const line = JSON.stringify({ event: 'unknown_type', data: 'some data' });
    printAmplifierStreamEvent(line, false);
    expect(consoleSpy).not.toHaveBeenCalled();
  });
});
