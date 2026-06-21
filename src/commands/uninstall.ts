import { uninstallHooks } from '../claude/settings.js';
import type { Logger } from '../runtime/logger.js';

export async function runUninstall(_args: string[], logger: Logger): Promise<number> {
  const changed = uninstallHooks();
  logger.info(changed ? 'Removed cc-notifier Stop and PermissionRequest hooks' : 'No cc-notifier hooks found');
  return 0;
}
