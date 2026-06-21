import { uninstallHooks } from '../claude/settings.js';
export async function runUninstall(_args, logger) {
    const changed = uninstallHooks();
    logger.info(changed ? 'Removed cc-notifier Stop and PermissionRequest hooks' : 'No cc-notifier hooks found');
    return 0;
}
//# sourceMappingURL=uninstall.js.map