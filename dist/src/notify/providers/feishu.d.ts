import type { FeishuProviderConfig } from '../../config/schema.js';
export declare function sendFeishu(config: FeishuProviderConfig, rendered: {
    title: string;
    text: string;
}, signal?: AbortSignal): Promise<void>;
