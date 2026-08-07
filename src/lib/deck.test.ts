import { describe, expect, it } from 'vitest';
import {
  centredIndex,
  DEFAULT_SPEED,
  easeSpeed,
  placeCard,
  settleOffset,
  signedDistance,
  targetSpeed,
} from './deck';

describe('signedDistance', () => {
  it('is zero for the card sitting on the centre line', () => {
    expect(signedDistance(3, 3, 8)).toBe(0);
  });

  it('is positive for the card below and negative for the one above', () => {
    expect(signedDistance(4, 3, 8)).toBe(1);
    expect(signedDistance(2, 3, 8)).toBe(-1);
  });

  it('wraps the far side of the deck to the near side', () => {
    /* Card 7 with card 0 centred is one step *above*, not seven below. */
    expect(signedDistance(7, 0, 8)).toBe(-1);
    expect(signedDistance(0, 7, 8)).toBe(1);
  });

  it('never exceeds half the deck in either direction', () => {
    const count = 9;
    for (let index = 0; index < count; index += 1) {
      for (let offset = 0; offset < count; offset += 0.25) {
        expect(Math.abs(signedDistance(index, offset, count))).toBeLessThanOrEqual(count / 2);
      }
    }
  });

  it('handles fractional offsets mid-rotation', () => {
    expect(signedDistance(1, 0.5, 8)).toBeCloseTo(0.5);
    expect(signedDistance(0, 0.5, 8)).toBeCloseTo(-0.5);
  });
});

describe('placeCard', () => {
  const CENTRE = 100;
  const SPACING = 90;

  it('puts the centred card at full size and opacity', () => {
    const placement = placeCard(0, CENTRE, SPACING);
    expect(placement).toMatchObject({ offsetY: 100, scale: 1, opacity: 1, interactive: true });
  });

  it('pushes neighbours out by one spacing and shrinks them', () => {
    expect(placeCard(1, CENTRE, SPACING).offsetY).toBe(190);
    expect(placeCard(-1, CENTRE, SPACING).offsetY).toBe(10);
    expect(placeCard(1, CENTRE, SPACING).scale).toBeCloseTo(0.86);
  });

  it('keeps three cards visible — centre plus both neighbours', () => {
    expect(placeCard(0, CENTRE, SPACING).opacity).toBeGreaterThan(0);
    expect(placeCard(1, CENTRE, SPACING).opacity).toBeGreaterThan(0);
    expect(placeCard(-1, CENTRE, SPACING).opacity).toBeGreaterThan(0);
    expect(placeCard(2, CENTRE, SPACING).opacity).toBe(0);
  });

  it('makes only the centred card answer the pointer', () => {
    /* Parked cards sit outside the box; interactive ones would enlarge the
       column's hover target over the category label. */
    expect(placeCard(0.4, CENTRE, SPACING).interactive).toBe(true);
    expect(placeCard(0.6, CENTRE, SPACING).interactive).toBe(false);
    expect(placeCard(3, CENTRE, SPACING).interactive).toBe(false);
  });

  it('floors the scale so distant cards never invert or vanish', () => {
    expect(placeCard(50, CENTRE, SPACING).scale).toBe(0.72);
  });

  it('stacks nearer cards above further ones', () => {
    expect(placeCard(0, CENTRE, SPACING).zIndex).toBeGreaterThan(
      placeCard(1, CENTRE, SPACING).zIndex,
    );
  });

  it('treats above and below symmetrically', () => {
    const above = placeCard(-1, CENTRE, SPACING);
    const below = placeCard(1, CENTRE, SPACING);
    expect(above.scale).toBe(below.scale);
    expect(above.opacity).toBe(below.opacity);
  });
});

describe('targetSpeed', () => {
  it('idles at the base speed', () => {
    expect(targetSpeed('idle', false, true)).toBe(DEFAULT_SPEED.base);
  });

  it('boosts on hover and on hold', () => {
    expect(targetSpeed('hover', false, true)).toBe(DEFAULT_SPEED.boost);
    expect(targetSpeed('hold', false, true)).toBe(DEFAULT_SPEED.boost);
  });

  it('freezes on press so a click resolves to the visible card', () => {
    expect(targetSpeed('press', false, true)).toBe(0);
  });

  it('stops for keyboard focus, whatever the pointer is doing', () => {
    expect(targetSpeed('hover', true, true)).toBe(0);
    expect(targetSpeed('idle', true, true)).toBe(0);
  });

  it('stops when the section is paused, whatever the pointer is doing', () => {
    expect(targetSpeed('hover', false, false)).toBe(0);
    expect(targetSpeed('idle', false, false)).toBe(0);
  });
});

describe('easeSpeed', () => {
  it('moves toward the target', () => {
    expect(easeSpeed(0, 1, 0.1)).toBeGreaterThan(0);
    expect(easeSpeed(0, 1, 0.1)).toBeLessThan(1);
  });

  it('lands exactly on zero instead of creeping forever', () => {
    /* Easing only ever approaches, so a paused column used to drift by a
       fraction of a pixel indefinitely. The snap takes about 61 frames from
       the base speed — roughly a second of deceleration at 60fps. */
    const frame = 0.016;
    let speed = DEFAULT_SPEED.base;
    let frames = 0;
    while (speed !== 0 && frames < 200) {
      speed = easeSpeed(speed, 0, frame);
      frames += 1;
    }
    expect(speed).toBe(0);
    expect(frames).toBeLessThan(1 / frame); /* under a second */
  });

  it('lands exactly on a non-zero target too', () => {
    let speed = 0;
    for (let i = 0; i < 200; i += 1) speed = easeSpeed(speed, 0.85, 0.016);
    expect(speed).toBe(0.85);
  });

  it('never overshoots on a long frame', () => {
    expect(easeSpeed(0, 1, 10)).toBe(1);
  });
});

describe('settleOffset', () => {
  it('pulls a stopped column onto the nearest card', () => {
    let offset = 3.4;
    for (let i = 0; i < 100; i += 1) offset = settleOffset(offset, 8, 0.016);
    expect(offset).toBe(3);
  });

  it('rounds up when past the halfway point', () => {
    let offset = 3.6;
    for (let i = 0; i < 100; i += 1) offset = settleOffset(offset, 8, 0.016);
    expect(offset).toBe(4);
  });

  it('normalizes back into range when it rounds past the last card', () => {
    let offset = 7.9;
    for (let i = 0; i < 100; i += 1) offset = settleOffset(offset, 8, 0.016);
    expect(offset).toBe(0);
  });

  it('leaves an already-settled column alone', () => {
    expect(settleOffset(5, 8, 0.016)).toBe(5);
  });
});

describe('centredIndex', () => {
  it('names the nearest card', () => {
    expect(centredIndex(0, 8)).toBe(0);
    expect(centredIndex(2.4, 8)).toBe(2);
    expect(centredIndex(2.6, 8)).toBe(3);
  });

  it('wraps rather than pointing past the end', () => {
    expect(centredIndex(7.6, 8)).toBe(0);
    expect(centredIndex(-0.4, 8)).toBe(0);
  });
});
