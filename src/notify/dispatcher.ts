import type { CcNotifierConfig, ProviderConfig } from '../config/schema.js';
import type { Logger } from '../runtime/logger.js';
import type { NotificationEvent } from './event.js';
import { renderNotification } from './template.js';
import { sendFeishu } from './providers/feishu.js';
import { sendRuliu } from './providers/ruliu.js';
import { sendWeCom } from './providers/wecom.js';
import { sendGenericWebhook } from './providers/webhook.js';

async function sendProvider(provider: ProviderConfig, event: NotificationEvent, rendered: { title: string; text: string }, signal: AbortSignal): Promise<void> {
  if (provider.type === 'feishu') return sendFeishu(provider, rendered, signal);
  if (provider.type === 'wecom') return sendWeCom(provider, rendered, signal);
  if (provider.type === 'ruliu') return sendRuliu(provider, rendered, signal);
  return sendGenericWebhook(provider, event, rendered, signal);
}

async function sendProviderWithTimeout(provider: ProviderConfig, event: NotificationEvent, rendered: { title: string; text: string }, timeoutMs: number): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    await sendProvider(provider, event, rendered, controller.signal);
  } catch (error) {
    if (controller.signal.aborted) throw new Error(`${provider.type} provider timed out after ${timeoutMs}ms`);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function dispatchNotifications(config: CcNotifierConfig, event: NotificationEvent, logger: Logger): Promise<void> {
  const enabledProviders = config.providers.filter((provider) => provider.enabled !== false);
  if (enabledProviders.length === 0) {
    logger.warn('No enabled providers configured');
    return;
  }
  const rendered = renderNotification(config.template, event);
  await Promise.all(enabledProviders.map(async (provider) => {
    const timeoutMs = provider.timeoutMs ?? 5000;
    try {
      await sendProviderWithTimeout(provider, event, rendered, timeoutMs);
      logger.info(`Sent notification via ${provider.type}`);
    } catch (error) {
      logger.warn(`Provider ${provider.type} failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }));
}
