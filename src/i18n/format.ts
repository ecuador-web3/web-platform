/**
 * The `{name}` placeholder contract, shared by the build and the browser.
 *
 * This is deliberately separate from `./index`, which imports the locale JSON.
 * A client script that needs to refill a string on the fly can import from here
 * without dragging the whole content tree into the bundle.
 *
 * The two exports differ only in what an unfilled slot means, which is a
 * property of where they run rather than of the templates themselves.
 */
import { ConfigError } from '../lib/errors';

const PLACEHOLDER = /\{(\w+)\}/g;

export type FormatVars = Record<string, string | number>;

/**
 * Fills `{name}` slots, throwing on a slot with no value.
 *
 * Build-time default. A translator dropping or misspelling a placeholder is the
 * one class of error that editing a locale file can actually introduce, so it
 * stops the deploy rather than printing a literal `{remaining}` to visitors.
 */
export function format(template: string, vars: FormatVars = {}): string {
  return template.replace(PLACEHOLDER, (_match, name: string) => {
    const value = vars[name];
    if (value === undefined) {
      throw new ConfigError('missing-placeholder', `No value for "{${name}}" in: "${template}"`, {
        placeholder: name,
        template,
      });
    }
    return String(value);
  });
}

/**
 * Fills `{name}` slots, leaving an unfilled slot visible.
 *
 * For the browser, where throwing would take out the rest of the script and
 * leave the page half-painted. A stray `{remaining}` on screen is a bug someone
 * can see and report; a sentence with a hole in it is one nobody notices.
 */
export function formatLoose(template: string, vars: FormatVars): string {
  return template.replace(PLACEHOLDER, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}
