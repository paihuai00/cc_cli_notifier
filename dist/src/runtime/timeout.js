export async function withTimeout(promise, timeoutMs, label) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await Promise.race([
            promise,
            new Promise((_, reject) => {
                controller.signal.addEventListener('abort', () => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), { once: true });
            }),
        ]);
    }
    finally {
        clearTimeout(timeout);
    }
}
//# sourceMappingURL=timeout.js.map