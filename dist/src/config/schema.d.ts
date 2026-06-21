export type ProviderType = 'feishu' | 'wecom' | 'webhook' | 'ruliu';
export interface BaseProviderConfig {
    type: ProviderType;
    enabled?: boolean;
    timeoutMs?: number;
}
export interface FeishuProviderConfig extends BaseProviderConfig {
    type: 'feishu';
    webhookUrl: string;
}
export interface WeComProviderConfig extends BaseProviderConfig {
    type: 'wecom';
    webhookUrl: string;
}
export interface GenericWebhookProviderConfig extends BaseProviderConfig {
    type: 'webhook';
    url: string;
}
export interface RuliuProviderConfig extends BaseProviderConfig {
    type: 'ruliu';
    webhookUrl: string;
}
export type ProviderConfig = FeishuProviderConfig | WeComProviderConfig | GenericWebhookProviderConfig | RuliuProviderConfig;
export interface SummaryConfig {
    enabled: boolean;
    maxUserChars: number;
    maxAssistantChars: number;
}
export interface QuietHoursRange {
    start: string;
    end: string;
}
export interface QuietHoursConfig {
    enabled: boolean;
    timezone: 'local' | string;
    ranges: QuietHoursRange[];
    behavior: 'suppress' | 'logOnly';
}
export interface DedupeConfig {
    enabled: boolean;
    windowSeconds: number;
}
export interface TemplateConfig {
    title: string;
    text: string;
}
export type NotifierEventName = 'Stop' | 'PermissionRequest';
export interface CcNotifierConfig {
    enabled: boolean;
    notifyOn: string[];
    summary: SummaryConfig;
    quietHours: QuietHoursConfig;
    dedupe: DedupeConfig;
    template: TemplateConfig;
    providers: ProviderConfig[];
}
export declare const defaultConfig: CcNotifierConfig;
export declare function validateConfig(config: CcNotifierConfig): string[];
