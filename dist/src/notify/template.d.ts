import type { TemplateConfig } from '../config/schema.js';
import type { NotificationEvent } from './event.js';
export declare function renderTemplate(template: string, event: NotificationEvent): string;
export declare function renderNotification(template: TemplateConfig, event: NotificationEvent): {
    title: string;
    text: string;
};
