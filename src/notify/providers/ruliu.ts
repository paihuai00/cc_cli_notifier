import type { RuliuProviderConfig } from '../../config/schema.js';

interface RuliuResponse {
  errcode?: number;
  errmsg?: string;
  [key: string]: unknown;
}

function buildRuliuBody(rendered: { title: string; text: string }): { message: { header: { title: string; template: string }; body: Array<{ type: 'TEXT'; content: string }> } } {
  return {
    message: {
      header: {
        title: rendered.title,
        template: 'blue',
      },
      body: [
        {
          type: 'TEXT',
          content: rendered.text,
        },
      ],
    },
  };
}

export async function sendRuliu(config: RuliuProviderConfig, rendered: { title: string; text: string }, signal?: AbortSignal): Promise<void> {
  const init: RequestInit = {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify(buildRuliuBody(rendered)),
  };
  if (signal) init.signal = signal;
  const response = await fetch(config.webhookUrl, init);
  const text = await response.text();
  if (!response.ok) throw new Error(`ruliu webhook returned HTTP ${response.status}: ${text.slice(0, 200)}`);

  let parsed: RuliuResponse | undefined;
  try {
    parsed = text ? JSON.parse(text) as RuliuResponse : undefined;
  } catch {
    // Some webhook endpoints return an empty body on success. Treat unparsable
    // successful HTTP responses as success unless they include text.
    if (text.trim()) throw new Error(`ruliu webhook returned non-JSON response: ${text.slice(0, 200)}`);
  }

  if (parsed && typeof parsed.errcode === 'number' && parsed.errcode !== 0) {
    throw new Error(`ruliu webhook returned errcode ${parsed.errcode}: ${parsed.errmsg ?? 'unknown error'}`);
  }
}
