import type { DedupeConfig } from '../config/schema.js';
import type { NotificationEvent } from './event.js';
export declare function dedupeKey(event: NotificationEvent): string;
export declare function shouldSendAndRecord(event: NotificationEvent, config: DedupeConfig, nowMs?: number): boolean;
