import type { NotifierEventName } from '../config/schema.js';
export declare const SUPPORTED_HOOK_EVENTS: NotifierEventName[];
export interface InstalledHookDiagnostic {
    command: string;
    scriptPath?: string;
    scriptPathExists?: boolean;
}
export declare function buildHookCommand(eventName?: NotifierEventName): string;
export declare function backupSettings(filePath?: string): string | undefined;
export declare function installHooks(filePath?: string): {
    changed: boolean;
    backupPath?: string;
};
export declare function installStopHook(command?: string, filePath?: string): {
    changed: boolean;
    backupPath?: string;
};
export declare function uninstallHooks(filePath?: string): boolean;
export declare function uninstallStopHook(filePath?: string): boolean;
export declare function findInstalledHook(eventName?: NotifierEventName, filePath?: string): string | undefined;
export declare function inspectInstalledHook(eventName?: NotifierEventName, filePath?: string): InstalledHookDiagnostic | undefined;
