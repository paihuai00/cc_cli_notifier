import test from 'node:test';
import assert from 'node:assert/strict';
import { renderNotification } from '../src/notify/template.js';
import { buildPermissionSummary } from '../src/notify/permission.js';
const template = {
    title: '✅ Claude 完成：{{projectName}}',
    text: 'User:\n{{lastUserMessage}}\n\nClaude:\n{{lastAssistantSummary}} 等待下一步',
};
test('renders default wait-for-next-step template', () => {
    const rendered = renderNotification(template, {
        event: 'Stop',
        projectName: 'MioIsland-main',
        timestamp: '2026-06-19T00:00:00.000Z',
        lastUserMessage: '分析链路',
        lastAssistantSummary: '已完成 CodeLight / iPhone 推送链路分析...',
        hookPayload: {},
    });
    assert.equal(rendered.title, '✅ Claude 完成：MioIsland-main');
    assert.match(rendered.text, /Claude:\n已完成 CodeLight \/ iPhone 推送链路分析\.\.\. 等待下一步/);
});
test('renders PermissionRequest template with safe permission summary', () => {
    const hookPayload = {
        hook_event_name: 'PermissionRequest',
        cwd: '/tmp/project',
        tool_name: 'Bash',
        tool_input: {
            command: 'npm test -- --runInBand\ncat secret.txt',
            description: 'run tests',
        },
    };
    const permission = buildPermissionSummary(hookPayload);
    const event = {
        event: 'PermissionRequest',
        projectName: 'project',
        cwd: '/tmp/project',
        timestamp: '2026-06-19T00:00:00.000Z',
        hookPayload,
        toolName: permission.toolName,
        permissionSummary: permission.permissionSummary,
    };
    const rendered = renderNotification(template, permission.permissionContent ? { ...event, permissionContent: permission.permissionContent } : event);
    assert.equal(rendered.title, 'Claude 权限请求：project');
    assert.match(rendered.text, /Tool: Bash/);
    assert.match(rendered.text, /Summary: Bash 请求执行命令/);
    assert.match(rendered.text, /Request: npm test -- --runInBand/);
    assert.match(rendered.text, /请回到终端确认。/);
    assert.doesNotMatch(rendered.text, /secret\.txt/);
});
test('redacts and trims PermissionRequest URL targets', () => {
    const permission = buildPermissionSummary({
        hook_event_name: 'PermissionRequest',
        tool_name: 'WebFetch',
        tool_input: {
            url: 'https://example.test/path/to/resource?token=secret-token#fragment',
        },
    });
    assert.equal(permission.permissionTarget, 'https://example.test/path/to/resource');
    assert.doesNotMatch(permission.permissionSummary, /secret-token|fragment/);
});
//# sourceMappingURL=template.test.js.map