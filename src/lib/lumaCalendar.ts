/**
 * What the site shows from a Luma calendar.
 *
 * Split from the two format readers because they answer different questions:
 * `lumaJson.ts` and `ics.ts` know how to read a payload, this one knows what
 * "next", "the rest" and "recent" mean for this site. All three are pure, so the
 * rules below are tested against a fixed clock rather than discovered on the
 * morning they go wrong.
 */
import type { IcsEvent } from './ics';
import { safeExternalUrl } from './url';

export interface ScheduledEvent {
  readonly title: string;
  readonly startsAt: string;
  readonly endsAt?: string;
  /** Absent when the source carried no safe link — the CTA is dropped, not faked. */
  readonly url?: string;
  /** Named hosts, in source order. */
  readonly hosts: readonly string[];
  /** How many hosts Luma collapsed into "& N others". Only the ICS path does this. */
  readonly unnamedHosts: number;
  /** Cover art on Luma's CDN. Absent on the ICS path, which carries no images. */
  readonly coverUrl?: string;
  /** `undefined` where the source cannot say, which is the whole of the ICS feed. */
  readonly isVirtual?: boolean;
}

/**
 * An empty calendar is a state to render, not an error and not an event with
 * blank fields. Modelling it as a variant means a template cannot forget the
 * case — the same reasoning as `CountdownState` in `lib/countdown.ts`.
 */
export type CalendarState =
  | { readonly status: 'scheduled'; readonly event: ScheduledEvent }
  | { readonly status: 'none' };

/**
 * What the community sessions section has to show.
 *
 * Three outcomes rather than one list, because the section says something
 * different in each. `upcoming` is the calendar ahead; `recent` is the fallback
 * when everything scheduled has already happened, and has to be labelled in the
 * past tense or it lies; `none` is a calendar with nothing on it at all.
 */
export type SessionsState =
  | { readonly status: 'upcoming'; readonly events: readonly ScheduledEvent[] }
  | { readonly status: 'recent'; readonly events: readonly ScheduledEvent[] }
  | { readonly status: 'none' };

/**
 * The public URL for an ICS event.
 *
 * Luma writes the short, shareable form into the DESCRIPTION prose ("Get
 * up-to-date information at: https://luma.com/s5r5q74x") and the canonical
 * long form into LOCATION. The short one is preferred because it is what the
 * organisers hand out; LOCATION is the fallback because it is structured and
 * therefore always there.
 *
 * The result is laundered through `safeExternalUrl` for a reason that is
 * sharper here than anywhere else on the site: every other URL in this codebase
 * is developer-authored config, but this one arrives over the network and lands
 * in an `href`. A feed that ever served a `javascript:` value would otherwise
 * execute it.
 */
export function publicEventUrl(event: IcsEvent): string | undefined {
  const short = /https:\/\/(?:luma\.com|lu\.ma)\/(?!event\/)[A-Za-z0-9-]+/.exec(event.description);
  return safeExternalUrl(short?.[0]) ?? safeExternalUrl(event.location);
}

/**
 * Hosts, read out of the DESCRIPTION line Luma appends to every ICS event.
 *
 * The line is English regardless of the event's own language ("Hosted by
 * Ecuador Web3, Gelois o7 & Elizabeth Pacheco") and collapses long lists into
 * "& 4 others". That tail is counted rather than kept as a name: rendering the
 * literal string "4 others" inside Spanish copy is worse than saying how many
 * were left out in the site's own words.
 *
 * The JSON path has no such problem, and names everyone.
 */
export function hostsFrom(description: string): { names: string[]; unnamed: number } {
  const line = /Hosted by\s+(.+)/.exec(description);
  if (!line) return { names: [], unnamed: 0 };

  const names: string[] = [];
  let unnamed = 0;

  for (const part of line[1].split(/\s*,\s*|\s+&\s+/)) {
    const name = part.trim();
    if (!name) continue;

    const others = /^(\d+)\s+others?$/i.exec(name);
    if (others) {
      unnamed += Number(others[1]);
      continue;
    }

    names.push(name);
  }

  return { names, unnamed };
}

/**
 * ICS events in the shape the site renders.
 *
 * The fallback path. It cannot supply cover art or say whether an event is
 * virtual, so both come back absent rather than guessed, and the templates
 * render without them.
 */
export function fromIcs(events: readonly IcsEvent[]): ScheduledEvent[] {
  return events.map((event) => {
    const url = publicEventUrl(event);
    const { names, unnamed } = hostsFrom(event.description);

    return {
      title: event.summary,
      startsAt: event.startsAt,
      ...(event.endsAt ? { endsAt: event.endsAt } : {}),
      ...(url ? { url } : {}),
      hosts: names,
      unnamedHosts: unnamed,
    };
  });
}

/** The instant an event stops being current — its end, or its start if open-ended. */
function activeUntil(event: ScheduledEvent): number {
  const start = Date.parse(event.startsAt);
  const end = event.endsAt ? Date.parse(event.endsAt) : Number.NaN;
  return Number.isNaN(end) ? start : Math.max(start, end);
}

const bySoonest = (a: ScheduledEvent, b: ScheduledEvent) =>
  Date.parse(a.startsAt) - Date.parse(b.startsAt);

/**
 * Every event that has not finished yet, soonest first.
 *
 * The cutoff is the *end* rather than the start, so an event in progress stays
 * on the site instead of vanishing the minute it begins — the ticket's
 * countdown already has a `started` state that says "Hoy mismo", and dropping
 * the event at its start time would make that state unreachable.
 */
export function upcomingAll(events: readonly ScheduledEvent[], now: number): ScheduledEvent[] {
  return events.filter((event) => activeUntil(event) > now).sort(bySoonest);
}

/** Every finished event, most recent first. */
export function recentAll(events: readonly ScheduledEvent[], now: number): ScheduledEvent[] {
  return events.filter((event) => activeUntil(event) <= now).sort((a, b) => -bySoonest(a, b));
}

/** The soonest event still ahead, for the ticket. */
export function upcomingFrom(events: readonly ScheduledEvent[], now: number): CalendarState {
  const next = upcomingAll(events, now)[0];
  return next ? { status: 'scheduled', event: next } : { status: 'none' };
}

/**
 * The sessions section, which is the calendar minus whatever the ticket is
 * already showing.
 *
 * Skipping the first upcoming event is the point: it is on the ticket directly
 * above, and printing it twice on one screen reads as a bug rather than as
 * emphasis.
 *
 * When nothing is left ahead, the section falls back to what has already
 * happened. An empty calendar and a calendar of finished events look identical
 * to a visitor otherwise, and they are not the same thing: one community has
 * never met, the other met last week. The `recent` status exists so the
 * template is forced to label them differently.
 */
export function sessionsFrom(
  events: readonly ScheduledEvent[],
  now: number,
  limit = 4,
): SessionsState {
  const ahead = upcomingAll(events, now).slice(1, 1 + limit);
  if (ahead.length > 0) return { status: 'upcoming', events: ahead };

  const behind = recentAll(events, now).slice(0, limit);
  if (behind.length > 0) return { status: 'recent', events: behind };

  return { status: 'none' };
}
