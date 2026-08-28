import { copy } from '../i18n';
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
 * The locale, by contrast, follows the active copy — month names are text and
 * belong to the language, while the event happens in Guayaquil either way.
 */
const LOCALE = copy.locale.intl;
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

/**
 * "MIÉ" — the three-letter weekday for a schedule cell.
 *
 * Truncated and stripped of its full stop for the same reason as the month
 * above: the cells are a fixed-width grid, and Spanish abbreviates some
 * weekdays longer than others.
 */
export function formatEventWeekday(iso: string): string {
  const weekday = partsOf(iso, { weekday: 'short' }).get('weekday') ?? '';
  return weekday.replace('.', '').slice(0, 3).toUpperCase();
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
 * Whether two instants land on the same date in Ecuador.
 *
 * Shared by the two range formatters below so they cannot disagree. They would
 * otherwise be free to print "11–12 AGO" above a single "MAR", which reads as a
 * two-day event happening entirely on the Tuesday.
 *
 * Compared as formatted parts rather than by subtracting instants, because the
 * question is which calendar square the event falls on, not how many hours long
 * it is: a session running 22:00 to 00:30 crosses a date boundary despite
 * lasting an evening, and it is genuinely printed as two days.
 */
function sameCalendarDay(startIso: string, endIso: string): boolean {
  const start = partsOf(startIso, { day: '2-digit', month: 'short' });
  const end = partsOf(endIso, { day: '2-digit', month: 'short' });
  return start.get('day') === end.get('day') && start.get('month') === end.get('month');
}

/**
 * "11–12 AGO" when start and end fall in the same month, otherwise
 * "11 AGO – 02 SEP". Single-day events keep the short form.
 */
export function formatEventDateRange(startIso: string, endIso?: string): string {
  if (!endIso || sameCalendarDay(startIso, endIso)) return formatEventDateShort(startIso);

  const start = partsOf(startIso, { day: '2-digit', month: 'short' });
  const end = partsOf(endIso, { day: '2-digit', month: 'short' });
  const startDay = start.get('day') ?? '';
  const endDay = end.get('day') ?? '';
  const startMonth = (start.get('month') ?? '').replace('.', '').slice(0, 3).toUpperCase();
  const endMonth = (end.get('month') ?? '').replace('.', '').slice(0, 3).toUpperCase();

  if (startMonth === endMonth) {
    return `${startDay}–${endDay} ${startMonth}`;
  }

  return `${startDay} ${startMonth} – ${endDay} ${endMonth}`;
}

/**
 * "MAR" for a single day, "MAR–MIÉ" for one that runs over two.
 *
 * Pairs with `formatEventDateRange` under a date, so the two always describe the
 * same span. A workshop held across two evenings says so in both lines or in
 * neither.
 */
export function formatEventWeekdayRange(startIso: string, endIso?: string): string {
  const start = formatEventWeekday(startIso);
  if (!endIso || sameCalendarDay(startIso, endIso)) return start;
  return `${start}–${formatEventWeekday(endIso)}`;
}
