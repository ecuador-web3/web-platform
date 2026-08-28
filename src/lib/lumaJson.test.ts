import { describe, expect, it } from 'vitest';
import { parseLumaEntries } from './lumaJson';

/** One entry from the live `calendar/get-items` response, trimmed to the fields
    that are read. The shape, including the nesting, is verbatim. */
const ENTRY = {
  guest_count: 29,
  hosts: [
    { api_id: 'usr-o6TVX5LxWIxx2x2', name: 'Ecuador Web3' },
    { api_id: 'usr-B1Bx4Z7TdT8NBSX', name: 'Gelois o7' },
    { api_id: 'usr-aXt40O3VUtBwanV', name: 'Santiago Hermoza' },
  ],
  event: {
    api_id: 'evt-lt5130rggZwsoIV',
    name: 'Clase de LP en Meteora',
    start_at: '2026-07-30T01:00:00.000Z',
    end_at: '2026-07-30T02:00:00.000Z',
    url: 'vtgxfvo1',
    cover_url: 'https://images.lumacdn.com/uploads/uw/944ef5fa.jpg',
    location_type: 'meet',
    geo_address_info: null,
    coordinate: null,
    timezone: 'America/Guayaquil',
  },
};

const payload = (...entries: unknown[]) => ({ entries });

describe('parseLumaEntries', () => {
  it('reads the fields the site renders', () => {
    const [event] = parseLumaEntries(payload(ENTRY));

    expect(event.title).toBe('Clase de LP en Meteora');
    expect(event.startsAt).toBe('2026-07-30T01:00:00.000Z');
    expect(event.endsAt).toBe('2026-07-30T02:00:00.000Z');
    expect(event.url).toBe('https://luma.com/vtgxfvo1');
    expect(event.coverUrl).toBe('https://images.lumacdn.com/uploads/uw/944ef5fa.jpg');
  });

  it('names every host, with nothing left uncounted', () => {
    const [event] = parseLumaEntries(payload(ENTRY));
    expect(event.hosts).toEqual(['Ecuador Web3', 'Gelois o7', 'Santiago Hermoza']);
    expect(event.unnamedHosts).toBe(0);
  });

  describe('virtuality', () => {
    it('treats no address and no coordinate as virtual', () => {
      expect(parseLumaEntries(payload(ENTRY))[0].isVirtual).toBe(true);
    });

    it('treats a physical address as not virtual, whatever location_type says', () => {
      const inPerson = {
        ...ENTRY,
        event: {
          ...ENTRY.event,
          location_type: 'unknown',
          geo_address_info: { address: 'ESPOL, Guayaquil' },
        },
      };
      expect(parseLumaEntries(payload(inPerson))[0].isVirtual).toBe(false);
    });

    it('treats a coordinate alone as not virtual', () => {
      const pinned = {
        ...ENTRY,
        event: { ...ENTRY.event, coordinate: { latitude: -2.1, longitude: -79.9 } },
      };
      expect(parseLumaEntries(payload(pinned))[0].isVirtual).toBe(false);
    });

    it('stays virtual for an unknown location_type, which is how Luma leaves an unset field', () => {
      const unset = { ...ENTRY, event: { ...ENTRY.event, location_type: 'unknown' } };
      expect(parseLumaEntries(payload(unset))[0].isVirtual).toBe(true);
    });
  });

  describe('rejects what it cannot render', () => {
    it('drops an entry with no name or no start, keeping the rest', () => {
      const events = parseLumaEntries(
        payload(
          { ...ENTRY, event: { ...ENTRY.event, name: '' } },
          { ...ENTRY, event: { ...ENTRY.event, start_at: 'whenever' } },
          ENTRY,
        ),
      );
      expect(events.map((e) => e.title)).toEqual(['Clase de LP en Meteora']);
    });

    it('drops an unparseable end rather than carrying it through', () => {
      const odd = { ...ENTRY, event: { ...ENTRY.event, end_at: 'later' } };
      expect(parseLumaEntries(payload(odd))[0].endsAt).toBeUndefined();
    });

    it('refuses a slug that would build a URL pointing elsewhere', () => {
      /* `safeExternalUrl` only checks the scheme, so the slug is pattern-checked
         before it is interpolated rather than after. */
      for (const url of ['../../evil', 'a/b', 'x?y=z', 'javascript:alert(1)']) {
        const hostile = { ...ENTRY, event: { ...ENTRY.event, url } };
        expect(parseLumaEntries(payload(hostile))[0].url).toBeUndefined();
      }
    });

    it('refuses cover art from anywhere but Luma CDN', () => {
      for (const cover of ['https://evil.test/x.png', 'javascript:alert(1)', '/local.png']) {
        const hostile = { ...ENTRY, event: { ...ENTRY.event, cover_url: cover } };
        expect(parseLumaEntries(payload(hostile))[0].coverUrl).toBeUndefined();
      }
    });

    it('survives hosts that are not the shape it expects', () => {
      const odd = { ...ENTRY, hosts: [{ name: 'Real' }, 'string', null, {}, 42] };
      expect(parseLumaEntries(payload(odd))[0].hosts).toEqual(['Real']);
    });
  });

  describe('survives a payload that is not the expected shape at all', () => {
    it('returns nothing rather than throwing', () => {
      for (const junk of [null, undefined, 42, 'text', {}, { entries: null }, { entries: {} }]) {
        expect(parseLumaEntries(junk)).toEqual([]);
      }
    });

    it('skips entries that are not objects', () => {
      expect(parseLumaEntries(payload(null, 'x', 7, [], ENTRY))).toHaveLength(1);
    });

    it('skips an entry with no nested event', () => {
      expect(parseLumaEntries(payload({ hosts: [] }, { event: null }))).toEqual([]);
    });
  });
});
