import type { FeishuProviderConfig } from '../../config/schema.js';

export async function sendFeishu(config: FeishuProviderConfig, rendered: { title: string; text: string }, signal?: AbortSignal): Promise<void> {
  const init: RequestInit = {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      msg_type: 'text',
      content: { text: `${rendered.title}\n\n${rendered.text}` },
    }),
  };
  if (signal) init.signal = signal;
  const response = await fetch(config.webhookUrl, init);
  if (!response.ok) throw new Error(`feishu webhook returned ${response.status}`);
}
