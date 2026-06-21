import type { WeComProviderConfig } from '../../config/schema.js';
export declare function sendWeCom(config: WeComProviderConfig, rendered: {
    title: string;
    text: string;
}, signal?: AbortSignal): Promise<void>;
