import type { GenericWebhookProviderConfig } from '../../config/schema.js';
import type { NotificationEvent } from '../event.js';

function safeEventPayload(event: NotificationEvent): Omit<NotificationEvent, 'hookPayload'> {
  const { hookPayload: _hookPayload, ...safeEvent } = event;
  return safeEvent;
}

export async function sendGenericWebhook(config: GenericWebhookProviderConfig, event: NotificationEvent, rendered: { title: string; text: string }, signal?: AbortSignal): Promise<void> {
  const init: RequestInit = {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ title: rendered.title, text: rendered.text, event: safeEventPayload(event) }),
  };
  if (signal) init.signal = signal;
  const response = await fetch(config.url, init);
  if (!response.ok) throw new Error(`generic webhook returned ${response.status}`);
}
