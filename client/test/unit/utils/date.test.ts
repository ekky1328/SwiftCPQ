import { describe, it, expect } from 'vitest';
import { formatDate } from '../../../src/utils/date';

/**
 * Creates an ISO string that represents the given LOCAL date/time.
 * This keeps tests timezone-agnostic — the expected output always matches
 * the local hours/minutes used as input, regardless of the host's TZ setting.
 */
function localISO(year: number, month: number, day: number, hours: number, minutes: number): string {
  return new Date(year, month - 1, day, hours, minutes, 0, 0).toISOString();
}

describe('formatDate', () => {
  it('formats as YYYY-MM-DD HH:mm', () => {
    expect(formatDate(localISO(2025, 6, 15, 9, 5))).toBe('2025-06-15 09:05');
  });

  it('zero-pads single-digit month', () => {
    expect(formatDate(localISO(2025, 1, 3, 12, 0))).toBe('2025-01-03 12:00');
  });

  it('zero-pads single-digit day', () => {
    expect(formatDate(localISO(2025, 3, 5, 12, 30))).toBe('2025-03-05 12:30');
  });

  it('zero-pads single-digit hour', () => {
    expect(formatDate(localISO(2025, 11, 20, 8, 0))).toBe('2025-11-20 08:00');
  });

  it('zero-pads single-digit minute', () => {
    expect(formatDate(localISO(2025, 7, 4, 14, 7))).toBe('2025-07-04 14:07');
  });

  it('handles midnight (00:00)', () => {
    expect(formatDate(localISO(2025, 12, 31, 0, 0))).toBe('2025-12-31 00:00');
  });

  it('handles end of day (23:59)', () => {
    expect(formatDate(localISO(2025, 8, 1, 23, 59))).toBe('2025-08-01 23:59');
  });
});
