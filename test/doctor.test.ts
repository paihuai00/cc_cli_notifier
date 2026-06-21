import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runDoctor } from '../src/commands/doctor.js';
import type { Logger } from '../src/runtime/logger.js';

function createTestLogger() {
  const messages = {
    info: [] as string[],
    warn: [] as string[],
    error: [] as string[],
    debug: [] as string[],
  };
  const logger: Logger = {
    info(message) { messages.info.push(message); },
    warn(message) { messages.warn.push(message); },
    error(message) { messages.error.push(message); },
    debug(message) { messages.debug.push(message); },
  };
  return { logger, messages };
}

test('doctor warns when installed cc-notifier hook script path is missing', async () => {
  const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-notifier-doctor-'));
  const missingScriptPath = path.join(tmpHome, 'moved-notifier', 'bin', 'cc-notifier.js');
  const originalHome = process.env.HOME;
  const originalCwd = process.cwd();
  process.env.HOME = tmpHome;
  process.chdir(tmpHome);
  try {
    const settingsPath = path.join(tmpHome, '.claude', 'settings.json');
    fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
    fs.writeFileSync(settingsPath, JSON.stringify({
      hooks: {
        Stop: [
          { hooks: [{ type: 'command', command: `${process.execPath} ${JSON.stringify(missingScriptPath)} hook --event Stop` }] },
        ],
        PermissionRequest: [
          { matcher: '*', hooks: [{ type: 'command', command: `${process.execPath} ${JSON.stringify(missingScriptPath)} hook --event PermissionRequest` }] },
        ],
      },
    }), 'utf8');

    const configPath = path.join(tmpHome, '.cc-notifier', 'config.json');
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify({
      providers: [{ type: 'webhook', enabled: true, url: 'https://example.com/webhook' }],
    }), 'utf8');

    const { logger, messages } = createTestLogger();
    const exitCode = await runDoctor([], logger);

    assert.equal(exitCode, 1);
    assert.ok(messages.warn.some((message) => message.includes('Stop hook script path does not exist')));
    assert.ok(messages.warn.some((message) => message.includes('PermissionRequest hook script path does not exist')));
    assert.ok(messages.warn.every((message) => !message.includes('hookSpecificOutput')));
  } finally {
    process.chdir(originalCwd);
    if (originalHome === undefined) delete process.env.HOME;
    else process.env.HOME = originalHome;
    fs.rmSync(tmpHome, { recursive: true, force: true });
  }
});

test('doctor accepts cc-notifier hook command resolved from PATH without stale-path warning', async () => {
  const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-notifier-doctor-'));
  const originalHome = process.env.HOME;
  const originalCwd = process.cwd();
  process.env.HOME = tmpHome;
  process.chdir(tmpHome);
  try {
    const settingsPath = path.join(tmpHome, '.claude', 'settings.json');
    fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
    fs.writeFileSync(settingsPath, JSON.stringify({
      hooks: {
        Stop: [
          { hooks: [{ type: 'command', command: 'cc-notifier hook --event Stop' }] },
        ],
        PermissionRequest: [
          { matcher: '*', hooks: [{ type: 'command', command: 'cc-notifier hook --event PermissionRequest' }] },
        ],
      },
    }), 'utf8');

    const configPath = path.join(tmpHome, '.cc-notifier', 'config.json');
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify({
      providers: [{ type: 'webhook', enabled: true, url: 'https://example.com/webhook' }],
    }), 'utf8');

    const { logger, messages } = createTestLogger();
    const exitCode = await runDoctor([], logger);

    assert.equal(exitCode, 0);
    assert.ok(messages.warn.every((message) => !message.includes('hook script path does not exist')));
  } finally {
    process.chdir(originalCwd);
    if (originalHome === undefined) delete process.env.HOME;
    else process.env.HOME = originalHome;
    fs.rmSync(tmpHome, { recursive: true, force: true });
  }
});
