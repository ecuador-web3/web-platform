/**
 * The strings the ticket's client script repaints after the clock moves.
 *
 * The script cannot import the copy module — that would pull every locale
 * string into the browser bundle — so the strings travel as a JSON data
 * attribute instead. That crossing is the problem this file exists to solve:
 * without it, both sides address the payload by hand-written string key, and
 * renaming one on the server turns the other into a silent empty string.
 *
 * Both sides import the same `TicketCopy` type instead, so a key that only
 * exists on one of them fails `astro check`. The type import is erased at
 * build, which is what keeps the script clear of the locale JSON.
 */
import type { Copy } from './index';

export interface TicketCopy {
  countdownStarted: string;
  countdownToday: string;
  seatCount: string;
  seatCountSoldOut: string;
  seatMeterLabel: string;
  seatProofSoldOut: string;
  seatProofLast: string;
  seatProofReserved: string;
  ctaLabel: string;
  ctaWithRemaining: string;
  ctaSoldOut: string;
}

/** Picks the ticket's client-side strings out of the active copy. */
export function ticketCopy(event: Copy['event']): TicketCopy {
  return {
    countdownStarted: event.countdown.started,
    countdownToday: event.countdown.today,
    seatCount: event.seats.count,
    seatCountSoldOut: event.seats.countSoldOut,
    seatMeterLabel: event.seats.meterLabel,
    seatProofSoldOut: event.seats.proofSoldOut,
    seatProofLast: event.seats.proofLast,
    seatProofReserved: event.seats.proofReserved,
    ctaLabel: event.cta.label,
    ctaWithRemaining: event.cta.withRemaining,
    ctaSoldOut: event.cta.soldOut,
  };
}

/**
 * Every key blank.
 *
 * The script spreads the parsed attribute over this, so a payload that arrived
 * short still yields a `TicketCopy` with every key present. That resolves the
 * boundary once instead of guarding all eleven read sites, and keeps the type
 * honest about what the rest of the script can assume.
 */
export const EMPTY_TICKET_COPY: TicketCopy = {
  countdownStarted: '',
  countdownToday: '',
  seatCount: '',
  seatCountSoldOut: '',
  seatMeterLabel: '',
  seatProofSoldOut: '',
  seatProofLast: '',
  seatProofReserved: '',
  ctaLabel: '',
  ctaWithRemaining: '',
  ctaSoldOut: '',
};
