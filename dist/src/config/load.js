import fs from 'node:fs';
import path from 'node:path';
import { findProjectConfig, globalConfigPath } from './paths.js';
import { mergeConfig } from './merge.js';
import { defaultConfig, validateConfig } from './schema.js';
function readJsonIfExists(filePath) {
    if (!filePath || !fs.existsSync(filePath))
        return undefined;
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
}
export function loadConfig(cwd) {
    const paths = [];
    let config = structuredClone(defaultConfig);
    const globalPath = globalConfigPath();
    const globalJson = readJsonIfExists(globalPath);
    if (globalJson !== undefined) {
        paths.push(globalPath);
        config = mergeConfig(config, globalJson);
    }
    const projectPath = findProjectConfig(cwd);
    const projectJson = readJsonIfExists(projectPath);
    if (projectJson !== undefined) {
        paths.push(projectPath);
        config = mergeConfig(config, projectJson);
    }
    config = mergeDefaultNotifyOn(config);
    return { config, paths, errors: validateConfig(config) };
}
function providerFromInit(provider) {
    if (provider.type === 'feishu')
        return { type: 'feishu', enabled: true, webhookUrl: `env:${provider.envName}` };
    if (provider.type === 'wecom')
        return { type: 'wecom', enabled: true, webhookUrl: `env:${provider.envName}` };
    if (provider.type === 'ruliu')
        return { type: 'ruliu', enabled: true, webhookUrl: `env:${provider.envName}` };
    return { type: 'webhook', enabled: true, url: `env:${provider.envName}` };
}
export function mergeDefaultNotifyOn(config) {
    const notifyOn = [...config.notifyOn];
    for (const eventName of defaultConfig.notifyOn) {
        if (!notifyOn.includes(eventName))
            notifyOn.push(eventName);
    }
    return { ...config, notifyOn };
}
export function writeDefaultConfig(provider) {
    const filePath = globalConfigPath();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const existing = readJsonIfExists(filePath);
    let config = mergeDefaultNotifyOn(mergeConfig(structuredClone(defaultConfig), existing ?? {}));
    if (provider) {
        const nextProvider = providerFromInit(provider);
        const providers = config.providers.filter((item) => item.type !== nextProvider.type);
        config = { ...config, providers: [nextProvider, ...providers] };
    }
    fs.writeFileSync(filePath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
    return filePath;
}
//# sourceMappingURL=load.js.map