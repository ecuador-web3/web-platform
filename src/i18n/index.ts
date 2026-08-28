/**
 * The site's copy layer.
 *
 * Every user-visible string lives in a locale JSON file, never in a component.
 * `src/data/site.ts` keeps the other half — colours, links, ISO dates, seat
 * counts, logo files — because those are identical in every language and would
 * only drift if each translation carried its own copy of them.
 *
 * To add a language: duplicate `es.json`, translate the values, leave the keys
 * alone, then add it to `LOCALES` below. The `satisfies` clause turns a missing
 * or misspelled key into a type error instead of a blank spot on the page.
 */
import es from './es.json';

/** Re-exported so components have one import for copy and the filler alike. */
export { format, formatLoose, type FormatVars } from './format';

/** The shape every locale file has to match, inferred from the Spanish one. */
export type Copy = typeof es;

const LOCALES = { es } satisfies Record<string, Copy>;

export type LocaleCode = keyof typeof LOCALES;

export const DEFAULT_LOCALE: LocaleCode = 'es';

/**
 * The active copy. A single-locale site resolves this once at build time; when
 * routing per language arrives, swap this for `localeCopy(Astro.currentLocale)`
 * and nothing in the components has to change.
 */
export const copy: Copy = LOCALES[DEFAULT_LOCALE];

export function localeCopy(code: LocaleCode): Copy {
  return LOCALES[code];
}

/**
 * Strings the copy file does not store because they are two other strings put
 * together. Kept here so a translator edits the motto once and every rendering
 * of it follows, instead of three copies drifting apart.
 */
const motto = `${copy.brand.motto.lead} ${copy.brand.motto.tail}`;

export const derived = {
  /** The motto on one line. `join.closing` sets the halves on separate lines. */
  motto,
  metaDescription: `${copy.brand.promise} ${motto}`,
  /** The equator strip: who we are, where, and the latitude that names it. */
  equatorTicker: [copy.brand.name, copy.brand.place, copy.brand.coords],
};
