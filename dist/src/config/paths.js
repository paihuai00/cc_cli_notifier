import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
export function homePath(...parts) {
    return path.join(os.homedir(), ...parts);
}
export function globalConfigPath() {
    return homePath('.cc-notifier', 'config.json');
}
export function dedupeStatePath() {
    return homePath('.cc-notifier', 'state', 'dedupe.json');
}
export function claudeSettingsPath() {
    return homePath('.claude', 'settings.json');
}
export function findProjectConfig(startCwd) {
    if (!startCwd)
        return undefined;
    let current = path.resolve(startCwd);
    while (true) {
        const candidate = path.join(current, '.cc-notifier.json');
        if (fs.existsSync(candidate))
            return candidate;
        const parent = path.dirname(current);
        if (parent === current)
            return undefined;
        current = parent;
    }
}
export function projectNameFromCwd(cwd) {
    if (!cwd)
        return 'unknown-project';
    return path.basename(cwd) || cwd;
}
//# sourceMappingURL=paths.js.map