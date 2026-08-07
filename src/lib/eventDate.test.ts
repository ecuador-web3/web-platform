import { describe, expect, it } from 'vitest';
import { ConfigError } from './errors';
import { formatEventDate, formatEventDateShort, formatEventTime } from './eventDate';

const SUMMIT = '2026-09-22T09:00:00-05:00';

describe('event date formatting', () => {
  it('prints the long form in Spanish', () => {
    expect(formatEventDate(SUMMIT)).toBe('22 de septiembre de 2026');
  });

  it('prints a three-letter month so the ticket columns stay even', () => {
    /* Spanish abbreviates September as "sept", a character wider than every
       other month, which breaks the four-column grid. */
    expect(formatEventDateShort(SUMMIT)).toBe('22 SEP');
    expect(formatEventDateShort('2026-03-14T09:00:00-05:00')).toBe('14 MAR');
    expect(formatEventDateShort('2026-12-01T09:00:00-05:00')).toBe('01 DIC');
  });

  it('prints 24-hour time', () => {
    expect(formatEventTime(SUMMIT)).toBe('09:00');
    expect(formatEventTime('2026-09-22T19:30:00-05:00')).toBe('19:30');
  });

  it('reads the instant in Ecuador time, not the runtime zone', () => {
    /* 02:00 UTC on the 23rd is still 21:00 on the 22nd in Guayaquil. */
    expect(formatEventDateShort('2026-09-23T02:00:00Z')).toBe('22 SEP');
    expect(formatEventTime('2026-09-23T02:00:00Z')).toBe('21:00');
  });

  it('agrees across equivalent spellings of the same instant', () => {
    expect(formatEventDate('2026-09-22T14:00:00Z')).toBe(formatEventDate(SUMMIT));
  });

  it('rejects an unparseable date in every formatter', () => {
    expect(() => formatEventDate('not a date')).toThrow(ConfigError);
    expect(() => formatEventDateShort('not a date')).toThrow(ConfigError);
    expect(() => formatEventTime('not a date')).toThrow(ConfigError);
  });
});
