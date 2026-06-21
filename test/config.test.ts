import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runInit } from '../src/commands/init.js';
import { loadConfig, writeDefaultConfig } from '../src/config/load.js';
import type { Logger } from '../src/runtime/logger.js';

const originalHome = process.env.HOME;

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

test('init config preserves existing settings and prepends requested provider', () => {
  const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-notifier-test-'));
  process.env.HOME = tmpHome;
  try {
    const configDir = path.join(tmpHome, '.cc-notifier');
    fs.mkdirSync(configDir, { recursive: true });
    const configPath = path.join(configDir, 'config.json');
    fs.writeFileSync(configPath, JSON.stringify({
      notifyOn: ['Stop'],
      quietHours: { enabled: true, ranges: [{ start: '23:00', end: '07:00' }] },
      providers: [{ type: 'feishu', enabled: true, webhookUrl: 'env:OLD_FEISHU' }],
    }), 'utf8');

    writeDefaultConfig({ type: 'ruliu', envName: 'RULIU_BOT_WEBHOOK' });
    const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8')) as {
      notifyOn: string[];
      quietHours: { enabled: boolean };
      providers: Array<{ type: string }>;
    };
    assert.deepEqual(parsed.notifyOn, ['Stop', 'PermissionRequest']);
    assert.equal(parsed.quietHours.enabled, true);
    assert.equal(parsed.providers[0]?.type, 'ruliu');
    assert.equal(parsed.providers[1]?.type, 'feishu');
  } finally {
    if (originalHome === undefined) delete process.env.HOME;
    else process.env.HOME = originalHome;
    fs.rmSync(tmpHome, { recursive: true, force: true });
  }
});

test('init rejects webhook URL passed to --env', async () => {
  const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-notifier-test-'));
  const originalCwd = process.cwd();
  process.env.HOME = tmpHome;
  process.chdir(tmpHome);
  try {
    const { logger, messages } = createTestLogger();
    const exitCode = await runInit([
      '--provider',
      'ruliu',
      '--env',
      'https://apiin.im.baidu.com/api/msg/groupmsgsend?access_token=secret',
      '--yes',
    ], logger);

    assert.equal(exitCode, 1);
    assert.ok(messages.error.some((message) => message.includes('--env expects an environment variable name')));
    assert.equal(fs.existsSync(path.join(tmpHome, '.cc-notifier', 'config.json')), false);
    assert.equal(fs.existsSync(path.join(tmpHome, '.claude', 'settings.json')), false);
  } finally {
    process.chdir(originalCwd);
    if (originalHome === undefined) delete process.env.HOME;
    else process.env.HOME = originalHome;
    fs.rmSync(tmpHome, { recursive: true, force: true });
  }
});

test('loadConfig merges default Stop and PermissionRequest notifyOn events', () => {
  const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-notifier-test-'));
  const tmpProject = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-notifier-project-'));
  process.env.HOME = tmpHome;
  try {
    const configDir = path.join(tmpHome, '.cc-notifier');
    fs.mkdirSync(configDir, { recursive: true });
    fs.writeFileSync(path.join(configDir, 'config.json'), JSON.stringify({
      notifyOn: ['Stop'],
    }), 'utf8');
    fs.writeFileSync(path.join(tmpProject, '.cc-notifier.json'), JSON.stringify({
      notifyOn: ['Stop'],
    }), 'utf8');

    const { config, errors } = loadConfig(tmpProject);

    assert.deepEqual(errors, []);
    assert.deepEqual(config.notifyOn, ['Stop', 'PermissionRequest']);
  } finally {
    if (originalHome === undefined) delete process.env.HOME;
    else process.env.HOME = originalHome;
    fs.rmSync(tmpHome, { recursive: true, force: true });
    fs.rmSync(tmpProject, { recursive: true, force: true });
  }
});
