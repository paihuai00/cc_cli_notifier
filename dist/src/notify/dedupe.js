import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { dedupeStatePath } from '../config/paths.js';
function hash(value) {
    return crypto.createHash('sha256').update(value ?? '').digest('hex').slice(0, 16);
}
export function dedupeKey(event) {
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
function readState(filePath) {
    if (!fs.existsSync(filePath))
        return { entries: {} };
    try {
        const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        return parsed && typeof parsed.entries === 'object' ? parsed : { entries: {} };
    }
    catch {
        return { entries: {} };
    }
}
export function shouldSendAndRecord(event, config, nowMs = Date.now()) {
    if (!config.enabled)
        return true;
    const filePath = dedupeStatePath();
    const state = readState(filePath);
    const key = dedupeKey(event);
    const windowMs = config.windowSeconds * 1000;
    const previous = state.entries[key];
    if (previous !== undefined && nowMs - previous < windowMs) {
        return false;
    }
    const pruned = {};
    for (const [entryKey, timestamp] of Object.entries(state.entries)) {
        if (nowMs - timestamp < windowMs)
            pruned[entryKey] = timestamp;
    }
    pruned[key] = nowMs;
    try {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, `${JSON.stringify({ entries: pruned }, null, 2)}\n`, 'utf8');
    }
    catch {
        // Best-effort only: never block hook runtime because dedupe state failed.
    }
    return true;
}
//# sourceMappingURL=dedupe.js.map