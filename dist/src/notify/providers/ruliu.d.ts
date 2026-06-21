import type { RuliuProviderConfig } from '../../config/schema.js';
export declare function sendRuliu(config: RuliuProviderConfig, rendered: {
    title: string;
    text: string;
}, signal?: AbortSignal): Promise<void>;
