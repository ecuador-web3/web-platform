/**
 * Events Ecuador Web3 co-hosts on another organiser's Luma calendar.
 *
 * Being listed as a host on Luma does not put an event on our calendar, so
 * neither the JSON nor the ICS feed in `luma.ts` returns it. These entries are
 * merged in after the calendar and behave like any calendar event: on the
 * ticket while upcoming, in the past sessions once they end.
 *
 * Copied by hand from the event page, so a change on Luma does not reach here.
 * Once the event is on our calendar too, the calendar's fields win and an entry
 * here only fills what the calendar left out (see `withCoHosted` in `luma.ts`).
 * Worth keeping while the event is upcoming: any build that falls back to ICS
 * gets no cover and no venue from Luma, so this entry is where those come from.
 */
import type { ScheduledEvent } from '../lib/lumaCalendar';

export const coHostedEvents: ScheduledEvent[] = [
  {
    // https://luma.com/udofk6cd, owned by Build Buddies, added to our calendar on Nov 19.
    title: 'Stellar Local - Cuenca',
    startsAt: '2026-11-28T19:00:00.000Z',
    endsAt: '2026-11-28T21:00:00.000Z',
    url: 'https://luma.com/udofk6cd',
    hosts: ['Meta Pool', 'Gelois o7', 'Ecuador Web3'],
    unnamedHosts: 0,
    coverUrl: 'https://images.lumacdn.com/uploads/kk/ea0aa36f-46e1-4bb9-a41a-1053c33d2113.png',
    isVirtual: false,
  },
];
