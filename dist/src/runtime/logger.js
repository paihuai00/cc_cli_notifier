import { redact } from './redact.js';
export function createLogger(debugEnabled = false) {
    return {
        info(message) {
            process.stderr.write(`[cc-notifier] ${redact(message)}\n`);
        },
        warn(message) {
            process.stderr.write(`[cc-notifier] WARN ${redact(message)}\n`);
        },
        error(message) {
            process.stderr.write(`[cc-notifier] ERROR ${redact(message)}\n`);
        },
        debug(message) {
            if (debugEnabled)
                process.stderr.write(`[cc-notifier] DEBUG ${redact(message)}\n`);
        },
    };
}
//# sourceMappingURL=logger.js.map