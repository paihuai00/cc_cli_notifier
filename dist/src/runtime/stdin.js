export async function readStdin() {
    const chunks = [];
    for await (const chunk of process.stdin) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
    }
    return Buffer.concat(chunks).toString('utf8');
}
export async function readJsonFromStdin() {
    const raw = await readStdin();
    if (!raw.trim())
        return {};
    return JSON.parse(raw);
}
//# sourceMappingURL=stdin.js.map