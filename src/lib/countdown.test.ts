import { describe, expect, it } from 'vitest';
import { countdownFrom, padUnit } from './countdown';
import { ConfigError } from './errors';

const AT = (iso: string) => Date.parse(iso);

describe('countdownFrom', () => {
  it('rejects an unparseable date rather than rendering NaN', () => {
    expect(() => countdownFrom('next tuesday', AT('2026-08-07T00:00:00Z'))).toThrow(ConfigError);
  });

  it('reports started once the instant has passed', () => {
    const state = countdownFrom('2026-09-22T09:00:00-05:00', AT('2026-09-22T14:01:00Z'));
    expect(state).toEqual({ status: 'started' });
  });

  it('reports started exactly at the instant, not a zero countdown', () => {
    const state = countdownFrom('2026-09-22T09:00:00-05:00', AT('2026-09-22T14:00:00Z'));
    expect(state.status).toBe('started');
  });

  it('is still counting one minute before', () => {
    const state = countdownFrom('2026-09-22T09:00:00-05:00', AT('2026-09-22T13:59:00Z'));
    expect(state).toEqual({ status: 'counting', days: 0, hours: 0, minutes: 1 });
  });

  it('splits a gap into whole days, hours and minutes', () => {
    const state = countdownFrom('2026-09-22T09:00:00-05:00', AT('2026-09-20T10:30:00-05:00'));
    expect(state).toEqual({ status: 'counting', days: 1, hours: 22, minutes: 30 });
  });

  it('anchors to the offset in the string, not the runtime timezone', () => {
    /* Same instant expressed two ways must give the same answer. */
    const viaOffset = countdownFrom('2026-09-22T09:00:00-05:00', AT('2026-09-22T00:00:00Z'));
    const viaUtc = countdownFrom('2026-09-22T14:00:00Z', AT('2026-09-22T00:00:00Z'));
    expect(viaOffset).toEqual(viaUtc);
  });

  it('discards partial minutes rather than rounding up', () => {
    const state = countdownFrom('2026-09-22T09:00:59-05:00', AT('2026-09-22T13:59:00Z'));
    expect(state).toEqual({ status: 'counting', days: 0, hours: 0, minutes: 1 });
  });
});

describe('padUnit', () => {
  it('pads single digits to a fixed width', () => {
    expect(padUnit(0)).toBe('00');
    expect(padUnit(7)).toBe('07');
  });

  it('leaves wider values alone', () => {
    expect(padUnit(23)).toBe('23');
    expect(padUnit(146)).toBe('146');
  });
});
