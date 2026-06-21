import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { writeDefaultConfig, type InitProviderConfig } from '../config/load.js';
import { installHooks } from '../claude/settings.js';
import type { ProviderType } from '../config/schema.js';
import type { Logger } from '../runtime/logger.js';

interface InitOptions {
  provider?: ProviderType;
  env?: string;
  url?: string;
  yes?: boolean;
}

function isProviderType(value: string | undefined): value is ProviderType {
  return value === 'feishu' || value === 'wecom' || value === 'webhook' || value === 'ruliu';
}

function parseOptions(args: string[]): InitOptions {
  const options: InitOptions = { yes: args.includes('--yes') || args.includes('-y') };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = args[index + 1];
    if (arg === '--provider' && isProviderType(next)) {
      options.provider = next;
    }
    if (arg === '--env' && next) {
      options.env = next;
    }
    if (arg === '--url' && next) {
      options.url = next;
    }
  }
  return options;
}

function defaultEnvFor(provider: ProviderType): string {
  if (provider === 'feishu') return 'FEISHU_BOT_WEBHOOK';
  if (provider === 'wecom') return 'WECOM_BOT_WEBHOOK';
  if (provider === 'ruliu') return 'RULIU_BOT_WEBHOOK';
  return 'GENERIC_WEBHOOK_URL';
}

function looksLikeUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function isValidEnvName(value: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(value);
}

function validateEnvOption(envName: string, provider: ProviderType, logger: Logger): boolean {
  const defaultEnv = defaultEnvFor(provider);
  if (looksLikeUrl(envName)) {
    logger.error('--env expects an environment variable name, not a webhook URL.');
    logger.error(`Use: export ${defaultEnv}="${envName}"`);
    logger.error(`Then run: cc-notifier init --provider ${provider} --env ${defaultEnv}`);
    logger.error(`Or store the webhook URL directly with: cc-notifier init --provider ${provider} --url "${envName}"`);
    return false;
  }
  if (envName.includes('=')) {
    const [name, value] = envName.split('=', 2);
    logger.error('--env expects only the environment variable name, not NAME=URL.');
    if (name && value && looksLikeUrl(value)) {
      logger.error(`Use: export ${name}="${value}"`);
      logger.error(`Then run: cc-notifier init --provider ${provider} --env ${name}`);
      logger.error(`Or store the webhook URL directly with: cc-notifier init --provider ${provider} --url "${value}"`);
    }
    return false;
  }
  if (!isValidEnvName(envName)) {
    logger.error(`Invalid environment variable name: ${envName}`);
    logger.error(`Use a name like ${defaultEnv}, then set it to your webhook URL.`);
    return false;
  }
  return true;
}

function validateUrlOption(url: string, logger: Logger): boolean {
  if (!looksLikeUrl(url)) {
    logger.error(`Invalid webhook URL: ${url}`);
    logger.error('Use a URL starting with http:// or https://.');
    return false;
  }
  return true;
}

function buildProvider(options: InitOptions, logger: Logger): InitProviderConfig | undefined {
  if (!options.provider) return undefined;
  if (options.env && options.url) {
    logger.error('Use only one of --env or --url, not both.');
    return undefined;
  }
  if (options.env) {
    if (!validateEnvOption(options.env, options.provider, logger)) return undefined;
    return { type: options.provider, secret: { kind: 'env', name: options.env } };
  }
  if (options.url) {
    if (!validateUrlOption(options.url, logger)) return undefined;
    return { type: options.provider, secret: { kind: 'url', value: options.url } };
  }
  return undefined;
}

async function promptForOptions(options: InitOptions): Promise<InitOptions> {
  if (options.provider && (options.env || options.url)) return options;
  if (!process.stdin.isTTY || options.yes) return options;

  const rl = readline.createInterface({ input, output });
  try {
    if (!options.provider) {
      const answer = (await rl.question('Provider (feishu/wecom/ruliu/webhook, empty to skip): ')).trim();
      if (isProviderType(answer)) options.provider = answer;
    }
    if (options.provider && !options.env) {
      const defaultEnv = defaultEnvFor(options.provider);
      const answer = (await rl.question(`Environment variable for webhook URL (${defaultEnv}): `)).trim();
      options.env = answer || defaultEnv;
    }
    return options;
  } finally {
    rl.close();
  }
}

export async function runInit(args: string[], logger: Logger): Promise<number> {
  const options = await promptForOptions(parseOptions(args));
  if (options.provider && options.env && options.url) {
    logger.error('Use only one of --env or --url, not both.');
    return 1;
  }
  const provider = buildProvider(options, logger);
  if (options.provider && (options.env || options.url) && !provider) {
    return 1;
  }
  const configPath = writeDefaultConfig(provider);
  const result = installHooks();
  logger.info(`Wrote config: ${configPath}`);
  if (provider) {
    const source = provider.secret.kind === 'env' ? `env:${provider.secret.name}` : 'direct webhook URL';
    logger.info(`Configured ${provider.type} provider using ${source}`);
  } else logger.info('No provider configured yet; edit config or rerun init with --provider/--env or --provider/--url');
  if (result.changed) {
    logger.info('Installed Claude Code Stop and PermissionRequest hooks');
    if (result.backupPath) logger.info(`Backed up settings: ${result.backupPath}`);
  } else {
    logger.info('Claude Code Stop and PermissionRequest hooks already installed');
  }
  return 0;
}
