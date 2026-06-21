export async function sendWeCom(config, rendered, signal) {
    const init = {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
            msgtype: 'markdown',
            markdown: { content: `**${rendered.title}**\n\n${rendered.text}` },
        }),
    };
    if (signal)
        init.signal = signal;
    const response = await fetch(config.webhookUrl, init);
    if (!response.ok)
        throw new Error(`wecom webhook returned ${response.status}`);
}
//# sourceMappingURL=wecom.js.map