import type { GenericWebhookProviderConfig } from '../../config/schema.js';
import type { NotificationEvent } from '../event.js';
export declare function sendGenericWebhook(config: GenericWebhookProviderConfig, event: NotificationEvent, rendered: {
    title: string;
    text: string;
}, signal?: AbortSignal): Promise<void>;
