import { describe, expect, it } from 'vitest';
import { logoHeightForRatio, ratioFromBytes } from './logoSize';

const svg = (body: string) => new TextEncoder().encode(`<svg ${body}></svg>`);

/** Minimal PNG header: 8-byte signature, length, "IHDR", then width/height. */
const png = (width: number, height: number) => {
  const bytes = new Uint8Array(32);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  bytes.set([0x49, 0x48, 0x44, 0x52], 12); /* "IHDR" */
  const view = new DataView(bytes.buffer);
  view.setUint32(16, width);
  view.setUint32(20, height);
  return bytes;
};

describe('ratioFromBytes', () => {
  it('reads an SVG viewBox', () => {
    expect(ratioFromBytes('a.svg', svg('viewBox="0 0 300 40"'))).toEqual({ ok: true, ratio: 7.5 });
  });

  it('accepts a viewBox with negative origins and comma separators', () => {
    expect(ratioFromBytes('a.svg', svg('viewBox="-10,-5, 100, 50"'))).toEqual({
      ok: true,
      ratio: 2,
    });
  });

  it('prefers the viewBox over width/height attributes', () => {
    /* The attributes describe a rendered size that ignores the real artwork. */
    const bytes = svg('width="16" height="16" viewBox="0 0 300 40"');
    expect(ratioFromBytes('a.svg', bytes)).toEqual({ ok: true, ratio: 7.5 });
  });

  it('falls back to width/height when there is no viewBox', () => {
    expect(ratioFromBytes('a.svg', svg('width="120" height="60"'))).toEqual({ ok: true, ratio: 2 });
  });

  it('reports an SVG carrying no dimensions at all', () => {
    expect(ratioFromBytes('a.svg', svg('fill="red"'))).toEqual({
      ok: false,
      reason: 'no-dimensions',
    });
  });

  it('rejects a zero-height viewBox rather than returning Infinity', () => {
    expect(ratioFromBytes('a.svg', svg('viewBox="0 0 300 0"'))).toEqual({
      ok: false,
      reason: 'invalid-dimensions',
    });
  });

  it('reads PNG dimensions from the IHDR chunk', () => {
    expect(ratioFromBytes('a.png', png(150, 150))).toEqual({ ok: true, ratio: 1 });
    expect(ratioFromBytes('a.png', png(100, 200))).toEqual({ ok: true, ratio: 0.5 });
  });

  it('is case-insensitive about the SVG extension', () => {
    expect(ratioFromBytes('A.SVG', svg('viewBox="0 0 10 5"'))).toEqual({ ok: true, ratio: 2 });
  });

  it('reports an unsupported format for anything else', () => {
    expect(ratioFromBytes('a.jpg', new Uint8Array([0xff, 0xd8, 0xff]))).toEqual({
      ok: false,
      reason: 'unsupported-format',
    });
  });

  it('does not mistake a short buffer for a PNG', () => {
    expect(ratioFromBytes('a.png', new Uint8Array(8))).toEqual({
      ok: false,
      reason: 'unsupported-format',
    });
  });
});

describe('logoHeightForRatio', () => {
  const px = (css: string) => Number(/clamp\([\d.]+px, [\d.]+vw, ([\d.]+)px\)/.exec(css)?.[1]);

  it('gives a square logo the base height', () => {
    expect(px(logoHeightForRatio(1))).toBe(46);
  });

  it('holds area constant across shapes, which is the whole point', () => {
    /* height = base / sqrt(ratio), so width * height stays put. */
    const ratio = 2.25;
    const height = px(logoHeightForRatio(ratio));
    expect(height).toBe(Math.round(46 / Math.sqrt(ratio)));
    expect(height * ratio * height).toBeCloseTo(46 * 46, -2);
  });

  it('clamps very wide wordmarks up to a readable floor', () => {
    /* Equal-area would put a 20:1 mark at ~10px. */
    expect(px(logoHeightForRatio(20))).toBe(22);
  });

  it('clamps very tall marks down so they stay inside the card', () => {
    expect(px(logoHeightForRatio(0.2))).toBe(56);
  });

  it('applies the per-logo scale override', () => {
    expect(px(logoHeightForRatio(1, 1.15))).toBe(53);
    expect(px(logoHeightForRatio(1, 0.85))).toBe(39);
  });

  it('shrinks to 75% at the narrow end of the clamp', () => {
    const css = logoHeightForRatio(1);
    expect(css).toBe('clamp(35px, 8.97vw, 46px)');
  });
});
