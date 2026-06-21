import fs from 'node:fs';
import { inspectInstalledHook, SUPPORTED_HOOK_EVENTS } from '../claude/settings.js';
import { globalConfigPath } from '../config/paths.js';
import { loadConfig } from '../config/load.js';
import { resolveSecrets } from '../config/secrets.js';
import type { Logger } from '../runtime/logger.js';

export async function runDoctor(_args: string[], logger: Logger): Promise<number> {
  let ok = true;
  for (const eventName of SUPPORTED_HOOK_EVENTS) {
    const hook = inspectInstalledHook(eventName);
    if (hook) {
      logger.info(`${eventName} hook installed: ${hook.command}`);
      if (hook.scriptPath && hook.scriptPathExists === false) {
        logger.warn(`${eventName} hook script path does not exist: ${hook.scriptPath}. Run cc-notifier init to reinstall hooks if the project directory was moved or renamed.`);
        ok = false;
      }
    } else {
      logger.warn(`${eventName} hook is not installed`);
      ok = false;
    }
  }

  const configPath = globalConfigPath();
  if (fs.existsSync(configPath)) logger.info(`Global config found: ${configPath}`);
  else {
    logger.warn(`Global config missing: ${configPath}`);
    ok = false;
  }

  try {
    const { config, errors } = loadConfig(process.cwd());
    for (const error of errors) logger.warn(error);
    if (errors.length > 0) ok = false;
    resolveSecrets(config);
    const enabledProviders = config.providers.filter((provider) => provider.enabled !== false);
    if (enabledProviders.length === 0) {
      logger.warn('No enabled providers');
      ok = false;
    } else {
      logger.info(`Enabled providers: ${enabledProviders.map((provider) => provider.type).join(', ')}`);
    }
  } catch (error) {
    logger.warn(`Config/env check failed: ${error instanceof Error ? error.message : String(error)}`);
    ok = false;
  }
  return ok ? 0 : 1;
}
