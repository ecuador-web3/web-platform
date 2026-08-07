import { ConfigError } from './errors';

/**
 * PLACEHOLDER demand model for the ticket's seat meter.
 *
 * The reserved count is derived from the clock, not from a registration feed:
 * a straight line from `anchorReserved` seats at `anchorAt`, growing `perDay`,
 * clamped to `capacity`. That keeps it honest in the two ways a simulated
 * number can be — every visitor sees the same value at the same moment, and it
 * never walks backwards between visits.
 *
 * It is still a simulation. Before launch, `seatsAt` should read the real Luma
 * registration count; a meter that contradicts the door is worse than no meter.
 */
export interface SeatCurve {
  capacity: number;
  /** ISO instant the curve is pinned to. */
  anchorAt: string;
  anchorReserved: number;
  /** Seats per day. The pace knob: 1.3 fills the room as the event starts. */
  perDay: number;
}

/** Everything the ticket renders about seats, all derived from one number. */
export interface SeatState {
  readonly reserved: number;
  readonly remaining: number;
  readonly filledPercent: number;
  readonly soldOut: boolean;
}

const DAY_MS = 86_400_000;

/**
 * Seat state at `now`, with `reserved` clamped to `[0, capacity]`.
 *
 * @throws ConfigError when the curve is unusable — an unparseable anchor or a
 *   non-positive capacity would otherwise surface as `NaN` in the UI.
 */
export function seatsAt(curve: SeatCurve, now: number): SeatState {
  const anchor = Date.parse(curve.anchorAt);

  if (Number.isNaN(anchor)) {
    throw new ConfigError('invalid-seat-curve', `Unparseable seat anchor: "${curve.anchorAt}"`, {
      anchorAt: curve.anchorAt,
    });
  }

  if (!Number.isFinite(curve.capacity) || curve.capacity <= 0) {
    throw new ConfigError('invalid-seat-curve', 'Seat capacity must be a positive number', {
      capacity: String(curve.capacity),
    });
  }

  const days = (now - anchor) / DAY_MS;
  const projected = Math.floor(curve.anchorReserved + days * curve.perDay);
  const reserved = Math.min(curve.capacity, Math.max(0, projected));

  return {
    reserved,
    remaining: curve.capacity - reserved,
    filledPercent: Math.round((reserved / curve.capacity) * 100),
    soldOut: reserved >= curve.capacity,
  };
}
