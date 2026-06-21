import type { NotifierEventName } from '../config/schema.js';
export interface NotificationEvent {
    event: NotifierEventName;
    sessionId?: string;
    cwd?: string;
    projectName: string;
    timestamp: string;
    transcriptPath?: string;
    lastUserMessage?: string;
    lastAssistantSummary?: string;
    toolName?: string;
    permissionSummary?: string;
    permissionTarget?: string;
    permissionContent?: string;
    hookPayload: Record<string, unknown>;
}
export declare function isRecord(value: unknown): value is Record<string, unknown>;
export declare function getStringField(record: Record<string, unknown>, key: string): string | undefined;
