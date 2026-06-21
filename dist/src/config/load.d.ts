import { type CcNotifierConfig, type ProviderType } from './schema.js';
export declare function loadConfig(cwd?: string): {
    config: CcNotifierConfig;
    paths: string[];
    errors: string[];
};
export declare function mergeDefaultNotifyOn(config: CcNotifierConfig): CcNotifierConfig;
export declare function writeDefaultConfig(provider?: {
    type: ProviderType;
    envName: string;
}): string;
