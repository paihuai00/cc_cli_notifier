import type { CcNotifierConfig } from './schema.js';
export declare function deepMerge<T>(base: T, override: unknown): T;
export declare function mergeConfig(base: CcNotifierConfig, override: unknown): CcNotifierConfig;
