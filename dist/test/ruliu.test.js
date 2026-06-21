import test from 'node:test';
import assert from 'node:assert/strict';
import { sendRuliu } from '../src/notify/providers/ruliu.js';
test('ruliu provider sends message card body and checks errcode', async () => {
    const calls = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url, init) => {
        calls.push({ url: String(url), init: init });
        return new Response(JSON.stringify({ errcode: 0, errmsg: 'ok' }), { status: 200 });
    };
    try {
        await sendRuliu({ type: 'ruliu', enabled: true, webhookUrl: 'https://apiin.im.baidu.com/api/msg/groupmsgsend?access_token=token' }, { title: 'Claude 完成', text: 'Claude:\n已完成，等待下一步' });
        assert.equal(calls.length, 1);
        const body = JSON.parse(String(calls[0]?.init.body));
        assert.equal(body.message.header.title, 'Claude 完成');
        assert.equal(body.message.header.template, 'blue');
        assert.equal(body.message.body[0]?.type, 'TEXT');
        assert.match(body.message.body[0]?.content ?? '', /等待下一步/);
    }
    finally {
        globalThis.fetch = originalFetch;
    }
});
test('ruliu provider treats non-zero errcode as failure', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => new Response(JSON.stringify({ errcode: 40000, errmsg: '请求参数错误' }), { status: 200 });
    try {
        await assert.rejects(sendRuliu({ type: 'ruliu', enabled: true, webhookUrl: 'https://apiin.im.baidu.com/api/msg/groupmsgsend?access_token=token' }, { title: 'Claude 完成', text: 'test' }), /errcode 40000/);
    }
    finally {
        globalThis.fetch = originalFetch;
    }
});
//# sourceMappingURL=ruliu.test.js.map