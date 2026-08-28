/**
 * A small iCalendar (RFC 5545) reader — only the parts a Luma feed uses.
 *
 * Hand-written rather than pulled in: the feed is six properties deep, and every
 * general-purpose parser drags a timezone database along with it for a calendar
 * whose timestamps are already UTC.
 *
 * Two details of the format do real damage if skipped, which is why this is a
 * tested module rather than a regex at the call site:
 *
 * - **Folding.** A line longer than 75 octets continues on the next line behind
 *   a single space, and Luma folds mid-word — the live feed splits `Hosted` into
 *   `Ho` / ` sted`. Unfolding has to happen before anything is read, or every
 *   long DESCRIPTION comes back with a space wedged into it.
 * - **Escaping.** TEXT values escape `\n`, `\,`, `\;` and `\\`, so a host list
 *   arrives as `Ana\, Beto` and a naive split on commas finds a partner too many.
 *
 * Unlike `src/data/site.ts`, this reads data nobody in this repository authored.
 * A malformed block is therefore a runtime condition, not a typo to fail the
 * build over: a VEVENT with no usable start is dropped and the rest of the
 * calendar still parses. Nobody can fix Luma's output by editing this repo, and
 * one bad block should not hold up a deploy.
 */

/**
 * Mainland Ecuador is UTC-5 the whole year — no daylight saving — so a fixed
 * offset is exact rather than an approximation. It only applies to the two
 * forms that carry no zone of their own; the Luma feed emits UTC (`...Z`) and
 * never reaches these branches today.
 */
const ECUADOR_OFFSET = '-05:00';

export interface IcsEvent {
  readonly uid: string;
  readonly summary: string;
  readonly description: string;
  readonly location: string;
  /** ISO instant. Always present — a block without one is dropped. */
  readonly startsAt: string;
  readonly endsAt?: string;
}

/**
 * An iCalendar date-time as an ISO instant, or `null` if it is not one.
 *
 * Three forms, in the order the spec lists them: UTC, floating local time, and
 * a date with no time at all (an all-day event).
 */
export function icsDateToIso(value: string): string | null {
  const utc = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(value);
  if (utc) {
    const [, y, m, d, hh, mm, ss] = utc;
    return `${y}-${m}-${d}T${hh}:${mm}:${ss}.000Z`;
  }

  const floating = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})$/.exec(value);
  if (floating) {
    const [, y, m, d, hh, mm, ss] = floating;
    return `${y}-${m}-${d}T${hh}:${mm}:${ss}${ECUADOR_OFFSET}`;
  }

  const dateOnly = /^(\d{4})(\d{2})(\d{2})$/.exec(value);
  if (dateOnly) {
    const [, y, m, d] = dateOnly;
    return `${y}-${m}-${d}T00:00:00${ECUADOR_OFFSET}`;
  }

  return null;
}

/** Joins continuation lines back onto the line they belong to. */
function unfold(text: string): string {
  return text.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
}

/** Reverses TEXT escaping in one pass, so `\\n` stays a literal backslash-n. */
function decodeText(value: string): string {
  return value.replace(/\\([\\;,nN])/g, (_match, char: string) =>
    char === 'n' || char === 'N' ? '\n' : char,
  );
}

function toEvent(fields: Map<string, string>): IcsEvent | null {
  const startsAt = icsDateToIso(fields.get('DTSTART') ?? '');
  if (!startsAt) return null;

  const endsAt = icsDateToIso(fields.get('DTEND') ?? '');
  const text = (name: string) => decodeText(fields.get(name) ?? '');

  return {
    uid: text('UID'),
    summary: text('SUMMARY'),
    description: text('DESCRIPTION'),
    location: text('LOCATION'),
    startsAt,
    ...(endsAt ? { endsAt } : {}),
  };
}

/**
 * Every VEVENT in the feed, in the order the file lists them.
 *
 * Properties are keyed by name with their parameters discarded: `DTSTART`,
 * `DTSTART;VALUE=DATE` and `DTSTART;TZID=America/Guayaquil` all land under
 * `DTSTART`, and `icsDateToIso` reads the shape of the value instead. That is
 * enough for a feed that publishes in UTC and keeps the parser off the subject
 * of timezone identifiers entirely.
 */
export function parseIcs(text: string): IcsEvent[] {
  const events: IcsEvent[] = [];
  let fields: Map<string, string> | null = null;

  for (const raw of unfold(text).split(/\r?\n/)) {
    const line = raw.trimEnd();

    if (line.toUpperCase() === 'BEGIN:VEVENT') {
      fields = new Map();
      continue;
    }

    if (line.toUpperCase() === 'END:VEVENT') {
      if (fields) {
        const event = toEvent(fields);
        if (event) events.push(event);
      }
      fields = null;
      continue;
    }

    if (!fields) continue;

    const colon = line.indexOf(':');
    if (colon === -1) continue;

    const name = line.slice(0, colon).split(';')[0].toUpperCase();
    fields.set(name, line.slice(colon + 1));
  }

  return events;
}
