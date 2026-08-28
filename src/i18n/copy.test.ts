import { describe, expect, it } from 'vitest';
import { ConfigError } from '../lib/errors';
import { copy } from './index';
import { format, formatLoose } from './format';
import { EMPTY_TICKET_COPY, ticketCopy } from './ticketCopy';
import es from './es.json';

describe('format', () => {
  it('fills a placeholder', () => {
    expect(format('Quedan {remaining} cupos', { remaining: 4 })).toBe('Quedan 4 cupos');
  });

  it('fills the same placeholder everywhere it appears', () => {
    expect(format('{a} y {a}', { a: 'x' })).toBe('x y x');
  });

  it('fills a zero, which is a value and not a missing one', () => {
    expect(format('{remaining} cupos', { remaining: 0 })).toBe('0 cupos');
  });

  it('leaves a string with no placeholders alone', () => {
    expect(format('Desliza')).toBe('Desliza');
  });

  it('ignores braces that are not placeholders', () => {
    expect(format('{ spaced } and {} stay put')).toBe('{ spaced } and {} stay put');
  });

  it('throws on a placeholder with no value, rather than printing the braces', () => {
    expect(() => format('Quedan {remaining} cupos')).toThrow(ConfigError);
  });
});

describe('formatLoose', () => {
  it('fills the same way as format', () => {
    expect(formatLoose('Quedan {remaining} cupos', { remaining: 4 })).toBe('Quedan 4 cupos');
  });

  it('leaves an unfilled placeholder visible instead of throwing', () => {
    /* In the browser a throw takes out the rest of the script and leaves the
       page half-painted, so this one degrades in view of the reader. */
    expect(formatLoose('Quedan {remaining} cupos', {})).toBe('Quedan {remaining} cupos');
  });

  it('fills what it can and leaves the rest', () => {
    expect(formatLoose('{a} y {b}', { a: 'x' })).toBe('x y {b}');
  });
});

describe('ticketCopy', () => {
  it('carries a string for every key the client script reads', () => {
    const blank = Object.entries(ticketCopy(copy.event))
      .filter(([, value]) => value.trim() === '')
      .map(([key]) => key);

    expect(blank).toEqual([]);
  });

  it('has a blank fallback for every key, so a short payload cannot leave one undefined', () => {
    expect(Object.keys(EMPTY_TICKET_COPY).sort()).toEqual(Object.keys(ticketCopy(copy.event)).sort());
  });
});

/**
 * A translator edits values, never keys — but a placeholder lives inside a
 * value, so it is the one thing a translation can break without any of the
 * type-level guards noticing. Walking the file keeps that honest: a typo like
 * `{remainig}` fails here instead of throwing mid-render.
 */
const KNOWN_PLACEHOLDERS = new Set([
  'brand',
  'capacity',
  'coords',
  'count',
  'day',
  'label',
  'promise',
  'remaining',
  'reserved',
  'time',
  'year',
]);

/* `unknown` rather than a JSON type: the point of this walk is that it makes no
   assumption about the shape, so it keeps working as the copy file grows. */
function* strings(value: unknown, path = ''): Generator<[string, string]> {
  if (typeof value === 'string') {
    yield [path, value];
  } else if (Array.isArray(value)) {
    for (const [i, item] of value.entries()) yield* strings(item, `${path}[${i}]`);
  } else if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      yield* strings(item, path ? `${path}.${key}` : key);
    }
  }
}

/* `_readme` documents the format for whoever translates the file. It is notes
   about the copy, not copy, so it sits outside both checks below — it is the
   one place a literal placeholder is meant to appear unfilled. */
const { _readme, ...rendered } = es;

describe('es.json', () => {
  it('only uses placeholders the components know how to fill', () => {
    const unknown: string[] = [];

    for (const [path, value] of strings(rendered)) {
      for (const [, name] of value.matchAll(/\{(\w+)\}/g)) {
        if (!KNOWN_PLACEHOLDERS.has(name)) unknown.push(`${path}: {${name}}`);
      }
    }

    expect(unknown).toEqual([]);
  });

  it('has no empty strings, which would render as a blank spot on the page', () => {
    const blank = [...strings(rendered)]
      .filter(([, value]) => value.trim() === '')
      .map(([path]) => path);

    expect(blank).toEqual([]);
  });

  it('is what `copy` resolves to', () => {
    expect(copy.brand.name).toBe('Ecuador Web3');
    expect(copy.locale.lang).toBe('es');
  });
});
