import { globalConfigPath } from '../config/paths.js';
export async function runConfig(_args, logger) {
    logger.info(`Global config: ${globalConfigPath()}`);
    logger.info('Project override: .cc-notifier.json');
    return 0;
}
//# sourceMappingURL=config.js.map