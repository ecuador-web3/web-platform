/**
 * The Luma calendar, read once at build time.
 *
 * This is the only module on the site that touches the network, and it is
 * deliberately the thinnest thing that can: fetch bytes, hand them to a parser,
 * and never decide anything. What counts as the next event lives in
 * `lib/lumaCalendar.ts`, where it can be tested against a fixed clock.
 *
 * ## Two sources, on purpose
 *
 * **`calendar/get-items` (primary).** Luma's own JSON. It carries what the site
 * actually wants to show: cover art, every host by name, and the location
 * fields that say whether an event is virtual. It is also undocumented and
 * unversioned, so it can change shape or start refusing us without notice.
 *
 * **The ICS feed (fallback).** A published standard, so far more stable, but it
 * carries schedule only: no images, no location, and a host line that collapses
 * into "& 4 others". Good enough to keep dates and titles on the page.
 *
 * The fallback fires when the JSON *requests* fail, not when they succeed with
 * nothing in them. An empty calendar is a real answer and the site has a state
 * for it; re-asking a second endpoint would not make it less empty.
 *
 * Luma's supported API (`public-api.luma.com`) is a third option and the only
 * one with a contract, but it needs a Luma Plus subscription and a per-calendar
 * key, and this calendar is on the free plan.
 *
 * ## Why build time
 *
 * Not a preference, a constraint. Luma serves no `access-control-allow-origin`
 * header on the JSON or the feed, so a browser cannot read either. Fetching
 * here also keeps the site a static build with no runtime dependency on Luma
 * being up, and lets the build download and re-encode the cover art rather than
 * pointing visitors at 2 MB PNGs on someone else's CDN.
 *
 * The consequence is that freshness equals deploy frequency: a new event
 * appears on the site at the next build, not the moment it is published. A
 * scheduled rebuild is what closes that gap.
 */
import { parseIcs } from '../lib/ics';
import { fromIcs, type ScheduledEvent } from '../lib/lumaCalendar';
import { parseLumaEntries } from '../lib/lumaJson';

/**
 * The calendar behind luma.com/user/ecuadorweb3. The profile has no slug set,
 * so this id is the only stable handle on it — read off an event page, and
 * confirmed against `api.lu.ma/calendar/get`.
 */
const CALENDAR_ID = 'cal-3EjE08k52VN0cif';

/** `past` and `future` are the only periods the endpoint accepts; `all` is a 400. */
const PERIODS = ['future', 'past'] as const;

const itemsUrl = (period: string) =>
  `https://api.lu.ma/calendar/get-items?calendar_api_id=${CALENDAR_ID}` +
  `&period=${period}&pagination_limit=50`;

const ICS_URL = `https://api.lu.ma/ics/get?entity=calendar&id=${CALENDAR_ID}`;

/** Long enough for a slow response, short enough that a hung host cannot stall
    a deploy behind it. */
const TIMEOUT_MS = 8_000;

async function getText(url: string, accept: string): Promise<string> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { accept },
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

/**
 * An event appearing in both periods would be one starting right about now.
 * Keyed on the link where there is one, since that is the only field Luma
 * guarantees unique.
 */
function dedupe(events: ScheduledEvent[]): ScheduledEvent[] {
  const seen = new Set<string>();

  return events.filter((event) => {
    const key = event.url ?? `${event.title}|${event.startsAt}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Events from the JSON endpoint, or `null` when it could not be read at all. */
async function loadJson(): Promise<ScheduledEvent[] | null> {
  try {
    const pages = await Promise.all(
      PERIODS.map(async (period) =>
        parseLumaEntries(JSON.parse(await getText(itemsUrl(period), 'application/json'))),
      ),
    );

    return dedupe(pages.flat());
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(`[luma] calendar JSON unreadable (${reason}); falling back to the ICS feed`);
    return null;
  }
}

/** Events from the ICS feed, or an empty list if that fails too. */
async function loadIcs(): Promise<ScheduledEvent[]> {
  try {
    return fromIcs(parseIcs(await getText(ICS_URL, 'text/calendar')));
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(`[luma] ICS feed unreachable too (${reason}); rendering without events`);
    return [];
  }
}

/**
 * Drops any cover the CDN will not serve.
 *
 * Astro fetches remote images during the build to size and re-encode them, and
 * a URL it cannot get raises `FailedToFetchRemoteImageDimensions` and takes the
 * whole build down with it. That is the one failure mode in this module that
 * would otherwise be fatal, which makes it worth three HEAD requests: a cover
 * Luma has moved or deleted costs a card its picture instead of costing the
 * deploy. Verified in parallel, so it adds one round trip, not one per event.
 */
async function withReachableCovers(events: ScheduledEvent[]): Promise<ScheduledEvent[]> {
  return Promise.all(
    events.map(async (event) => {
      if (!event.coverUrl) return event;

      try {
        const response = await fetch(event.coverUrl, {
          method: 'HEAD',
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        if (response.ok) return event;
        console.warn(`[luma] cover for "${event.title}" returned HTTP ${response.status}; dropping it`);
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        console.warn(`[luma] cover for "${event.title}" unreachable (${reason}); dropping it`);
      }

      const { coverUrl: _dropped, ...withoutCover } = event;
      return withoutCover;
    }),
  );
}

/**
 * Every event on the calendar.
 *
 * Failure is a warning rather than a thrown error, for the same reason an
 * unmeasurable partner logo is: the caller has something sensible to do about
 * it. The sections render their empty states, the deploy completes, and the
 * next build picks the calendar back up. Failing the build instead would mean a
 * blip at Luma could block an unrelated copy fix from shipping.
 */
async function loadCalendar(): Promise<ScheduledEvent[]> {
  const events = await withReachableCovers((await loadJson()) ?? (await loadIcs()));

  if (events.length === 0) {
    console.warn('[luma] calendar has no readable events; rendering empty states');
  }

  return events;
}

export const lumaEvents: ScheduledEvent[] = await loadCalendar();

/** Where to send visitors when nothing is scheduled. */
export const lumaProfileUrl = 'https://luma.com/user/ecuadorweb3';
