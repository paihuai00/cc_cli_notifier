export async function sendFeishu(config, rendered, signal) {
    const init = {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
            msg_type: 'text',
            content: { text: `${rendered.title}\n\n${rendered.text}` },
        }),
    };
    if (signal)
        init.signal = signal;
    const response = await fetch(config.webhookUrl, init);
    if (!response.ok)
        throw new Error(`feishu webhook returned ${response.status}`);
}
//# sourceMappingURL=feishu.js.map