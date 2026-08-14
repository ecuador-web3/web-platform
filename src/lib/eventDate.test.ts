import { describe, expect, it } from 'vitest';
import { ConfigError } from './errors';
import {
  formatEventDate,
  formatEventDateRange,
  formatEventDateShort,
  formatEventTime,
  formatEventWeekday,
  formatEventWeekdayRange,
} from './eventDate';

/* The live two-day workshop: 11 Aug 19:30 through 12 Aug 21:00, Ecuador time. */
const WORKSHOP_START = '2026-08-12T00:30:00.000Z';
const WORKSHOP_END = '2026-08-13T02:00:00.000Z';

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

  it('prints a three-letter weekday for the session cells', () => {
    /* 22 Sep 2026 is a Tuesday; "miércoles" is the one that needs truncating. */
    expect(formatEventWeekday(SUMMIT)).toBe('MAR');
    expect(formatEventWeekday('2026-09-23T09:00:00-05:00')).toBe('MIÉ');
    expect(formatEventWeekday('2026-09-26T09:00:00-05:00')).toBe('SÁB');
  });

  it('reads the weekday in Ecuador time rather than the build machine zone', () => {
    /* 02:00 UTC on the 23rd is still the evening of Tuesday the 22nd here. */
    expect(formatEventWeekday('2026-09-23T02:00:00Z')).toBe('MAR');
  });
});

describe('formatEventWeekdayRange', () => {
  it('gives one weekday when there is no end', () => {
    expect(formatEventWeekdayRange(SUMMIT)).toBe('MAR');
  });

  it('gives one weekday when the event starts and ends the same day', () => {
    expect(formatEventWeekdayRange(SUMMIT, '2026-09-22T18:00:00-05:00')).toBe('MAR');
  });

  it('spans two weekdays for the two-day workshop', () => {
    expect(formatEventWeekdayRange(WORKSHOP_START, WORKSHOP_END)).toBe('MAR–MIÉ');
  });

  it('agrees with the date range about how many days the event covers', () => {
    /* These two print stacked in the same cell. "11–12 AGO" over a lone "MAR"
       would read as a two-day event happening entirely on the Tuesday. */
    const cases: [string, string | undefined][] = [
      [SUMMIT, undefined],
      [SUMMIT, '2026-09-22T18:00:00-05:00'],
      [WORKSHOP_START, WORKSHOP_END],
      ['2026-08-30T14:00:00-05:00', '2026-09-02T14:00:00-05:00'],
    ];

    for (const [start, end] of cases) {
      const spansDays = formatEventDateRange(start, end).includes('–');
      expect(formatEventWeekdayRange(start, end).includes('–')).toBe(spansDays);
    }
  });

  it('counts a session crossing midnight as two days, matching the printed date', () => {
    /* 22:00 to 00:30 is one evening but two calendar squares, and the date
       range already says so. */
    const start = '2026-09-22T22:00:00-05:00';
    const end = '2026-09-23T00:30:00-05:00';
    expect(formatEventDateRange(start, end)).toBe('22–23 SEP');
    expect(formatEventWeekdayRange(start, end)).toBe('MAR–MIÉ');
  });

  it('prints a same-month range for multi-day workshops', () => {
    expect(
      formatEventDateRange('2026-08-11T19:30:00-05:00', '2026-08-12T21:00:00-05:00'),
    ).toBe('11–12 AGO');
  });

  it('falls back to the short form when there is no end date', () => {
    expect(formatEventDateRange(SUMMIT)).toBe('22 SEP');
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
