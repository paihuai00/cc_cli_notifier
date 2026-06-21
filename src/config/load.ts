import fs from 'node:fs';
import path from 'node:path';
import { findProjectConfig, globalConfigPath } from './paths.js';
import { mergeConfig } from './merge.js';
import { defaultConfig, validateConfig, type CcNotifierConfig, type ProviderConfig, type ProviderType } from './schema.js';

export type InitProviderSecret =
  | { kind: 'env'; name: string }
  | { kind: 'url'; value: string };

export interface InitProviderConfig {
  type: ProviderType;
  secret: InitProviderSecret;
}

function readJsonIfExists(filePath: string | undefined): unknown {
  if (!filePath || !fs.existsSync(filePath)) return undefined;
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

export function loadConfig(cwd?: string): { config: CcNotifierConfig; paths: string[]; errors: string[] } {
  const paths: string[] = [];
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
    paths.push(projectPath as string);
    config = mergeConfig(config, projectJson);
  }

  config = mergeDefaultNotifyOn(config);

  return { config, paths, errors: validateConfig(config) };
}

function providerSecretValue(secret: InitProviderSecret): string {
  return secret.kind === 'env' ? `env:${secret.name}` : secret.value;
}

function providerFromInit(provider: InitProviderConfig): ProviderConfig {
  const value = providerSecretValue(provider.secret);
  if (provider.type === 'feishu') return { type: 'feishu', enabled: true, webhookUrl: value };
  if (provider.type === 'wecom') return { type: 'wecom', enabled: true, webhookUrl: value };
  if (provider.type === 'ruliu') return { type: 'ruliu', enabled: true, webhookUrl: value };
  return { type: 'webhook', enabled: true, url: value };
}

export function mergeDefaultNotifyOn(config: CcNotifierConfig): CcNotifierConfig {
  const notifyOn = [...config.notifyOn];
  for (const eventName of defaultConfig.notifyOn) {
    if (!notifyOn.includes(eventName)) notifyOn.push(eventName);
  }
  return { ...config, notifyOn };
}

export function writeDefaultConfig(provider?: InitProviderConfig): string {
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
