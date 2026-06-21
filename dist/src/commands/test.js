import { loadConfig } from '../config/load.js';
import { resolveSecrets } from '../config/secrets.js';
import { dispatchNotifications } from '../notify/dispatcher.js';
export async function runTest(_args, logger) {
    const { config, errors } = loadConfig(process.cwd());
    if (errors.length > 0) {
        for (const error of errors)
            logger.error(error);
        return 1;
    }
    const resolved = resolveSecrets(config);
    const event = {
        event: 'Stop',
        cwd: process.cwd(),
        projectName: process.cwd().split('/').filter(Boolean).at(-1) ?? 'project',
        timestamp: new Date().toISOString(),
        lastUserMessage: '测试 cc-notifier 通知',
        lastAssistantSummary: '已完成测试通知发送',
        hookPayload: {},
    };
    await dispatchNotifications(resolved, event, logger);
    return 0;
}
//# sourceMappingURL=test.js.map