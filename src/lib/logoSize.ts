/**
 * Optical normalization for partner logos.
 *
 * Sizing a mixed set of logos to a uniform height makes wide wordmarks
 * dominate; a uniform width makes square marks tower over everything. Both are
 * the classic "logo soup" failure. The fix is to size by aspect ratio:
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

/** Why a file yielded no usable dimensions. */
export type LogoRatioFailure =
  | 'unreadable'
  | 'unsupported-format'
  | 'no-dimensions'
  | 'invalid-dimensions';

export type LogoRatioResult =
  | { readonly ok: true; readonly ratio: number }
  | { readonly ok: false; readonly reason: LogoRatioFailure };

const PNG_IHDR = [0x49, 0x48, 0x44, 0x52]; /* "IHDR" */
const SVG_HEAD_BYTES = 4096;

function isPng(bytes: Uint8Array): boolean {
  return bytes.length > 24 && PNG_IHDR.every((byte, i) => bytes[12 + i] === byte);
}

function svgRatio(bytes: Uint8Array): LogoRatioResult {
  const head = new TextDecoder().decode(bytes.subarray(0, SVG_HEAD_BYTES));

  /* viewBox is the honest source: width/height attributes are often absent or
     set to a rendered size that ignores the artwork's real proportions. */
  const viewBox = head.match(
    /viewBox\s*=\s*["']\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)/i,
  );
  if (viewBox) return ratioOf(Number(viewBox[1]), Number(viewBox[2]));

  const width = head.match(/\bwidth\s*=\s*["']([\d.]+)/i);
  const height = head.match(/\bheight\s*=\s*["']([\d.]+)/i);
  if (width && height) return ratioOf(Number(width[1]), Number(height[1]));

  return { ok: false, reason: 'no-dimensions' };
}

function ratioOf(width: number, height: number): LogoRatioResult {
  const ratio = width / height;
  if (!Number.isFinite(ratio) || ratio <= 0) return { ok: false, reason: 'invalid-dimensions' };
  return { ok: true, ratio };
}

/**
 * Intrinsic width/height from a logo file's bytes.
 *
 * Kept free of the filesystem so the format handling — the part with all the
 * branches — can be exercised directly from in-memory fixtures.
 */
export function ratioFromBytes(fileName: string, bytes: Uint8Array): LogoRatioResult {
  if (fileName.toLowerCase().endsWith('.svg')) return svgRatio(bytes);

  /* PNG: IHDR carries width and height as big-endian uint32s. */
  if (isPng(bytes)) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    return ratioOf(view.getUint32(16), view.getUint32(20));
  }

  return { ok: false, reason: 'unsupported-format' };
}

const ratioCache = new Map<string, LogoRatioResult>();

function readRatio(publicPath: string): LogoRatioResult {
  const cached = ratioCache.get(publicPath);
  if (cached) return cached;

  let result: LogoRatioResult;
  try {
    const bytes = readFileSync(join(process.cwd(), 'public', publicPath.replace(/^\//, '')));
    result = ratioFromBytes(publicPath, bytes);
  } catch {
    result = { ok: false, reason: 'unreadable' };
  }

  if (!result.ok) {
    /* Loud rather than silent: a mistyped path used to fall back to a square
       and look merely "a bit off" on the page, which is far harder to spot
       than a line in the build log. */
    console.warn(
      `[logoSize] ${publicPath}: ${result.reason} — falling back to square sizing. ` +
        'Check the file exists in public/ and is an SVG with a viewBox, or a PNG.',
    );
  }

  ratioCache.set(publicPath, result);
  return result;
}

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

/** Rendered height for a logo of the given aspect ratio, as a CSS length. */
export function logoHeightForRatio(ratio: number, scale = 1): string {
  const height = (BASE / Math.pow(ratio, EXPONENT)) * scale;
  return responsive(Math.round(Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, height))));
}

/**
 * Rendered height for a logo in `public/`. Falls back to a square assumption
 * when the file cannot be measured — the tile still looks deliberate, just less
 * precisely tuned, and the build log says which file needs attention.
 */
export function logoHeight(publicPath: string, scale = 1): string {
  const result = readRatio(publicPath);
  return logoHeightForRatio(result.ok ? result.ratio : 1, scale);
}
