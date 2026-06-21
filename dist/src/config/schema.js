export const defaultConfig = {
    enabled: true,
    notifyOn: ['Stop', 'PermissionRequest'],
    summary: {
        enabled: true,
        maxUserChars: 120,
        maxAssistantChars: 240,
    },
    quietHours: {
        enabled: false,
        timezone: 'local',
        ranges: [{ start: '22:00', end: '08:00' }],
        behavior: 'suppress',
    },
    dedupe: {
        enabled: true,
        windowSeconds: 300,
    },
    template: {
        title: '✅ Claude 完成：{{projectName}}',
        text: 'Project: {{projectName}}\nPath: {{cwd}}\n\nUser:\n{{lastUserMessage}}\n\nClaude:\n{{lastAssistantSummary}} 等待下一步',
    },
    providers: [],
};
export function validateConfig(config) {
    const errors = [];
    if (!Array.isArray(config.notifyOn))
        errors.push('notifyOn must be an array');
    if (!Array.isArray(config.providers))
        errors.push('providers must be an array');
    if (config.summary.maxUserChars <= 0)
        errors.push('summary.maxUserChars must be positive');
    if (config.summary.maxAssistantChars <= 0)
        errors.push('summary.maxAssistantChars must be positive');
    if (config.dedupe.windowSeconds <= 0)
        errors.push('dedupe.windowSeconds must be positive');
    for (const [index, provider] of config.providers.entries()) {
        if (!['feishu', 'wecom', 'webhook', 'ruliu'].includes(provider.type)) {
            errors.push(`providers[${index}].type is unsupported`);
        }
        if (provider.type === 'feishu' && !provider.webhookUrl) {
            errors.push(`providers[${index}].webhookUrl is required`);
        }
        if (provider.type === 'wecom' && !provider.webhookUrl) {
            errors.push(`providers[${index}].webhookUrl is required`);
        }
        if (provider.type === 'webhook' && !provider.url) {
            errors.push(`providers[${index}].url is required`);
        }
        if (provider.type === 'ruliu' && !provider.webhookUrl) {
            errors.push(`providers[${index}].webhookUrl is required`);
        }
    }
    for (const [index, range] of config.quietHours.ranges.entries()) {
        if (!/^\d{2}:\d{2}$/.test(range.start) || !/^\d{2}:\d{2}$/.test(range.end)) {
            errors.push(`quietHours.ranges[${index}] must use HH:mm`);
        }
    }
    return errors;
}
//# sourceMappingURL=schema.js.map