import { describe, expect, it } from 'vitest';
import { ConfigError } from './errors';
import { seatsAt, type SeatCurve } from './seats';

const CURVE: SeatCurve = {
  capacity: 250,
  anchorAt: '2026-08-06T00:00:00-05:00',
  anchorReserved: 187,
  perDay: 1.3,
};

const AT = (iso: string) => Date.parse(iso);

describe('seatsAt', () => {
  it('returns the anchor value at the anchor instant', () => {
    expect(seatsAt(CURVE, AT(CURVE.anchorAt)).reserved).toBe(187);
  });

  it('grows by perDay and floors partial seats', () => {
    /* Ten days on: 187 + 13 = 200 exactly. */
    expect(seatsAt(CURVE, AT('2026-08-16T00:00:00-05:00')).reserved).toBe(200);
    /* Half a day on: 187.65 must not round up to a seat that is not taken. */
    expect(seatsAt(CURVE, AT('2026-08-06T12:00:00-05:00')).reserved).toBe(187);
  });

  it('never exceeds capacity, however far past the anchor', () => {
    const state = seatsAt(CURVE, AT('2030-01-01T00:00:00Z'));
    expect(state.reserved).toBe(250);
    expect(state.remaining).toBe(0);
    expect(state.soldOut).toBe(true);
    expect(state.filledPercent).toBe(100);
  });

  it('never goes negative before the anchor', () => {
    const state = seatsAt(CURVE, AT('2020-01-01T00:00:00Z'));
    expect(state.reserved).toBe(0);
    expect(state.remaining).toBe(250);
    expect(state.soldOut).toBe(false);
  });

  it('never walks backwards as time moves forward', () => {
    const day = 86_400_000;
    const start = AT(CURVE.anchorAt);
    let previous = -1;
    for (let i = 0; i < 120; i += 1) {
      const { reserved } = seatsAt(CURVE, start + i * day);
      expect(reserved).toBeGreaterThanOrEqual(previous);
      previous = reserved;
    }
  });

  it('derives remaining and percentage from the same count', () => {
    const state = seatsAt(CURVE, AT('2026-08-06T00:00:00-05:00'));
    expect(state.remaining).toBe(CURVE.capacity - state.reserved);
    expect(state.filledPercent).toBe(Math.round((state.reserved / CURVE.capacity) * 100));
  });

  it('treats reaching capacity exactly as sold out', () => {
    const exact: SeatCurve = { ...CURVE, capacity: 200, anchorReserved: 200, perDay: 0 };
    expect(seatsAt(exact, AT(exact.anchorAt)).soldOut).toBe(true);
  });

  it('rejects an unparseable anchor', () => {
    expect(() => seatsAt({ ...CURVE, anchorAt: 'soon' }, Date.now())).toThrow(ConfigError);
  });

  it('rejects a non-positive capacity instead of dividing by zero', () => {
    expect(() => seatsAt({ ...CURVE, capacity: 0 }, Date.now())).toThrow(ConfigError);
  });
});
