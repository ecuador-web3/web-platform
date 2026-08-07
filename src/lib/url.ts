/**
 * Outbound link safety.
 *
 * Partner URLs are developer-authored config rather than visitor input, so this
 * is a guard against a mistake rather than an attack. It still matters: an
 * unvalidated href reaches both `<a href>` and `window.open`, and a `javascript:`
 * or `data:` value in either position executes. Checking the scheme at the one
 * place URLs enter the page costs nothing and closes the hole permanently.
 */
const SAFE_PROTOCOLS: readonly string[] = ['http:', 'https:'];

export function isSafeExternalUrl(value: string): boolean {
  try {
    return SAFE_PROTOCOLS.includes(new URL(value).protocol);
  } catch {
    /* Relative or malformed: not something to open in a new tab. */
    return false;
  }
}

/**
 * The URL if it is safe to link to, otherwise `undefined` so callers render the
 * partner without a link rather than with a dangerous one.
 */
export function safeExternalUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return isSafeExternalUrl(value) ? value : undefined;
}
