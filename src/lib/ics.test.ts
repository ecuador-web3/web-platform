import { describe, expect, it } from 'vitest';
import { icsDateToIso, parseIcs } from './ics';

/**
 * Trimmed from the live Ecuador Web3 feed, folding and all. The break inside
 * "Ho / sted by" is not a typo in this file — it is exactly how Luma emits the
 * line, and it is the reason unfolding is tested rather than assumed.
 */
const FEED = [
  'BEGIN:VCALENDAR',
  'VERSION:2.0',
  'PRODID:-//Luma//Personal//EN',
  'BEGIN:VEVENT',
  'DTSTART:20260729T010000Z',
  'DTEND:20260729T020000Z',
  'ORGANIZER;CN="Ecuador Web3":MAILTO:calendar-invite@lu.ma',
  'UID:evt-HHGKV88nsF0QdWR@events.lu.ma',
  'SUMMARY:Marca Personal en Web3',
  'DESCRIPTION:Get up-to-date information at: https://luma.com/ssjb5j47\\n\\nHo',
  ' sted by Ecuador Web3\\, Gelois o7 & Elizabeth Pacheco',
  'LOCATION:https://luma.com/event/evt-HHGKV88nsF0QdWR',
  'STATUS:TENTATIVE',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'DTSTART:20260812T003000Z',
  'DTEND:20260813T020000Z',
  'UID:evt-nIt0mPFIrtvPPhH@events.lu.ma',
  'SUMMARY:Workshop: Web3 desde Cero',
  'DESCRIPTION:Get up-to-date information at: https://luma.com/s5r5q74x',
  'LOCATION:https://luma.com/event/evt-nIt0mPFIrtvPPhH',
  'END:VEVENT',
  'END:VCALENDAR',
].join('\r\n');

describe('parseIcs', () => {
  it('reads every VEVENT and leaves calendar-level properties alone', () => {
    const events = parseIcs(FEED);
    expect(events).toHaveLength(2);
    expect(events.map((event) => event.summary)).toEqual([
      'Marca Personal en Web3',
      'Workshop: Web3 desde Cero',
    ]);
  });

  it('rejoins folded lines without leaving the fold space behind', () => {
    const [first] = parseIcs(FEED);
    expect(first.description).toContain('Hosted by');
    expect(first.description).not.toContain('Ho sted');
  });

  it('unescapes TEXT values', () => {
    const [first] = parseIcs(FEED);
    /* `\,` is a literal comma, and `\n\n` a paragraph break. */
    expect(first.description).toContain('Ecuador Web3, Gelois o7');
    expect(first.description).toContain('\n\n');
  });

  it('keeps a value containing a colon intact', () => {
    /* SUMMARY:Workshop: Web3 — only the first colon separates name from value. */
    expect(parseIcs(FEED)[1].summary).toBe('Workshop: Web3 desde Cero');
  });

  it('discards property parameters when keying', () => {
    const feed = [
      'BEGIN:VEVENT',
      'DTSTART;TZID=America/Guayaquil:20260812T193000',
      'SUMMARY:Con zona',
      'END:VEVENT',
    ].join('\r\n');
    expect(parseIcs(feed)[0].startsAt).toBe('2026-08-12T19:30:00-05:00');
  });

  it('converts UTC stamps to the same instant', () => {
    const [, workshop] = parseIcs(FEED);
    /* The hand-written value this feed replaced was 2026-08-11T19:30:00-05:00. */
    expect(Date.parse(workshop.startsAt)).toBe(Date.parse('2026-08-11T19:30:00-05:00'));
    expect(Date.parse(workshop.endsAt ?? '')).toBe(Date.parse('2026-08-12T21:00:00-05:00'));
  });

  it('drops a block with no usable start rather than throwing', () => {
    const feed = [
      'BEGIN:VEVENT',
      'DTSTART:whenever',
      'SUMMARY:Roto',
      'END:VEVENT',
      'BEGIN:VEVENT',
      'DTSTART:20260901T140000Z',
      'SUMMARY:Bueno',
      'END:VEVENT',
    ].join('\r\n');

    const events = parseIcs(feed);
    expect(events).toHaveLength(1);
    expect(events[0].summary).toBe('Bueno');
  });

  it('leaves endsAt undefined when the block has no DTEND', () => {
    const feed = ['BEGIN:VEVENT', 'DTSTART:20260901T140000Z', 'END:VEVENT'].join('\r\n');
    expect(parseIcs(feed)[0].endsAt).toBeUndefined();
  });

  it('returns nothing for an empty or eventless calendar', () => {
    expect(parseIcs('')).toEqual([]);
    expect(parseIcs('BEGIN:VCALENDAR\r\nEND:VCALENDAR')).toEqual([]);
  });

  it('handles bare LF endings as well as CRLF', () => {
    const feed = 'BEGIN:VEVENT\nDTSTART:20260901T140000Z\nSUMMARY:Solo LF\nEND:VEVENT';
    expect(parseIcs(feed)[0].summary).toBe('Solo LF');
  });
});

describe('icsDateToIso', () => {
  it('reads a UTC stamp', () => {
    expect(icsDateToIso('20260812T003000Z')).toBe('2026-08-12T00:30:00.000Z');
  });

  it('reads a floating stamp as Ecuador local time', () => {
    expect(icsDateToIso('20260812T193000')).toBe('2026-08-12T19:30:00-05:00');
  });

  it('reads an all-day date as Ecuador midnight', () => {
    expect(icsDateToIso('20260812')).toBe('2026-08-12T00:00:00-05:00');
  });

  it('returns null for anything else', () => {
    expect(icsDateToIso('')).toBeNull();
    expect(icsDateToIso('soon')).toBeNull();
    expect(icsDateToIso('2026-08-12')).toBeNull();
  });
});
