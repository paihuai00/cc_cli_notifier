import { redact } from '../runtime/redact.js';
import { getStringField, isRecord } from './event.js';
const MAX_SUMMARY_CHARS = 180;
const MAX_CONTENT_CHARS = 240;
const SAFE_TARGET_KEYS = ['file_path', 'path', 'notebook_path', 'url'];
function truncate(value, maxChars) {
    if (value.length <= maxChars)
        return value;
    return `${value.slice(0, Math.max(0, maxChars - 1))}…`;
}
function getToolInput(payload) {
    const direct = payload.tool_input;
    if (isRecord(direct))
        return direct;
    const nested = payload.tool;
    if (isRecord(nested) && isRecord(nested.input))
        return nested.input;
    return {};
}
function getToolName(payload) {
    const nested = payload.tool;
    if (isRecord(nested)) {
        const nestedName = getStringField(nested, 'name');
        if (nestedName)
            return nestedName;
    }
    return getStringField(payload, 'tool_name') ?? 'unknown-tool';
}
function getTarget(input) {
    for (const key of SAFE_TARGET_KEYS) {
        const value = getStringField(input, key);
        if (value)
            return sanitizeTarget(value);
    }
    return undefined;
}
function sanitizeText(value, maxChars) {
    return truncate(redact(value).replace(/\s+/g, ' ').trim(), maxChars);
}
function sanitizeTarget(value) {
    try {
        const url = new URL(value);
        if (url.protocol === 'http:' || url.protocol === 'https:') {
            return truncate(`${url.origin}${url.pathname}`, MAX_SUMMARY_CHARS);
        }
    }
    catch {
        // Non-URL paths are expected here; keep them as short redacted summaries.
    }
    return sanitizeText(value, MAX_SUMMARY_CHARS);
}
function summarizeCommand(command) {
    const firstLine = command.split(/\r?\n/, 1)[0] ?? '';
    return sanitizeText(firstLine, MAX_SUMMARY_CHARS);
}
function summarizeInput(toolName, input, target) {
    const command = getStringField(input, 'command');
    if (command) {
        const content = summarizeCommand(command);
        return {
            summary: `${toolName} 请求执行命令${target ? `：${target}` : ''}`,
            content,
        };
    }
    const pattern = getStringField(input, 'pattern');
    if (pattern) {
        return {
            summary: `${toolName} 请求访问匹配内容${target ? `：${target}` : ''}`,
            content: sanitizeText(pattern, MAX_CONTENT_CHARS),
        };
    }
    if (target) {
        return { summary: `${toolName} 请求访问：${target}` };
    }
    return { summary: `${toolName} 请求权限确认` };
}
export function buildPermissionSummary(payload) {
    const toolName = getToolName(payload);
    const input = getToolInput(payload);
    const target = getTarget(input);
    const { summary, content } = summarizeInput(toolName, input, target);
    const result = {
        toolName,
        permissionSummary: summary,
    };
    if (target)
        result.permissionTarget = target;
    if (content)
        result.permissionContent = content;
    return result;
}
//# sourceMappingURL=permission.js.map