function isPlainObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
export function deepMerge(base, override) {
    if (!isPlainObject(base) || !isPlainObject(override)) {
        return (override === undefined ? base : override);
    }
    const result = { ...base };
    for (const [key, value] of Object.entries(override)) {
        const existing = result[key];
        if (Array.isArray(value)) {
            result[key] = value;
        }
        else if (isPlainObject(existing) && isPlainObject(value)) {
            result[key] = deepMerge(existing, value);
        }
        else if (value !== undefined) {
            result[key] = value;
        }
    }
    return result;
}
export function mergeConfig(base, override) {
    return deepMerge(base, override);
}
//# sourceMappingURL=merge.js.map