/**
 * PLACEHOLDER event, so the ticket has something to show while the Luma
 * calendar has nothing scheduled.
 *
 * **To remove: set `showPlaceholderEvent` to false in `site.ts`, then delete
 * this file and its import.** Everything fake lives here and nowhere else, so
 * that is the whole job.
 *
 * It is deliberately the *same* event the editorial copy in `es.json` describes
 * ("Web3 desde Cero", its hooks, its tutors). A placeholder with an invented
 * title would put a heading over a body that contradicts it, which is a worse
 * lie than an invented date and a much easier one to miss.
 *
 * The CTA is left to `lumaProfileUrl` by the components, since the event has no
 * `url` of its own: a fabricated link would send anyone who clicked it to a Luma
 * page that does not exist. The calendar is a real destination and tells the
 * truth about there being nothing scheduled yet.
 *
 * The date rolls with the build rather than being a fixed instant. A hardcoded
 * date is exactly the bug this whole feature replaced: it quietly slips into the
 * past, the ticket drops back to its empty state, and nobody notices for weeks.
 * Anchoring to build time means the placeholder cannot expire, at the cost of
 * moving on every deploy, which is the right trade for scaffolding.
 */
import type { ScheduledEvent } from '../lib/lumaCalendar';
import type { SeatCurve } from '../lib/seats';

const DAY_MS = 86_400_000;

/** Mainland Ecuador is UTC-5 all year, so a fixed offset is exact. */
const ECUADOR_OFFSET = '-05:00';

/**
 * An ISO instant `days` from the build, at a given Ecuador wall-clock time.
 *
 * The calendar date is formatted in Guayaquil rather than taken off the build
 * machine, so a build running late in the evening in another zone still lands on
 * the day it means to.
 */
function fromBuild(days: number, time: string): string {
  const date = new Date(Date.now() + days * DAY_MS);
  const ymd = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Guayaquil',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

  return `${ymd}T${time}:00${ECUADOR_OFFSET}`;
}

/**
 * Two evening sessions, three weeks out, matching `copy.event`.
 *
 * Named as a second cohort because the August run of the same workshop is still
 * on the calendar and shows up under "sesiones anteriores". Without the suffix
 * the page carries one title twice, once as the next event and once as the last
 * one, which reads as a bug rather than as a repeat.
 */
export const placeholderEvents: ScheduledEvent[] = [
  {
    title: 'Web3 desde Cero · Cohorte 2',
    startsAt: fromBuild(21, '19:30'),
    endsAt: fromBuild(22, '21:00'),
    hosts: ['Elizabeth Pacheco', 'Gelois o7'],
    unnamedHosts: 0,
    coverUrl: 'https://images.lumacdn.com/uploads/bg/e7b154bb-cb51-42e4-b49e-ab3f0c91e2de.png',
    isVirtual: true,
  },
];

/**
 * Seat curve anchored to the build, so the meter reads like a room filling up.
 *
 * The shipped curve was pinned to a date in the past, which meant a placeholder
 * event advertised itself as sold out the moment it appeared: a card promising
 * a workshop under the words "cupos agotados" invites nobody.
 */
export const placeholderSeats: SeatCurve = {
  capacity: 50,
  anchorAt: new Date().toISOString(),
  anchorReserved: 31,
  perDay: 3,
};
