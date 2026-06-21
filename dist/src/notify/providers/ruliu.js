function buildRuliuBody(rendered) {
    return {
        message: {
            header: {
                title: rendered.title,
                template: 'blue',
            },
            body: [
                {
                    type: 'TEXT',
                    content: rendered.text,
                },
            ],
        },
    };
}
export async function sendRuliu(config, rendered, signal) {
    const init = {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            accept: 'application/json',
        },
        body: JSON.stringify(buildRuliuBody(rendered)),
    };
    if (signal)
        init.signal = signal;
    const response = await fetch(config.webhookUrl, init);
    const text = await response.text();
    if (!response.ok)
        throw new Error(`ruliu webhook returned HTTP ${response.status}: ${text.slice(0, 200)}`);
    let parsed;
    try {
        parsed = text ? JSON.parse(text) : undefined;
    }
    catch {
        // Some webhook endpoints return an empty body on success. Treat unparsable
        // successful HTTP responses as success unless they include text.
        if (text.trim())
            throw new Error(`ruliu webhook returned non-JSON response: ${text.slice(0, 200)}`);
    }
    if (parsed && typeof parsed.errcode === 'number' && parsed.errcode !== 0) {
        throw new Error(`ruliu webhook returned errcode ${parsed.errcode}: ${parsed.errmsg ?? 'unknown error'}`);
    }
}
//# sourceMappingURL=ruliu.js.map