import type { CcNotifierConfig } from '../config/schema.js';
import type { Logger } from '../runtime/logger.js';
import type { NotificationEvent } from './event.js';
export declare function dispatchNotifications(config: CcNotifierConfig, event: NotificationEvent, logger: Logger): Promise<void>;
