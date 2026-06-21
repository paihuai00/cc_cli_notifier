import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { getStringField, isRecord } from '../notify/event.js';
function projectDirFor(cwd) {
    return cwd.replaceAll('/', '-').replaceAll('.', '-');
}
export function inferTranscriptPath(sessionId, cwd) {
    if (!sessionId || !cwd)
        return undefined;
    let current = path.resolve(cwd);
    while (current.length > 1) {
        const candidate = path.join(os.homedir(), '.claude', 'projects', projectDirFor(current), `${sessionId}.jsonl`);
        if (fs.existsSync(candidate))
            return candidate;
        const parent = path.dirname(current);
        if (parent === current)
            break;
        current = parent;
    }
    return path.join(os.homedir(), '.claude', 'projects', projectDirFor(cwd), `${sessionId}.jsonl`);
}
function truncate(text, maxLength) {
    if (!text)
        return undefined;
    const cleaned = text.trim().replace(/\s+/g, ' ');
    if (!cleaned)
        return undefined;
    return cleaned.length > maxLength ? `${cleaned.slice(0, Math.max(0, maxLength - 3))}...` : cleaned;
}
function isSystemMessage(text) {
    return text.startsWith('<command-name>') ||
        text.startsWith('<local-command') ||
        text.startsWith('<task-notification>') ||
        text.startsWith('<system-reminder>') ||
        text.startsWith('Caveat:');
}
function isInterruptedMessage(text) {
    return text.trim() === '[Request interrupted by user]';
}
function isIgnoredText(text) {
    return isSystemMessage(text) || isInterruptedMessage(text);
}
function contentHasToolResult(content) {
    return Array.isArray(content) && content.some((block) => isRecord(block) && block.type === 'tool_result');
}
function isClearCommandText(text) {
    return text.trimStart().startsWith('<command-name>/clear</command-name>');
}
function contentHasClearCommand(content) {
    if (typeof content === 'string')
        return isClearCommandText(content);
    if (!Array.isArray(content))
        return false;
    return content.some((block) => isRecord(block) && typeof block.text === 'string' && isClearCommandText(block.text));
}
function extractTextContent(message) {
    if (!isRecord(message))
        return undefined;
    const content = message.content;
    if (typeof content === 'string')
        return isIgnoredText(content) ? undefined : content;
    if (!Array.isArray(content))
        return undefined;
    const texts = [];
    for (const block of content) {
        if (!isRecord(block))
            continue;
        if (block.type === 'text' && typeof block.text === 'string' && !isIgnoredText(block.text)) {
            texts.push(block.text);
        }
    }
    return texts.length > 0 ? texts.join('\n') : undefined;
}
function readTailLines(filePath, maxBytes = 512 * 1024) {
    const stat = fs.statSync(filePath);
    const start = Math.max(0, stat.size - maxBytes);
    const fd = fs.openSync(filePath, 'r');
    try {
        const buffer = Buffer.alloc(stat.size - start);
        fs.readSync(fd, buffer, 0, buffer.length, start);
        return buffer.toString('utf8').split('\n').filter(Boolean);
    }
    finally {
        fs.closeSync(fd);
    }
}
export function extractTranscriptSummary(options) {
    if (!options.config.enabled)
        return {};
    const explicitPath = getStringField(options.hookPayload, 'transcript_path') ?? getStringField(options.hookPayload, 'transcriptPath');
    const transcriptPath = explicitPath ?? inferTranscriptPath(options.sessionId, options.cwd);
    if (!transcriptPath)
        return {};
    if (!fs.existsSync(transcriptPath))
        return { transcriptPath };
    try {
        const lines = readTailLines(transcriptPath);
        let lastUserMessage;
        let lastAssistantSummary;
        for (let index = lines.length - 1; index >= 0; index -= 1) {
            const line = lines[index];
            if (!line)
                continue;
            let parsed;
            try {
                parsed = JSON.parse(line);
            }
            catch {
                continue;
            }
            if (!isRecord(parsed))
                continue;
            const type = parsed.type;
            if (parsed.isMeta === true)
                continue;
            const message = parsed.message;
            if (isRecord(message) && contentHasClearCommand(message.content))
                break;
            if (!lastAssistantSummary && type === 'assistant') {
                lastAssistantSummary = truncate(extractTextContent(message), options.config.maxAssistantChars);
            }
            if (!lastUserMessage && type === 'user' && isRecord(message) && !contentHasToolResult(message.content)) {
                lastUserMessage = truncate(extractTextContent(message), options.config.maxUserChars);
            }
            if (lastUserMessage && lastAssistantSummary)
                break;
        }
        const summary = { transcriptPath };
        if (lastUserMessage)
            summary.lastUserMessage = lastUserMessage;
        if (lastAssistantSummary)
            summary.lastAssistantSummary = lastAssistantSummary;
        return summary;
    }
    catch {
        return { transcriptPath };
    }
}
//# sourceMappingURL=transcript.js.map