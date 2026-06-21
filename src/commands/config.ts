import { globalConfigPath } from '../config/paths.js';
import type { Logger } from '../runtime/logger.js';

export async function runConfig(_args: string[], logger: Logger): Promise<number> {
  logger.info(`Global config: ${globalConfigPath()}`);
  logger.info('Project override: .cc-notifier.json');
  return 0;
}
