import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export function homePath(...parts: string[]): string {
  return path.join(os.homedir(), ...parts);
}

export function globalConfigPath(): string {
  return homePath('.cc-notifier', 'config.json');
}

export function dedupeStatePath(): string {
  return homePath('.cc-notifier', 'state', 'dedupe.json');
}

export function claudeSettingsPath(): string {
  return homePath('.claude', 'settings.json');
}

export function findProjectConfig(startCwd: string | undefined): string | undefined {
  if (!startCwd) return undefined;
  let current = path.resolve(startCwd);
  while (true) {
    const candidate = path.join(current, '.cc-notifier.json');
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(current);
    if (parent === current) return undefined;
    current = parent;
  }
}

export function projectNameFromCwd(cwd: string | undefined): string {
  if (!cwd) return 'unknown-project';
  return path.basename(cwd) || cwd;
}
