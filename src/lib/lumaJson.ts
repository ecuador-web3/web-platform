/**
 * Reading Luma's calendar JSON into the shape the site renders.
 *
 * Sits alongside `ics.ts` as the second format reader. The ICS feed is a
 * published standard and carries the schedule; this endpoint is Luma's own,
 * undocumented, and carries considerably more: cover art, every host by name
 * rather than "& 4 others", and the location fields that say whether an event
 * is virtual at all.
 *
 * Everything here is defensive, and more so than the ICS reader. That feed is at
 * least a specified format; this is a private endpoint whose shape can change
 * without notice, so no field is assumed present and no entry is trusted to be
 * an object. An entry that does not parse is dropped and the rest of the
 * calendar still renders, on the same reasoning as a malformed VEVENT: nobody
 * can fix Luma's output by editing this repository.
 */
import type { ScheduledEvent } from './lumaCalendar';
import { safeExternalUrl } from './url';

/** Luma slugs are short alphanumeric ids. Anything else is not going in an href. */
const SLUG = /^[A-Za-z0-9-]+$/;

/** Cover art is only accepted from Luma's own CDN, which is also the one host
    `astro.config.mjs` authorises the build to download and optimise. */
const COVER_HOST = 'images.lumacdn.com';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const str = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() !== '' ? value : undefined;

/** An ISO instant the runtime can actually parse, or nothing. */
function instant(value: unknown): string | undefined {
  const raw = str(value);
  if (!raw || Number.isNaN(Date.parse(raw))) return undefined;
  return raw;
}

/**
 * `https://luma.com/<slug>` from the event's slug.
 *
 * The slug is pattern-checked before interpolation rather than after: a value
 * carrying a slash or a colon would otherwise build a URL pointing somewhere
 * else entirely, and `safeExternalUrl` only rejects bad *schemes*.
 */
function eventUrl(value: unknown): string | undefined {
  const slug = str(value);
  if (!slug || !SLUG.test(slug)) return undefined;
  return safeExternalUrl(`https://luma.com/${slug}`);
}

function coverUrl(value: unknown): string | undefined {
  const raw = safeExternalUrl(str(value));
  if (!raw) return undefined;

  try {
    return new URL(raw).hostname === COVER_HOST ? raw : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Whether an event is virtual.
 *
 * Luma's `location_type` is not dependable on this calendar: it reads `meet` on
 * the events somebody attached a Google Meet to and `unknown` on the ones where
 * nobody filled the field in at all. The physical fields are the reliable
 * signal, because Luma populates them whenever a real address is set. No
 * address and no coordinate therefore means nobody is going anywhere.
 *
 * Stated as the absence of a venue rather than a list of virtual platforms, so
 * an in-person event added later is correctly *not* labelled online, whatever
 * new value `location_type` grows.
 */
function isVirtual(event: Record<string, unknown>): boolean {
  return !event.geo_address_info && !event.coordinate;
}

/** Host display names, in the order Luma lists them. */
function hostNames(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((host) => (isRecord(host) ? str(host.name) : undefined))
    .filter((name): name is string => name !== undefined);
}

function toEvent(entry: unknown): ScheduledEvent | null {
  if (!isRecord(entry) || !isRecord(entry.event)) return null;

  const event = entry.event;
  const title = str(event.name);
  const startsAt = instant(event.start_at);

  /* Without a name or a start there is nothing to render and nothing to sort
     by, which is the whole of what this section does with an event. */
  if (!title || !startsAt) return null;

  const endsAt = instant(event.end_at);
  const url = eventUrl(event.url);
  const cover = coverUrl(event.cover_url);

  return {
    title,
    startsAt,
    ...(endsAt ? { endsAt } : {}),
    ...(url ? { url } : {}),
    ...(cover ? { coverUrl: cover } : {}),
    hosts: hostNames(entry.hosts),
    /* The JSON names every host, so nothing is ever left uncounted here. That
       only happens on the ICS path, where Luma collapses the tail. */
    unnamedHosts: 0,
    isVirtual: isVirtual(event),
  };
}

/**
 * Every readable event in a `calendar/get-items` payload.
 *
 * Takes `unknown` rather than a declared response type on purpose: the argument
 * is whatever `JSON.parse` returned from an endpoint with no contract, and
 * typing it as the shape we hope for would move the lie earlier rather than
 * removing it.
 */
export function parseLumaEntries(payload: unknown): ScheduledEvent[] {
  if (!isRecord(payload) || !Array.isArray(payload.entries)) return [];

  return payload.entries
    .map(toEvent)
    .filter((event): event is ScheduledEvent => event !== null);
}
