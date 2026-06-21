export declare function homePath(...parts: string[]): string;
export declare function globalConfigPath(): string;
export declare function dedupeStatePath(): string;
export declare function claudeSettingsPath(): string;
export declare function findProjectConfig(startCwd: string | undefined): string | undefined;
export declare function projectNameFromCwd(cwd: string | undefined): string;
