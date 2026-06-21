import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { inspectInstalledHook, installHooks, uninstallHooks } from '../src/claude/settings.js';
test('installHooks installs Stop and PermissionRequest hooks idempotently', () => {
    const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-notifier-settings-'));
    const settingsPath = path.join(tmpHome, '.claude', 'settings.json');
    try {
        const first = installHooks(settingsPath);
        const second = installHooks(settingsPath);
        assert.equal(first.changed, true);
        assert.equal(second.changed, false);
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        assert.equal(settings.hooks.Stop?.length, 1);
        assert.equal(settings.hooks.PermissionRequest?.length, 1);
        assert.equal(settings.hooks.PermissionRequest?.[0]?.matcher, '*');
        assert.match(settings.hooks.Stop?.[0]?.hooks[0]?.command ?? '', /hook --event Stop/);
        assert.match(settings.hooks.PermissionRequest?.[0]?.hooks[0]?.command ?? '', /hook --event PermissionRequest/);
        assert.equal(settings.hooks.PermissionRequest?.[0]?.hooks[0]?.timeout, 5);
    }
    finally {
        fs.rmSync(tmpHome, { recursive: true, force: true });
    }
});
test('inspectInstalledHook reports whether installed local script path exists', () => {
    const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-notifier-settings-'));
    const settingsPath = path.join(tmpHome, '.claude', 'settings.json');
    const scriptPath = path.join(tmpHome, 'bin with spaces', 'cc-notifier.js');
    const command = `${process.execPath} ${JSON.stringify(scriptPath)} hook --event Stop`;
    try {
        fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
        fs.mkdirSync(path.dirname(scriptPath), { recursive: true });
        fs.writeFileSync(scriptPath, '#!/usr/bin/env node\n', 'utf8');
        fs.writeFileSync(settingsPath, JSON.stringify({
            hooks: {
                Stop: [
                    { hooks: [{ type: 'command', command }] },
                ],
            },
        }), 'utf8');
        assert.deepEqual(inspectInstalledHook('Stop', settingsPath), {
            command,
            scriptPath,
            scriptPathExists: true,
        });
        fs.rmSync(scriptPath, { force: true });
        assert.deepEqual(inspectInstalledHook('Stop', settingsPath), {
            command,
            scriptPath,
            scriptPathExists: false,
        });
    }
    finally {
        fs.rmSync(tmpHome, { recursive: true, force: true });
    }
});
test('inspectInstalledHook does not treat cc-notifier on PATH as stale script path', () => {
    const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-notifier-settings-'));
    const settingsPath = path.join(tmpHome, '.claude', 'settings.json');
    const command = 'cc-notifier hook --event Stop';
    try {
        fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
        fs.writeFileSync(settingsPath, JSON.stringify({
            hooks: {
                Stop: [
                    { hooks: [{ type: 'command', command }] },
                ],
            },
        }), 'utf8');
        assert.deepEqual(inspectInstalledHook('Stop', settingsPath), { command });
    }
    finally {
        fs.rmSync(tmpHome, { recursive: true, force: true });
    }
});
test('uninstallHooks removes only cc-notifier supported hooks', () => {
    const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), 'cc-notifier-settings-'));
    const settingsPath = path.join(tmpHome, '.claude', 'settings.json');
    try {
        fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
        fs.writeFileSync(settingsPath, JSON.stringify({
            hooks: {
                Stop: [
                    { hooks: [{ type: 'command', command: 'other-tool hook --event Stop' }] },
                    { hooks: [{ type: 'command', command: 'cc-notifier hook --event Stop' }] },
                ],
                PermissionRequest: [
                    { matcher: '*', hooks: [{ type: 'command', command: 'cc-notifier hook --event PermissionRequest' }] },
                ],
            },
        }), 'utf8');
        assert.equal(uninstallHooks(settingsPath), true);
        const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        assert.ok(settings.hooks.Stop);
        assert.equal(settings.hooks.PermissionRequest, undefined);
    }
    finally {
        fs.rmSync(tmpHome, { recursive: true, force: true });
    }
});
//# sourceMappingURL=settings.test.js.map