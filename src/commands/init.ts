import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { writeDefaultConfig } from '../config/load.js';
import { installHooks } from '../claude/settings.js';
import type { ProviderType } from '../config/schema.js';
import type { Logger } from '../runtime/logger.js';

interface InitOptions {
  provider?: ProviderType;
  env?: string;
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
  }
  return options;
}

function defaultEnvFor(provider: ProviderType): string {
  if (provider === 'feishu') return 'FEISHU_BOT_WEBHOOK';
  if (provider === 'wecom') return 'WECOM_BOT_WEBHOOK';
  if (provider === 'ruliu') return 'RULIU_BOT_WEBHOOK';
  return 'GENERIC_WEBHOOK_URL';
}

async function promptForOptions(options: InitOptions): Promise<InitOptions> {
  if (options.provider && options.env) return options;
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
  const provider = options.provider && options.env ? { type: options.provider, envName: options.env } : undefined;
  const configPath = writeDefaultConfig(provider);
  const result = installHooks();
  logger.info(`Wrote config: ${configPath}`);
  if (provider) logger.info(`Configured ${provider.type} provider using env:${provider.envName}`);
  else logger.info('No provider configured yet; edit config or rerun init with --provider/--env');
  if (result.changed) {
    logger.info('Installed Claude Code Stop and PermissionRequest hooks');
    if (result.backupPath) logger.info(`Backed up settings: ${result.backupPath}`);
  } else {
    logger.info('Claude Code Stop and PermissionRequest hooks already installed');
  }
  return 0;
}
