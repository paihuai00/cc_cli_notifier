import type { QuietHoursConfig } from '../config/schema.js';

function parseMinutes(value: string): number | undefined {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return undefined;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return undefined;
  return hours * 60 + minutes;
}

export function isInQuietHours(config: QuietHoursConfig, date = new Date()): boolean {
  if (!config.enabled) return false;
  const current = date.getHours() * 60 + date.getMinutes();
  for (const range of config.ranges) {
    const start = parseMinutes(range.start);
    const end = parseMinutes(range.end);
    if (start === undefined || end === undefined) continue;
    if (start === end) return true;
    if (start < end) {
      if (current >= start && current < end) return true;
    } else if (current >= start || current < end) {
      return true;
    }
  }
  return false;
}
