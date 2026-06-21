function safeEventPayload(event) {
    const { hookPayload: _hookPayload, ...safeEvent } = event;
    return safeEvent;
}
export async function sendGenericWebhook(config, event, rendered, signal) {
    const init = {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title: rendered.title, text: rendered.text, event: safeEventPayload(event) }),
    };
    if (signal)
        init.signal = signal;
    const response = await fetch(config.url, init);
    if (!response.ok)
        throw new Error(`generic webhook returned ${response.status}`);
}
//# sourceMappingURL=webhook.js.map