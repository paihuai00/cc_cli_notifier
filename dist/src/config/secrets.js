function resolveValue(value) {
    if (!value.startsWith('env:'))
        return value;
    const envName = value.slice('env:'.length);
    const resolved = process.env[envName];
    if (!resolved)
        throw new Error(`Missing environment variable: ${envName}`);
    return resolved;
}
function resolveProvider(provider) {
    if (provider.type === 'feishu') {
        return { ...provider, webhookUrl: resolveValue(provider.webhookUrl) };
    }
    if (provider.type === 'wecom') {
        return { ...provider, webhookUrl: resolveValue(provider.webhookUrl) };
    }
    if (provider.type === 'ruliu') {
        return { ...provider, webhookUrl: resolveValue(provider.webhookUrl) };
    }
    return { ...provider, url: resolveValue(provider.url) };
}
export function resolveSecrets(config) {
    return {
        ...config,
        providers: config.providers.map(resolveProvider),
    };
}
//# sourceMappingURL=secrets.js.map