import { ConfigError } from './errors';

/**
 * Time remaining until an event, as a state rather than a bag of numbers.
 *
 * "Already started" is not a countdown of zero — it is a different thing to
 * render, with a different label. Modelling it as a variant means the template
 * cannot forget the case, and no caller has to guess whether `days: 0` means
 * "today" or "over".
 */
export type CountdownState =
  | { readonly status: 'counting'; readonly days: number; readonly hours: number; readonly minutes: number }
  | { readonly status: 'started' };

const MINUTE_MS = 60_000;
const MINUTES_PER_HOUR = 60;
const MINUTES_PER_DAY = 24 * MINUTES_PER_HOUR;

/**
 * Split the gap between `now` and `startsAtIso` into whole days, hours and
 * minutes. Both are absolute instants, so the visitor's own timezone never
 * enters into it — the offset carried by `startsAtIso` is what anchors the
 * clock to Ecuador.
 *
 * @throws ConfigError when `startsAtIso` cannot be parsed.
 */
export function countdownFrom(startsAtIso: string, now: number): CountdownState {
  const target = Date.parse(startsAtIso);

  if (Number.isNaN(target)) {
    throw new ConfigError('invalid-date', `Unparseable event date: "${startsAtIso}"`, {
      startsAt: startsAtIso,
    });
  }

  const minutes = Math.floor((target - now) / MINUTE_MS);
  if (minutes <= 0) return { status: 'started' };

  return {
    status: 'counting',
    days: Math.floor(minutes / MINUTES_PER_DAY),
    hours: Math.floor((minutes % MINUTES_PER_DAY) / MINUTES_PER_HOUR),
    minutes: minutes % MINUTES_PER_HOUR,
  };
}

/** Zero-padded to two digits, for the fixed-width countdown readout. */
export function padUnit(value: number): string {
  return String(value).padStart(2, '0');
}
