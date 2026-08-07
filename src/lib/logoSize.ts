/**
 * Optical normalization for partner logos.
 *
 * Sizing a mixed set of logos to a uniform height makes wide wordmarks dominate;
 * a uniform width makes square marks tower over everything. Both are the classic
 * "logo soup" failure. The fix is to size by aspect ratio:
 *
 *   width = (w / h) ** EXPONENT * BASE
 *
 * At EXPONENT 0.5 every logo ends up covering the same *area* regardless of
 * shape, which is much closer to how the eye judges "same size" than either
 * dimension on its own. 0 would be equal-width, 1 equal-height.
 *
 * Dimensions are read off disk at build time, so dropping a file into
 * public/logos/ is all a new partner needs — no hand-tuning, no CMS fields. The
 * per-item `scale` in site.ts stays for the occasional outlier, since this
 * accounts for a logo's box but not its ink density: a solid blocky mark still
 * reads heavier than an airy line one at identical area.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Height in px that a perfectly square logo receives. */
const BASE = 46;
const EXPONENT = 0.5;

/* Wordmarks past ~6:1 would normalize down to unreadable, and near-square marks
   would outgrow the tile. Clamping trades exact equal-area for legibility. */
const MIN_HEIGHT = 22;
const MAX_HEIGHT = 56;

/**
 * A px height expressed so it shrinks to 75% on narrow screens and reaches full
 * size from ~520px up. Wordmark tiles shrink with the viewport via their own
 * clamp; without this the logos would hold full size and start to shout over
 * the names they sit beside.
 */
function responsive(height: number): string {
  const small = Math.round(height * 0.75);
  /* 1vw is 3.9px at a 390px viewport, so this coefficient lands exactly on
     `small` there and is clamped away above ~520px. */
  const vw = (small / 3.9).toFixed(2);
  return `clamp(${small}px, ${vw}vw, ${height}px)`;
}

/** Tallest box any logo can occupy — rows stay aligned by reserving it for all. */
export const LOGO_BOX = responsive(MAX_HEIGHT);

const ratioCache = new Map<string, number | null>();

/** Intrinsic width/height of a file in public/, or null if it can't be read. */
function intrinsicRatio(publicPath: string): number | null {
  const cached = ratioCache.get(publicPath);
  if (cached !== undefined) return cached;

  let ratio: number | null = null;
  try {
    const buf = readFileSync(join(process.cwd(), 'public', publicPath.replace(/^\//, '')));

    if (publicPath.toLowerCase().endsWith('.svg')) {
      /* viewBox is the honest source: width/height attributes are often absent
         or set to a rendered size that ignores the artwork's real proportions. */
      const head = buf.toString('utf8', 0, 4096);
      const viewBox = head.match(
        /viewBox\s*=\s*["']\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)/i,
      );
      if (viewBox) {
        ratio = Number(viewBox[1]) / Number(viewBox[2]);
      } else {
        const w = head.match(/\bwidth\s*=\s*["']([\d.]+)/i);
        const h = head.match(/\bheight\s*=\s*["']([\d.]+)/i);
        if (w && h) ratio = Number(w[1]) / Number(h[1]);
      }
    } else if (buf.length > 24 && buf.toString('ascii', 12, 16) === 'IHDR') {
      /* PNG: IHDR carries width and height as big-endian uint32s. */
      ratio = buf.readUInt32BE(16) / buf.readUInt32BE(20);
    }
  } catch {
    ratio = null;
  }

  if (!ratio || !Number.isFinite(ratio) || ratio <= 0) ratio = null;
  ratioCache.set(publicPath, ratio);
  return ratio;
}

/**
 * Rendered height for a logo, as a CSS length. Falls back to a square
 * assumption when the file is missing or its format carries no readable
 * dimensions — the tile still looks deliberate, just less precisely tuned.
 */
export function logoHeight(publicPath: string, scale = 1): string {
  const ratio = intrinsicRatio(publicPath) ?? 1;
  const height = (BASE / Math.pow(ratio, EXPONENT)) * scale;
  return responsive(Math.round(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, height))));
}
