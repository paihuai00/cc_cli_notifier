import test from 'node:test';
import assert from 'node:assert/strict';
import { isInQuietHours } from '../src/notify/quiet-hours.js';
const base = {
    enabled: true,
    timezone: 'local',
    behavior: 'suppress',
};
test('quiet hours supports same-day ranges', () => {
    assert.equal(isInQuietHours({ ...base, ranges: [{ start: '09:00', end: '17:00' }] }, new Date(2024, 0, 1, 10, 0)), true);
    assert.equal(isInQuietHours({ ...base, ranges: [{ start: '09:00', end: '17:00' }] }, new Date(2024, 0, 1, 18, 0)), false);
});
test('quiet hours supports cross-midnight ranges', () => {
    const config = { ...base, ranges: [{ start: '22:00', end: '08:00' }] };
    assert.equal(isInQuietHours(config, new Date(2024, 0, 1, 23, 0)), true);
    assert.equal(isInQuietHours(config, new Date(2024, 0, 1, 7, 30)), true);
    assert.equal(isInQuietHours(config, new Date(2024, 0, 1, 12, 0)), false);
});
//# sourceMappingURL=quiet-hours.test.js.map