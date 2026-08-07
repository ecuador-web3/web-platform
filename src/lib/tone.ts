/**
 * The flag palette, as a closed set.
 *
 * Every section tints itself from the same five tones. Before this module each
 * component carried its own `Record<string, …>` lookup table, which meant the
 * class strings were duplicated four times and — because the key type was
 * `string` — a typo in the content file type-checked fine and then threw at
 * render on the first property access. Keying by `Tone` makes the lookup total:
 * a bad tone is now a compile error in `site.ts`, not a blank page.
 */
export const TONES = ['yellow', 'blue', 'red', 'bone', 'ink'] as const;

export type Tone = (typeof TONES)[number];

export interface ToneStyles {
  /** Rotated chip: background plus the text colour that reads on it. */
  sticker: string;
  /** Solid fill for a hairline rule or progress bar. */
  rule: string;
  /** Full card fill plus the text colour that reads on it. */
  surface: string;
  /** Body copy sitting on `surface`. */
  surfaceMuted: string;
  /** Decorative numeral sitting on `surface`. */
  surfaceFaint: string;
  /** Button sitting on `surface`, including its hover. */
  surfaceAction: string;
}

export const TONE_STYLES: Record<Tone, ToneStyles> = {
  yellow: {
    sticker: 'bg-ec-yellow text-ec-ink',
    rule: 'bg-ec-yellow',
    surface: 'bg-ec-yellow text-ec-ink',
    surfaceMuted: 'text-ec-ink/70',
    surfaceFaint: 'text-ec-ink/35',
    surfaceAction: 'bg-ec-ink text-ec-bone hover:bg-ec-red',
  },
  blue: {
    sticker: 'bg-ec-blue text-ec-bone',
    rule: 'bg-ec-blue',
    surface: 'bg-ec-blue text-ec-bone',
    surfaceMuted: 'text-ec-bone/70',
    surfaceFaint: 'text-ec-bone/35',
    surfaceAction: 'bg-ec-yellow text-ec-ink hover:bg-ec-bone',
  },
  red: {
    sticker: 'bg-ec-red text-ec-bone',
    rule: 'bg-ec-red',
    surface: 'bg-ec-red text-ec-bone',
    surfaceMuted: 'text-ec-bone/70',
    surfaceFaint: 'text-ec-bone/35',
    surfaceAction: 'bg-ec-yellow text-ec-ink hover:bg-ec-bone',
  },
  bone: {
    sticker: 'bg-ec-bone text-ec-ink',
    rule: 'bg-ec-bone',
    surface: 'bg-ec-bone text-ec-ink',
    surfaceMuted: 'text-ec-ink/65',
    surfaceFaint: 'text-ec-ink/30',
    surfaceAction: 'bg-ec-ink text-ec-bone hover:bg-ec-blue',
  },
  ink: {
    sticker: 'bg-ec-ink text-ec-bone',
    rule: 'bg-ec-ink',
    surface: 'bg-ec-ink text-ec-bone',
    surfaceMuted: 'text-ec-bone/65',
    surfaceFaint: 'text-ec-bone/30',
    surfaceAction: 'bg-ec-yellow text-ec-ink hover:bg-ec-bone',
  },
};
