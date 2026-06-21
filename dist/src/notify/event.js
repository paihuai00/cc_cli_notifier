export function isRecord(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
export function getStringField(record, key) {
    const value = record[key];
    return typeof value === 'string' && value.length > 0 ? value : undefined;
}
//# sourceMappingURL=event.js.map