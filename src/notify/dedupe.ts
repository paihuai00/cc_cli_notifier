import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { DedupeConfig } from '../config/schema.js';
import { dedupeStatePath } from '../config/paths.js';
import type { NotificationEvent } from './event.js';

interface DedupeState {
  entries: Record<string, number>;
}

function hash(value: string | undefined): string {
  return crypto.createHash('sha256').update(value ?? '').digest('hex').slice(0, 16);
}

export function dedupeKey(event: NotificationEvent): string {
  return [
    event.event,
    event.sessionId ?? '',
    event.cwd ?? '',
    hash(event.lastUserMessage),
    hash(event.lastAssistantSummary),
    hash(event.toolName),
    hash(event.permissionSummary),
    hash(event.permissionTarget),
    hash(event.permissionContent),
  ].join('|');
}

function readState(filePath: string): DedupeState {
  if (!fs.existsSync(filePath)) return { entries: {} };
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as DedupeState;
    return parsed && typeof parsed.entries === 'object' ? parsed : { entries: {} };
  } catch {
    return { entries: {} };
  }
}

export function shouldSendAndRecord(event: NotificationEvent, config: DedupeConfig, nowMs = Date.now()): boolean {
  if (!config.enabled) return true;
  const filePath = dedupeStatePath();
  const state = readState(filePath);
  const key = dedupeKey(event);
  const windowMs = config.windowSeconds * 1000;
  const previous = state.entries[key];
  if (previous !== undefined && nowMs - previous < windowMs) {
    return false;
  }

  const pruned: Record<string, number> = {};
  for (const [entryKey, timestamp] of Object.entries(state.entries)) {
    if (nowMs - timestamp < windowMs) pruned[entryKey] = timestamp;
  }
  pruned[key] = nowMs;

  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, `${JSON.stringify({ entries: pruned }, null, 2)}\n`, 'utf8');
  } catch {
    // Best-effort only: never block hook runtime because dedupe state failed.
  }
  return true;
}
