# cc-notifier

`cc-notifier` sends notifications for Claude Code `Stop` and `PermissionRequest` hooks..

## Quick start

```bash
npx cc-notifier init
export FEISHU_BOT_WEBHOOK="https://open.feishu.cn/open-apis/bot/v2/hook/..."
cc-notifier doctor
cc-notifier test
```

For Baidu IM / 如流 webhooks:

```bash
cc-notifier init --provider ruliu --env RULIU_BOT_WEBHOOK --yes
export RULIU_BOT_WEBHOOK="https://apiin.im.baidu.com/api/msg/groupmsgsend?access_token=..."
cc-notifier test
```

## Config files

- Global: `~/.cc-notifier/config.json`
- Project override: `.cc-notifier.json`

Secrets should be referenced with environment variables, for example:

```json
{
  "notifyOn": ["Stop", "PermissionRequest"],
  "providers": [
    {
      "type": "feishu",
      "enabled": true,
      "webhookUrl": "env:FEISHU_BOT_WEBHOOK"
    },
    {
      "type": "ruliu",
      "enabled": false,
      "webhookUrl": "env:RULIU_BOT_WEBHOOK"
    }
  ]
}
```

## Default messages

`Stop` keeps the completion template and reminds you that Claude is waiting for the next step:

```text
✅ Claude 完成：{{projectName}}

Project: {{projectName}}
Path: {{cwd}}

User:
{{lastUserMessage}}

Claude:
{{lastAssistantSummary}} 等待下一步
```

`PermissionRequest` sends only a safe summary, such as project, path, tool name, target file/path or a short command summary, and tells you to return to the terminal to confirm. It does not output `hookSpecificOutput`, does not wait for remote approval, and does not change Claude Code's original terminal permission flow.

If an existing `~/.cc-notifier/config.json` only has `"notifyOn": ["Stop"]`, running `cc-notifier init` again merges the new default `PermissionRequest` event into `notifyOn` without overwriting other config fields.

## Commands

```bash
cc-notifier init
cc-notifier uninstall
cc-notifier doctor
cc-notifier test
cc-notifier hook --event Stop|PermissionRequest
```

The hook command always exits `0` by default so notification failures do not block Claude Code.
# cc_cli_notifier
