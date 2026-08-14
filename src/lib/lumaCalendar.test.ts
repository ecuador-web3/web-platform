import { describe, expect, it } from 'vitest';
import type { IcsEvent } from './ics';
import {
  fromIcs,
  hostsFrom,
  publicEventUrl,
  recentAll,
  sessionsFrom,
  upcomingAll,
  upcomingFrom,
  type ScheduledEvent,
} from './lumaCalendar';

const AT = (iso: string) => Date.parse(iso);

const ics = (over: Partial<IcsEvent> & Pick<IcsEvent, 'startsAt'>): IcsEvent => ({
  uid: 'evt-test@events.lu.ma',
  summary: 'Evento',
  description: '',
  location: '',
  ...over,
});

const ev = (
  over: Partial<ScheduledEvent> & Pick<ScheduledEvent, 'title' | 'startsAt'>,
): ScheduledEvent => ({ hosts: [], unnamedHosts: 0, ...over });

const MARCA = ev({
  title: 'Marca Personal en Web3',
  startsAt: '2026-07-29T01:00:00.000Z',
  endsAt: '2026-07-29T02:00:00.000Z',
});

const METEORA = ev({
  title: 'Clase de LP en Meteora',
  startsAt: '2026-07-30T01:00:00.000Z',
  endsAt: '2026-07-30T02:00:00.000Z',
});

const WORKSHOP = ev({
  title: 'Workshop: Web3 desde Cero',
  startsAt: '2026-08-12T00:30:00.000Z',
  endsAt: '2026-08-13T02:00:00.000Z',
  url: 'https://luma.com/s5r5q74x',
});

/* The live calendar, as it stands. */
const FEED = [WORKSHOP, METEORA, MARCA];

describe('upcomingFrom', () => {
  it('picks the soonest event still ahead', () => {
    const state = upcomingFrom(FEED, AT('2026-07-01T00:00:00Z'));
    expect(state.status === 'scheduled' && state.event.title).toBe('Marca Personal en Web3');
  });

  it('keeps an event that has begun but not ended', () => {
    expect(upcomingFrom([WORKSHOP], AT('2026-08-12T01:00:00Z')).status).toBe('scheduled');
  });

  it('drops an event once it has ended', () => {
    expect(upcomingFrom([WORKSHOP], AT('2026-08-13T02:00:01Z')).status).toBe('none');
  });

  it('falls back to the start when there is no end', () => {
    const open = ev({ title: 'Abierto', startsAt: '2026-09-01T14:00:00.000Z' });
    expect(upcomingFrom([open], AT('2026-09-01T13:59:00Z')).status).toBe('scheduled');
    expect(upcomingFrom([open], AT('2026-09-01T14:00:01Z')).status).toBe('none');
  });

  it('reports none when every event is in the past, which is the live state today', () => {
    expect(upcomingFrom(FEED, AT('2026-12-01T00:00:00Z')).status).toBe('none');
    expect(upcomingFrom([], Date.now())).toEqual({ status: 'none' });
  });
});

describe('upcomingAll', () => {
  it('returns everything ahead, soonest first, ignoring source order', () => {
    expect(upcomingAll(FEED, AT('2026-07-01T00:00:00Z')).map((e) => e.title)).toEqual([
      'Marca Personal en Web3',
      'Clase de LP en Meteora',
      'Workshop: Web3 desde Cero',
    ]);
  });

  it('narrows as the clock moves', () => {
    expect(upcomingAll(FEED, AT('2026-07-29T12:00:00Z')).map((e) => e.title)).toEqual([
      'Clase de LP en Meteora',
      'Workshop: Web3 desde Cero',
    ]);
  });
});

describe('recentAll', () => {
  it('returns finished events most recent first', () => {
    expect(recentAll(FEED, AT('2026-12-01T00:00:00Z')).map((e) => e.title)).toEqual([
      'Workshop: Web3 desde Cero',
      'Clase de LP en Meteora',
      'Marca Personal en Web3',
    ]);
  });

  it('is empty when nothing has happened yet', () => {
    expect(recentAll(FEED, AT('2026-01-01T00:00:00Z'))).toEqual([]);
  });

  it('never overlaps with upcomingAll', () => {
    const now = AT('2026-07-30T01:30:00Z');
    const ahead = upcomingAll(FEED, now).map((e) => e.title);
    const behind = recentAll(FEED, now).map((e) => e.title);
    expect(ahead.filter((t) => behind.includes(t))).toEqual([]);
    expect(ahead.length + behind.length).toBe(FEED.length);
  });
});

describe('sessionsFrom', () => {
  it('skips the first upcoming event, which the ticket already shows', () => {
    const state = sessionsFrom(FEED, AT('2026-07-01T00:00:00Z'));
    expect(state.status).toBe('upcoming');
    expect(state.status !== 'none' && state.events.map((e) => e.title)).toEqual([
      'Clase de LP en Meteora',
      'Workshop: Web3 desde Cero',
    ]);
  });

  it('falls back to recent sessions once nothing is left ahead', () => {
    const state = sessionsFrom(FEED, AT('2026-12-01T00:00:00Z'));
    expect(state.status).toBe('recent');
    expect(state.status !== 'none' && state.events).toHaveLength(3);
  });

  it('falls back when the only upcoming event is the one on the ticket', () => {
    const state = sessionsFrom(FEED, AT('2026-08-01T00:00:00Z'));
    expect(state.status).toBe('recent');
    expect(state.status !== 'none' && state.events.map((e) => e.title)).toEqual([
      'Clase de LP en Meteora',
      'Marca Personal en Web3',
    ]);
  });

  it('reports none for a calendar with nothing on it', () => {
    expect(sessionsFrom([], Date.now())).toEqual({ status: 'none' });
  });

  it('honours the limit in both directions', () => {
    const ahead = sessionsFrom(FEED, AT('2026-07-01T00:00:00Z'), 1);
    expect(ahead.status !== 'none' && ahead.events.map((e) => e.title)).toEqual([
      'Clase de LP en Meteora',
    ]);

    const behind = sessionsFrom(FEED, AT('2026-12-01T00:00:00Z'), 2);
    expect(behind.status !== 'none' && behind.events).toHaveLength(2);
  });
});

describe('fromIcs', () => {
  const WORKSHOP_ICS = ics({
    summary: 'Workshop: Web3 desde Cero',
    startsAt: '2026-08-12T00:30:00.000Z',
    endsAt: '2026-08-13T02:00:00.000Z',
    description:
      'Get up-to-date information at: https://luma.com/s5r5q74x\n\nHosted by Ecuador Web3 & 4 others',
    location: 'https://luma.com/event/evt-nIt0mPFIrtvPPhH',
  });

  it('carries schedule, link and hosts across', () => {
    const [event] = fromIcs([WORKSHOP_ICS]);
    expect(event.title).toBe('Workshop: Web3 desde Cero');
    expect(event.startsAt).toBe('2026-08-12T00:30:00.000Z');
    expect(event.endsAt).toBe('2026-08-13T02:00:00.000Z');
    expect(event.url).toBe('https://luma.com/s5r5q74x');
    expect(event.hosts).toEqual(['Ecuador Web3']);
    expect(event.unnamedHosts).toBe(4);
  });

  it('leaves cover art and virtuality absent rather than guessing them', () => {
    /* The feed carries neither. Absent is a state the templates handle; a
       guessed `false` would render as a positive claim. */
    const [event] = fromIcs([WORKSHOP_ICS]);
    expect(event.coverUrl).toBeUndefined();
    expect(event.isVirtual).toBeUndefined();
  });
});

describe('hostsFrom', () => {
  it('splits a named list on commas and the ampersand', () => {
    expect(hostsFrom('Hosted by Ecuador Web3, Gelois o7 & Elizabeth Pacheco')).toEqual({
      names: ['Ecuador Web3', 'Gelois o7', 'Elizabeth Pacheco'],
      unnamed: 0,
    });
  });

  it('counts the collapsed tail instead of naming it "4 others"', () => {
    expect(hostsFrom('Hosted by Ecuador Web3 & 4 others')).toEqual({
      names: ['Ecuador Web3'],
      unnamed: 4,
    });
  });

  it('handles a single unnamed host', () => {
    expect(hostsFrom('Hosted by Ecuador Web3 & 1 other')).toEqual({
      names: ['Ecuador Web3'],
      unnamed: 1,
    });
  });

  it('returns nothing when the line is absent', () => {
    expect(hostsFrom('')).toEqual({ names: [], unnamed: 0 });
    expect(hostsFrom('Get up-to-date information at: https://luma.com/x')).toEqual({
      names: [],
      unnamed: 0,
    });
  });
});

describe('publicEventUrl', () => {
  const base = ics({ startsAt: '2026-08-12T00:30:00.000Z' });

  it('prefers the short link in the description', () => {
    expect(
      publicEventUrl({ ...base, description: 'at: https://luma.com/s5r5q74x', location: 'x' }),
    ).toBe('https://luma.com/s5r5q74x');
  });

  it('falls back to LOCATION when the description has no link', () => {
    expect(
      publicEventUrl({
        ...base,
        description: 'Hosted by Ecuador Web3',
        location: 'https://luma.com/event/evt-nIt0mPFIrtvPPhH',
      }),
    ).toBe('https://luma.com/event/evt-nIt0mPFIrtvPPhH');
  });

  it('does not mistake the canonical /event/ link for the short one', () => {
    expect(
      publicEventUrl({
        ...base,
        description: 'See https://luma.com/event/evt-nIt0mPFIrtvPPhH for details',
        location: 'https://luma.com/event/evt-nIt0mPFIrtvPPhH',
      }),
    ).toBe('https://luma.com/event/evt-nIt0mPFIrtvPPhH');
  });

  it('refuses a dangerous scheme rather than putting it in an href', () => {
    expect(
      publicEventUrl({ ...base, description: 'javascript:alert(1)', location: 'javascript:alert(1)' }),
    ).toBeUndefined();
  });

  it('returns undefined when the feed carries no link at all', () => {
    expect(publicEventUrl(base)).toBeUndefined();
  });
});
