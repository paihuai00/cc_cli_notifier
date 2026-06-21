function valueFor(event, key) {
    const value = event[key];
    if (value === undefined || value === null)
        return '';
    if (typeof value === 'string')
        return value;
    return String(value);
}
export function renderTemplate(template, event) {
    return template.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_, key) => valueFor(event, key));
}
function renderPermissionRequest(event) {
    const title = `Claude 权限请求：${event.projectName}`;
    const lines = [
        `Project: ${event.projectName}`,
        `Path: ${event.cwd ?? ''}`,
        '',
        `Tool: ${event.toolName ?? 'unknown-tool'}`,
        `Summary: ${event.permissionSummary ?? '请求权限确认'}`,
    ];
    if (event.permissionTarget)
        lines.push(`Target: ${event.permissionTarget}`);
    if (event.permissionContent)
        lines.push(`Request: ${event.permissionContent}`);
    lines.push('', '请回到终端确认。');
    return { title, text: lines.join('\n') };
}
export function renderNotification(template, event) {
    if (event.event === 'PermissionRequest')
        return renderPermissionRequest(event);
    const title = renderTemplate(template.title, event);
    let text = renderTemplate(template.text, event);
    if (!event.lastUserMessage && !event.lastAssistantSummary) {
        text = `Path: ${event.cwd ?? ''}\nSession: ${event.sessionId ?? ''}\nTime: ${event.timestamp}\n\nClaude:\n已完成，等待下一步`;
    }
    return { title, text };
}
//# sourceMappingURL=template.js.map