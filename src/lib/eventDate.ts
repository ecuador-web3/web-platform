import { ConfigError } from './errors';

/**
 * Human-readable event dates, all derived from the one ISO instant.
 *
 * These used to be stored alongside `startsAt` as three hand-written strings.
 * Moving the summit by a day meant editing four fields in step, and nothing
 * caught it when they drifted apart. Formatting from the single source removes
 * the class of bug entirely.
 *
 * The timezone is pinned rather than taken from the runtime: the printed date
 * is Ecuador's, not the visitor's, and the build machine's zone is irrelevant.
 */
const LOCALE = 'es-EC';
const ZONE = 'America/Guayaquil';

function parseOrThrow(iso: string): Date {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) {
    throw new ConfigError('invalid-date', `Unparseable event date: "${iso}"`, { iso });
  }
  return new Date(ms);
}

function partsOf(iso: string, options: Intl.DateTimeFormatOptions): Map<string, string> {
  const parts = new Intl.DateTimeFormat(LOCALE, { ...options, timeZone: ZONE }).formatToParts(
    parseOrThrow(iso),
  );
  return new Map(parts.map((part) => [part.type, part.value]));
}

/** "22 de septiembre de 2026" */
export function formatEventDate(iso: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: ZONE,
  }).format(parseOrThrow(iso));
}

/**
 * "22 SEP" — the ticket's fixed-width date cell.
 *
 * Spanish abbreviates September as "sept", which is a character wider than
 * every other month and breaks the four-column grid. Truncating to three keeps
 * the cells even, which is the whole point of an abbreviated form here.
 */
export function formatEventDateShort(iso: string): string {
  const parts = partsOf(iso, { day: '2-digit', month: 'short' });
  const day = parts.get('day') ?? '';
  const month = (parts.get('month') ?? '').replace('.', '').slice(0, 3).toUpperCase();
  return `${day} ${month}`;
}

/** "09:00" in Ecuador time. */
export function formatEventTime(iso: string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: ZONE,
  }).format(parseOrThrow(iso));
}

/**
 * "11–12 AGO" when start and end fall in the same month, otherwise
 * "11 AGO – 02 SEP". Single-day events keep the short form.
 */
export function formatEventDateRange(startIso: string, endIso?: string): string {
  if (!endIso) return formatEventDateShort(startIso);

  const start = partsOf(startIso, { day: '2-digit', month: 'short' });
  const end = partsOf(endIso, { day: '2-digit', month: 'short' });
  const startDay = start.get('day') ?? '';
  const endDay = end.get('day') ?? '';
  const startMonth = (start.get('month') ?? '').replace('.', '').slice(0, 3).toUpperCase();
  const endMonth = (end.get('month') ?? '').replace('.', '').slice(0, 3).toUpperCase();

  if (startDay === endDay && startMonth === endMonth) {
    return formatEventDateShort(startIso);
  }

  if (startMonth === endMonth) {
    return `${startDay}–${endDay} ${startMonth}`;
  }

  return `${startDay} ${startMonth} – ${endDay} ${endMonth}`;
}
