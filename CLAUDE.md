# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

`cc-notifier` is a Node.js/TypeScript CLI package that installs Claude Code hooks and sends notifications for `Stop` and `PermissionRequest` events to Feishu, WeCom, or a generic webhook.

The published CLI entry is `bin/cc-notifier.js`, which imports the compiled ESM entrypoint from `dist/src/cli.js`. Source code lives in `src/`, and tests live in `test/`; compiled JavaScript, declarations, and source maps are emitted to `dist/`.

## Common commands

```bash
npm install
npm run build      # compile TypeScript to dist/
npm run check      # type-check without emitting
npm test           # build, then run all compiled node:test tests
```

Run a single test file by building first, then invoking Node's built-in test runner against the compiled file:

```bash
npm run build
node --test dist/test/config.test.js
```

For local CLI smoke checks after a build:

```bash
node bin/cc-notifier.js --help
node bin/cc-notifier.js config
node bin/cc-notifier.js doctor
```

`cc-notifier test` sends a real test notification using the configured providers, so only run it when the relevant webhook environment variables are set and an external notification is intended.

## Runtime configuration and hooks

- Global config path: `~/.cc-notifier/config.json`
- Project override path: `.cc-notifier.json`, discovered by walking upward from the hook `cwd`
- Claude Code settings path modified by install/uninstall commands: `~/.claude/settings.json`
- Supported hook events are defined in `src/claude/settings.ts` as `Stop` and `PermissionRequest`

`cc-notifier init` writes/merges the global config and installs both Claude Code hooks. Existing config fields are preserved by `src/config/merge.ts`; arrays from overrides replace base arrays, except `notifyOn` is later normalized to include the default events.

Provider secrets may be literal URLs or `env:NAME` references. `src/config/secrets.ts` resolves `env:` values at runtime and fails the config check if required environment variables are missing.

## Architecture notes

- `src/cli.ts` is the command dispatcher for `init`, `uninstall`, `doctor`, `test`, `hook`, and `config`.
- Command implementations live under `src/commands/` and should keep command-line parsing lightweight.
- Config loading starts from `defaultConfig` in `src/config/schema.ts`, then merges global config and project override in `src/config/load.ts`.
- Claude settings hook installation/removal is centralized in `src/claude/settings.ts`; it preserves unrelated hooks and only adds/removes cc-notifier commands for supported events.
- Hook execution flows through `src/commands/hook.ts`: read hook JSON from stdin, determine the event, load and validate config, resolve secrets, apply quiet-hours and dedupe checks, build a safe notification event, then dispatch providers.
- Stop notifications can include a short transcript summary from `src/claude/transcript.ts`, inferred from Claude's `~/.claude/projects/.../<sessionId>.jsonl` files unless the hook payload provides a transcript path.
- PermissionRequest notifications are intentionally summarized by `src/notify/permission.ts`; they redact sensitive-looking values, trim commands to the first line, strip URL query/fragment data, and do not include raw hook payloads.
- Rendering is in `src/notify/template.ts`. Stop uses configurable templates; PermissionRequest uses a fixed safe template telling the user to return to the terminal.
- `src/notify/dispatcher.ts` renders once and sends concurrently to enabled providers, applying each provider's `timeoutMs` or a 5000ms default.
- Provider integrations are in `src/notify/providers/`: Feishu text message, WeCom markdown message, and generic webhook JSON payload without raw `hookPayload`.

## Testing notes

The test suite uses Node's built-in `node:test` and imports TypeScript source paths that compile to `dist/test/*.js`. Tests often override `process.env.HOME` and create temporary config/settings directories; restore environment variables in `finally` blocks when adding similar tests.
