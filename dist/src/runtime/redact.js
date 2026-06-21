const SECRET_PATTERNS = [
    /https:\/\/[^\s"']*(hook|webhook|token|key)[^\s"']*/gi,
    /(token|secret|key|webhookUrl|url)=[^\s&]+/gi,
];
export function redact(value) {
    let text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
    if (!text)
        return '';
    for (const pattern of SECRET_PATTERNS) {
        text = text.replace(pattern, '[REDACTED]');
    }
    return text;
}
//# sourceMappingURL=redact.js.map