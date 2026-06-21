import { extractTranscriptSummary } from '../claude/transcript.js';
import { loadConfig } from '../config/load.js';
import { projectNameFromCwd } from '../config/paths.js';
import { resolveSecrets } from '../config/secrets.js';
import { dispatchNotifications } from '../notify/dispatcher.js';
import { shouldSendAndRecord } from '../notify/dedupe.js';
import { getStringField, isRecord } from '../notify/event.js';
import { buildPermissionSummary } from '../notify/permission.js';
import { isInQuietHours } from '../notify/quiet-hours.js';
import { readJsonFromStdin } from '../runtime/stdin.js';
function argValue(args, name) {
    const index = args.indexOf(name);
    return index >= 0 ? args[index + 1] : undefined;
}
function normalizeHookPayload(payload) {
    return isRecord(payload) ? payload : {};
}
function isSupportedEventName(eventName) {
    return eventName === 'Stop' || eventName === 'PermissionRequest';
}
function buildBaseEvent(eventName, hookPayload, cwd, sessionId) {
    const event = {
        event: eventName,
        cwd,
        projectName: projectNameFromCwd(cwd),
        timestamp: new Date().toISOString(),
        hookPayload,
    };
    if (sessionId)
        event.sessionId = sessionId;
    return event;
}
export async function runHook(args, logger) {
    let hookPayload = {};
    try {
        hookPayload = normalizeHookPayload(await readJsonFromStdin());
    }
    catch (error) {
        logger.warn(`Invalid hook JSON, skipping notification: ${error instanceof Error ? error.message : String(error)}`);
        return 0;
    }
    const cliEvent = argValue(args, '--event');
    const payloadEvent = getStringField(hookPayload, 'hook_event_name') ?? getStringField(hookPayload, 'event');
    const eventName = payloadEvent ?? cliEvent;
    if (!isSupportedEventName(eventName)) {
        logger.debug(`Ignoring unsupported event: ${eventName ?? 'unknown'}`);
        return 0;
    }
    const sessionId = getStringField(hookPayload, 'session_id') ?? getStringField(hookPayload, 'sessionId');
    const cwd = getStringField(hookPayload, 'cwd') ?? process.cwd();
    let loadedConfig;
    try {
        loadedConfig = loadConfig(cwd);
    }
    catch (error) {
        logger.warn(`Config loading failed: ${error instanceof Error ? error.message : String(error)}`);
        return 0;
    }
    const { config, errors } = loadedConfig;
    if (errors.length > 0) {
        for (const error of errors)
            logger.warn(error);
        return 0;
    }
    if (!config.enabled || !config.notifyOn.includes(eventName)) {
        logger.debug(`${eventName} notifications disabled by config`);
        return 0;
    }
    let resolvedConfig;
    try {
        resolvedConfig = resolveSecrets(config);
    }
    catch (error) {
        logger.warn(`Secret resolution failed: ${error instanceof Error ? error.message : String(error)}`);
        return 0;
    }
    if (isInQuietHours(resolvedConfig.quietHours)) {
        logger.info('Quiet hours active; notification suppressed');
        return 0;
    }
    const event = buildBaseEvent(eventName, hookPayload, cwd, sessionId);
    if (eventName === 'Stop') {
        const summaryOptions = { hookPayload, cwd, config: resolvedConfig.summary };
        if (sessionId)
            summaryOptions.sessionId = sessionId;
        const summary = extractTranscriptSummary(summaryOptions);
        if (summary.transcriptPath)
            event.transcriptPath = summary.transcriptPath;
        if (summary.lastUserMessage)
            event.lastUserMessage = summary.lastUserMessage;
        if (summary.lastAssistantSummary)
            event.lastAssistantSummary = summary.lastAssistantSummary;
    }
    else {
        const permission = buildPermissionSummary(hookPayload);
        event.toolName = permission.toolName;
        event.permissionSummary = permission.permissionSummary;
        if (permission.permissionTarget)
            event.permissionTarget = permission.permissionTarget;
        if (permission.permissionContent)
            event.permissionContent = permission.permissionContent;
    }
    if (!shouldSendAndRecord(event, resolvedConfig.dedupe)) {
        logger.info('Duplicate notification suppressed');
        return 0;
    }
    await dispatchNotifications(resolvedConfig, event, logger);
    return 0;
}
//# sourceMappingURL=hook.js.map