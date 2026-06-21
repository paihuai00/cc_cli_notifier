import fs from 'node:fs';
import path from 'node:path';
import { claudeSettingsPath } from '../config/paths.js';
import type { NotifierEventName } from '../config/schema.js';

interface HookCommand {
  type?: string;
  command?: string;
  timeout?: number;
}

interface HookEntry {
  matcher?: string;
  hooks?: HookCommand[];
}

interface ClaudeSettings {
  hooks?: Record<string, HookEntry[]>;
  [key: string]: unknown;
}

export const SUPPORTED_HOOK_EVENTS: NotifierEventName[] = ['Stop', 'PermissionRequest'];
const HOOK_TIMEOUT_SECONDS = 5;

export interface InstalledHookDiagnostic {
  command: string;
  scriptPath?: string;
  scriptPathExists?: boolean;
}

function readSettings(filePath = claudeSettingsPath()): ClaudeSettings {
  if (!fs.existsSync(filePath)) return {};
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as ClaudeSettings;
}

function writeSettings(settings: ClaudeSettings, filePath = claudeSettingsPath()): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(settings, null, 2)}\n`, 'utf8');
}

export function buildHookCommand(eventName: NotifierEventName = 'Stop'): string {
  return `${process.execPath} ${JSON.stringify(path.resolve(process.argv[1] ?? ''))} hook --event ${eventName}`;
}

function commandLooksLikeCcNotifier(command: string): boolean {
  const tokens = splitCommand(command);
  const executable = tokens[0];
  const scriptPath = extractHookScriptPath(command);
  const currentScriptPath = path.resolve(process.argv[1] ?? '');

  return tokens.includes('cc-notifier')
    || executable === 'cc-notifier'
    || scriptPath?.endsWith('cc-notifier.js') === true
    || scriptPath === currentScriptPath;
}

function isCcNotifierCommand(command: string | undefined, eventName?: NotifierEventName): boolean {
  if (!command || !command.includes('hook') || !commandLooksLikeCcNotifier(command)) return false;
  if (eventName && !command.includes(eventName)) return false;
  return SUPPORTED_HOOK_EVENTS.some((event) => command.includes(event));
}

function splitCommand(command: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let quote: 'single' | 'double' | undefined;
  let escaped = false;

  for (const char of command.trim()) {
    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }

    if (char === '\\' && quote !== 'single') {
      escaped = true;
      continue;
    }

    if (quote === 'single') {
      if (char === "'") quote = undefined;
      else current += char;
      continue;
    }

    if (quote === 'double') {
      if (char === '"') quote = undefined;
      else current += char;
      continue;
    }

    if (char === "'") {
      quote = 'single';
      continue;
    }

    if (char === '"') {
      quote = 'double';
      continue;
    }

    if (/\s/.test(char)) {
      if (current) {
        tokens.push(current);
        current = '';
      }
      continue;
    }

    current += char;
  }

  if (escaped) current += '\\';
  if (current) tokens.push(current);
  return tokens;
}

function shouldCheckHookPath(candidate: string): boolean {
  return path.isAbsolute(candidate)
    || candidate.includes('/')
    || candidate.includes('\\')
    || candidate.endsWith('.js')
    || /^\.{1,2}($|[/\\])/.test(candidate);
}

function extractHookScriptPath(command: string): string | undefined {
  const tokens = splitCommand(command);
  const hookIndex = tokens.findIndex((token) => token === 'hook');
  if (hookIndex === -1) return undefined;

  const beforeHook = hookIndex > 0 ? tokens[hookIndex - 1] : undefined;
  if (beforeHook && shouldCheckHookPath(beforeHook)) return beforeHook;

  const executable = tokens[0];
  if (executable && shouldCheckHookPath(executable)) return executable;
  return undefined;
}

export function backupSettings(filePath = claudeSettingsPath()): string | undefined {
  if (!fs.existsSync(filePath)) return undefined;
  const backupPath = `${filePath}.cc-notifier.bak.${new Date().toISOString().replace(/[:.]/g, '-')}`;
  fs.copyFileSync(filePath, backupPath);
  return backupPath;
}

function hookEntryFor(eventName: NotifierEventName, command: string): HookEntry {
  const hook: HookCommand = { type: 'command', command, timeout: HOOK_TIMEOUT_SECONDS };
  if (eventName === 'PermissionRequest') return { matcher: '*', hooks: [hook] };
  return { hooks: [hook] };
}

export function installHooks(filePath = claudeSettingsPath()): { changed: boolean; backupPath?: string } {
  const settings = readSettings(filePath);
  const hooks = settings.hooks ?? {};
  let changed = false;

  for (const eventName of SUPPORTED_HOOK_EVENTS) {
    const entries = hooks[eventName] ?? [];
    const exists = entries.some((entry) => entry.hooks?.some((hook) => isCcNotifierCommand(hook.command, eventName)));
    if (!exists) {
      entries.push(hookEntryFor(eventName, buildHookCommand(eventName)));
      hooks[eventName] = entries;
      changed = true;
    }
  }

  settings.hooks = hooks;
  if (!changed) {
    writeSettings(settings, filePath);
    return { changed: false };
  }

  const backupPath = backupSettings(filePath);
  writeSettings(settings, filePath);
  return backupPath ? { changed: true, backupPath } : { changed: true };
}

export function installStopHook(command = buildHookCommand('Stop'), filePath = claudeSettingsPath()): { changed: boolean; backupPath?: string } {
  const settings = readSettings(filePath);
  const hooks = settings.hooks ?? {};
  const stopEntries = hooks.Stop ?? [];
  const exists = stopEntries.some((entry) => entry.hooks?.some((hook) => isCcNotifierCommand(hook.command, 'Stop')));
  if (exists) {
    settings.hooks = hooks;
    writeSettings(settings, filePath);
    return { changed: false };
  }

  const backupPath = backupSettings(filePath);
  stopEntries.push(hookEntryFor('Stop', command));
  hooks.Stop = stopEntries;
  settings.hooks = hooks;
  writeSettings(settings, filePath);
  return backupPath ? { changed: true, backupPath } : { changed: true };
}

export function uninstallHooks(filePath = claudeSettingsPath()): boolean {
  const settings = readSettings(filePath);
  const hooks = settings.hooks ?? {};
  let changed = false;

  for (const eventName of SUPPORTED_HOOK_EVENTS) {
    const entries = hooks[eventName] ?? [];
    const nextEntries = entries
      .map((entry) => ({ ...entry, hooks: entry.hooks?.filter((hook) => !isCcNotifierCommand(hook.command, eventName)) ?? [] }))
      .filter((entry) => entry.hooks.length > 0);

    const eventChanged = nextEntries.length !== entries.length
      || nextEntries.some((entry, index) => entry.hooks.length !== (entries[index]?.hooks?.length ?? 0));
    if (eventChanged) {
      changed = true;
      if (nextEntries.length > 0) hooks[eventName] = nextEntries;
      else delete hooks[eventName];
    }
  }

  if (!changed) return false;
  settings.hooks = hooks;
  writeSettings(settings, filePath);
  return true;
}

export function uninstallStopHook(filePath = claudeSettingsPath()): boolean {
  const settings = readSettings(filePath);
  const hooks = settings.hooks ?? {};
  const stopEntries = hooks.Stop ?? [];
  const nextEntries = stopEntries
    .map((entry) => ({ ...entry, hooks: entry.hooks?.filter((hook) => !isCcNotifierCommand(hook.command, 'Stop')) ?? [] }))
    .filter((entry) => entry.hooks.length > 0);

  if (nextEntries.length === stopEntries.length && nextEntries.every((entry, index) => entry.hooks.length === (stopEntries[index]?.hooks?.length ?? 0))) {
    return false;
  }

  if (nextEntries.length > 0) hooks.Stop = nextEntries;
  else delete hooks.Stop;
  settings.hooks = hooks;
  writeSettings(settings, filePath);
  return true;
}

export function findInstalledHook(eventName: NotifierEventName = 'Stop', filePath = claudeSettingsPath()): string | undefined {
  return inspectInstalledHook(eventName, filePath)?.command;
}

export function inspectInstalledHook(eventName: NotifierEventName = 'Stop', filePath = claudeSettingsPath()): InstalledHookDiagnostic | undefined {
  const settings = readSettings(filePath);
  const entries = settings.hooks?.[eventName] ?? [];
  for (const entry of entries) {
    for (const hook of entry.hooks ?? []) {
      const command = hook.command;
      if (!command || !isCcNotifierCommand(command, eventName)) continue;
      const scriptPath = extractHookScriptPath(command);
      if (!scriptPath) return { command };
      return { command, scriptPath, scriptPathExists: fs.existsSync(scriptPath) };
    }
  }
  return undefined;
}
