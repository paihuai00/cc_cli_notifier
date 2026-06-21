interface PermissionSummary {
    toolName: string;
    permissionSummary: string;
    permissionTarget?: string;
    permissionContent?: string;
}
export declare function buildPermissionSummary(payload: Record<string, unknown>): PermissionSummary;
export {};
