# cc-notifier

`cc-notifier` is a small Claude Code hook notifier. It sends notifications when Claude Code finishes a turn (`Stop`) or asks for tool permission (`PermissionRequest`).

Supported providers:

- Feishu bot webhook
- WeCom bot webhook
- Baidu IM / 如流 webhook
- Generic webhook

## Requirements

- Node.js 18+
- Claude Code with hook support
- A bot/webhook URL from one of the supported providers

## Install

For Claude Code hooks, global installation is recommended:

```bash
npm install -g cc-notifier
```

> `npx cc-notifier init` is not recommended for hook installation because hooks may capture a temporary `npx` cache path. Use a global install for a stable command path.

## Quick start

### Feishu

```bash
npm install -g cc-notifier
cc-notifier init --provider feishu --env FEISHU_BOT_WEBHOOK
export FEISHU_BOT_WEBHOOK="https://open.feishu.cn/open-apis/bot/v2/hook/..."
cc-notifier doctor
cc-notifier test
```

### Baidu IM / 如流

```bash
npm install -g cc-notifier
cc-notifier init --provider ruliu --env RULIU_BOT_WEBHOOK
export RULIU_BOT_WEBHOOK="https://apiin.im.baidu.com/api/msg/groupmsgsend?access_token=..."
cc-notifier doctor
cc-notifier test
```

`--env` expects the environment variable name (`RULIU_BOT_WEBHOOK`), not the webhook URL itself.

### WeCom

```bash
npm install -g cc-notifier
cc-notifier init --provider wecom --env WECOM_BOT_WEBHOOK
export WECOM_BOT_WEBHOOK="https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=..."
cc-notifier doctor
cc-notifier test
```

### Generic webhook

```bash
npm install -g cc-notifier
cc-notifier init --provider webhook --env GENERIC_WEBHOOK_URL
export GENERIC_WEBHOOK_URL="https://example.com/webhook"
cc-notifier doctor
cc-notifier test
```

`cc-notifier test` sends a real test notification to enabled providers.

## Persist webhook environment variables

Shell `export` only affects the current terminal session. To persist your webhook URL, add it to your shell startup file.

For zsh:

```bash
echo 'export FEISHU_BOT_WEBHOOK="https://open.feishu.cn/open-apis/bot/v2/hook/..."' >> ~/.zshrc
source ~/.zshrc
```

For bash:

```bash
echo 'export FEISHU_BOT_WEBHOOK="https://open.feishu.cn/open-apis/bot/v2/hook/..."' >> ~/.bashrc
source ~/.bashrc
```

For fish:

```bash
set -Ux FEISHU_BOT_WEBHOOK "https://open.feishu.cn/open-apis/bot/v2/hook/..."
```

## What `init` changes

`cc-notifier init` does two things:

1. Writes or merges the global config at:

   ```text
   ~/.cc-notifier/config.json
   ```

2. Installs Claude Code hooks into:

   ```text
   ~/.claude/settings.json
   ```

It preserves unrelated Claude Code settings and hooks.

## Config files

`cc-notifier` loads config from:

1. Built-in defaults
2. Global config: `~/.cc-notifier/config.json`
3. Project override: `.cc-notifier.json`, searched upward from the hook working directory

Project config overrides global config. Arrays replace arrays, while objects are deep-merged.

Example global config:

```json
{
  "enabled": true,
  "notifyOn": ["Stop", "PermissionRequest"],
  "summary": {
    "enabled": true,
    "maxUserChars": 120,
    "maxAssistantChars": 240
  },
  "quietHours": {
    "enabled": false,
    "timezone": "local",
    "ranges": [{ "start": "22:00", "end": "08:00" }],
    "behavior": "suppress"
  },
  "dedupe": {
    "enabled": true,
    "windowSeconds": 300
  },
  "template": {
    "title": "✅ Claude 完成：{{projectName}}",
    "text": "Project: {{projectName}}\nPath: {{cwd}}\n\nUser:\n{{lastUserMessage}}\n\nClaude:\n{{lastAssistantSummary}} 等待下一步"
  },
  "providers": [
    {
      "type": "feishu",
      "enabled": true,
      "webhookUrl": "env:FEISHU_BOT_WEBHOOK"
    }
  ]
}
```

Secrets should usually be referenced through environment variables using the `env:NAME` syntax. Avoid committing real webhook URLs to project repositories.

When running `cc-notifier init`, pass the environment variable name to `--env`, not the URL:

```bash
# Correct
export RULIU_BOT_WEBHOOK="https://apiin.im.baidu.com/api/msg/groupmsgsend?access_token=..."
cc-notifier init --provider ruliu --env RULIU_BOT_WEBHOOK

# Incorrect
cc-notifier init --provider ruliu --env "https://apiin.im.baidu.com/api/msg/groupmsgsend?access_token=..."
```

## Change webhook or provider

To change only the webhook URL, update the environment variable:

```bash
export FEISHU_BOT_WEBHOOK="https://open.feishu.cn/open-apis/bot/v2/hook/new-token"
cc-notifier doctor
```

To switch or add a provider, run `init` again:

```bash
cc-notifier init --provider ruliu --env RULIU_BOT_WEBHOOK
```

To edit config manually:

```bash
cc-notifier config
vim ~/.cc-notifier/config.json
```

## Commands

```bash
cc-notifier init [--provider feishu|wecom|ruliu|webhook --env ENV_NAME] [--yes]
cc-notifier uninstall
cc-notifier doctor
cc-notifier test
cc-notifier config
cc-notifier hook --event Stop|PermissionRequest
```

### `doctor`

Checks whether:

- Claude Code hooks are installed
- Hook script paths still exist
- Global config exists
- Required webhook environment variables are set
- At least one provider is enabled

If `doctor` reports a stale hook path after moving or reinstalling the package, run:

```bash
cc-notifier init
```

### `uninstall`

Removes only `cc-notifier` hooks from Claude Code settings. It preserves unrelated hooks.

```bash
cc-notifier uninstall
```

## Notification behavior

### `Stop`

Sends the completion template and, when available, includes a short summary from the Claude Code transcript:

```text
✅ Claude 完成：{{projectName}}

Project: {{projectName}}
Path: {{cwd}}

User:
{{lastUserMessage}}

Claude:
{{lastAssistantSummary}} 等待下一步
```

### `PermissionRequest`

Sends a safe summary of the permission request, such as project, path, tool name, target file/path, or a short command summary.

It intentionally does **not**:

- include raw hook payloads
- output `hookSpecificOutput`
- approve or deny permissions remotely
- change Claude Code's original terminal permission flow

You still need to return to the terminal to approve or deny the request.

## Development

```bash
npm install
npm run build
npm run check
npm test
```

Run local CLI smoke checks after building:

```bash
node bin/cc-notifier.js --help
node bin/cc-notifier.js config
node bin/cc-notifier.js doctor
```

Inspect the package contents before publishing:

```bash
npm pack --dry-run
```

## Publish

Before publishing:

```bash
npm run check
npm test
npm pack --dry-run
```

Then publish to npm:

```bash
npm publish --registry=https://registry.npmjs.org
```

## License

MIT
