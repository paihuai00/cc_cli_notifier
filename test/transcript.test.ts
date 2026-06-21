import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { extractTranscriptSummary } from '../src/claude/transcript.js';
import type { SummaryConfig } from '../src/config/schema.js';

const summaryConfig: SummaryConfig = {
  enabled: true,
  maxUserChars: 24,
  maxAssistantChars: 32,
};

function writeTranscript(lines: unknown[]): string {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-notifier-transcript-'));
  const transcriptPath = path.join(tmpDir, 'session.jsonl');
  const content = lines.map((line) => typeof line === 'string' ? line : JSON.stringify(line)).join('\n');
  fs.writeFileSync(transcriptPath, `${content}\n`, 'utf8');
  return transcriptPath;
}

function removeTranscript(transcriptPath: string): void {
  fs.rmSync(path.dirname(transcriptPath), { recursive: true, force: true });
}

test('extractTranscriptSummary skips invalid, meta, and system notification lines', () => {
  const transcriptPath = writeTranscript([
    'not json',
    { type: 'user', isMeta: true, message: { content: 'meta user should not appear' } },
    { type: 'assistant', message: { content: '<system-reminder>internal reminder</system-reminder>' } },
    { type: 'user', message: { content: [{ type: 'text', text: '<task-notification>task finished</task-notification>' }] } },
    { type: 'user', message: { content: [{ type: 'text', text: '  summarize   the\nrelease   ' }] } },
    { type: 'assistant', message: { content: [{ type: 'text', text: '  completed   the\nrequested   analysis   ' }] } },
  ]);
  try {
    const summary = extractTranscriptSummary({
      hookPayload: { transcript_path: transcriptPath },
      cwd: path.dirname(transcriptPath),
      config: summaryConfig,
    });

    assert.equal(summary.transcriptPath, transcriptPath);
    assert.equal(summary.lastUserMessage, 'summarize the release');
    assert.equal(summary.lastAssistantSummary, 'completed the requested analysis');
  } finally {
    removeTranscript(transcriptPath);
  }
});

test('extractTranscriptSummary treats the last /clear command as a transcript boundary', () => {
  const transcriptPath = writeTranscript([
    { type: 'user', message: { content: 'old user request' } },
    { type: 'assistant', message: { content: 'old assistant answer' } },
    { type: 'user', message: { content: '<command-name>/clear</command-name>' } },
    { type: 'user', message: { content: 'new user request after clear' } },
    { type: 'assistant', message: { content: 'new assistant answer after clear' } },
  ]);
  try {
    const summary = extractTranscriptSummary({
      hookPayload: { transcript_path: transcriptPath },
      cwd: path.dirname(transcriptPath),
      config: { ...summaryConfig, maxUserChars: 80, maxAssistantChars: 80 },
    });

    assert.equal(summary.lastUserMessage, 'new user request after clear');
    assert.equal(summary.lastAssistantSummary, 'new assistant answer after clear');
  } finally {
    removeTranscript(transcriptPath);
  }
});

test('extractTranscriptSummary does not pull user or assistant summaries from before /clear', () => {
  const transcriptPath = writeTranscript([
    { type: 'user', message: { content: 'old user request' } },
    { type: 'assistant', message: { content: 'old assistant answer' } },
    { type: 'user', message: { content: [{ type: 'text', text: '<command-name>/clear</command-name>' }] } },
  ]);
  try {
    const summary = extractTranscriptSummary({
      hookPayload: { transcript_path: transcriptPath },
      cwd: path.dirname(transcriptPath),
      config: summaryConfig,
    });

    assert.equal(summary.lastUserMessage, undefined);
    assert.equal(summary.lastAssistantSummary, undefined);
  } finally {
    removeTranscript(transcriptPath);
  }
});

test('extractTranscriptSummary skips tool_result and interrupted user rows', () => {
  const transcriptPath = writeTranscript([
    { type: 'user', message: { content: 'actual user question' } },
    { type: 'assistant', message: { content: 'assistant response' } },
    { type: 'user', message: { content: '[Request interrupted by user]' } },
    { type: 'user', message: { content: [{ type: 'text', text: 'tool output text' }, { type: 'tool_result', content: 'raw output' }] } },
  ]);
  try {
    const summary = extractTranscriptSummary({
      hookPayload: { transcript_path: transcriptPath },
      cwd: path.dirname(transcriptPath),
      config: { ...summaryConfig, maxUserChars: 80, maxAssistantChars: 80 },
    });

    assert.equal(summary.lastUserMessage, 'actual user question');
    assert.equal(summary.lastAssistantSummary, 'assistant response');
  } finally {
    removeTranscript(transcriptPath);
  }
});

test('extractTranscriptSummary does not treat ordinary text mentioning clear markup as a boundary', () => {
  const transcriptPath = writeTranscript([
    { type: 'user', message: { content: 'old user request before marker mention' } },
    { type: 'assistant', message: { content: 'old assistant answer before marker mention' } },
    { type: 'user', message: { content: 'Please explain <command-name>/clear</command-name> in docs' } },
    { type: 'assistant', message: { content: 'clear marker explanation' } },
  ]);
  try {
    const summary = extractTranscriptSummary({
      hookPayload: { transcript_path: transcriptPath },
      cwd: path.dirname(transcriptPath),
      config: { ...summaryConfig, maxUserChars: 80, maxAssistantChars: 80 },
    });

    assert.equal(summary.lastUserMessage, 'Please explain <command-name>/clear</command-name> in docs');
    assert.equal(summary.lastAssistantSummary, 'clear marker explanation');
  } finally {
    removeTranscript(transcriptPath);
  }
});

test('extractTranscriptSummary does not drop ordinary text that mentions interrupted requests', () => {
  const transcriptPath = writeTranscript([
    { type: 'user', message: { content: '[Request interrupted intentionally? please explain]' } },
    { type: 'assistant', message: { content: 'interruption explanation' } },
  ]);
  try {
    const summary = extractTranscriptSummary({
      hookPayload: { transcript_path: transcriptPath },
      cwd: path.dirname(transcriptPath),
      config: { ...summaryConfig, maxUserChars: 80, maxAssistantChars: 80 },
    });

    assert.equal(summary.lastUserMessage, '[Request interrupted intentionally? please explain]');
    assert.equal(summary.lastAssistantSummary, 'interruption explanation');
  } finally {
    removeTranscript(transcriptPath);
  }
});

test('extractTranscriptSummary keeps configured maxUserChars and maxAssistantChars truncation', () => {
  const transcriptPath = writeTranscript([
    { type: 'user', message: { content: 'abcdefghijklmnopqrstuvwxyz' } },
    { type: 'assistant', message: { content: '0123456789abcdefghijklmnopqrstuvwxyz' } },
  ]);
  try {
    const summary = extractTranscriptSummary({
      hookPayload: { transcript_path: transcriptPath },
      cwd: path.dirname(transcriptPath),
      config: { enabled: true, maxUserChars: 10, maxAssistantChars: 12 },
    });

    assert.equal(summary.lastUserMessage, 'abcdefg...');
    assert.equal(summary.lastAssistantSummary, '012345678...');
  } finally {
    removeTranscript(transcriptPath);
  }
});
