# Copy

`es.json` holds every string the site renders. No component spells out a word.

## Changing wording

Edit the value in `es.json`. That is the whole change.

## Adding a language

1. `cp es.json en.json`
2. Translate the values. Leave every key exactly as it is.
3. Register it in `index.ts`:

   ```ts
   import en from './en.json';

   const LOCALES = { es, en } satisfies Record<string, Copy>;
   ```

   A key you dropped or renamed fails `npm run check` here, naming the key.

4. Point `DEFAULT_LOCALE` at it, or wire per-language routes with
   [Astro i18n routing](https://docs.astro.build/en/guides/internationalization/)
   and swap `copy` for `localeCopy(Astro.currentLocale)`.

## Rules for translators

- **`{braces}` are placeholders.** `Últimos {remaining} cupos` becomes
  `Últimos 7 cupos` at render. Keep the spelling; move it inside the sentence if
  the grammar needs it. A dropped or misspelled placeholder fails the build.
- **`locale` is not copy.** `lang` is the BCP 47 tag for `<html lang>`, `intl`
  the one `Intl` formats dates and numbers with, `og` the Open Graph form.
- **Leave proper nouns alone**: `ecosystem.partners`, `footer.socials`,
  `event.hosts`. They are there so the file is complete, not to be translated.
- **`_readme` is notes**, not text anyone sees.

## Strings built from other strings

A few renderings are two keys put together, so they have no key of their own.
`src/i18n/index.ts` exports them as `derived`:

| Rendering | Built from |
|---|---|
| `derived.motto` | `brand.motto.lead` + `brand.motto.tail` |
| `derived.metaDescription` | `brand.promise` + the motto |
| `derived.equatorTicker` | `brand.name`, `brand.place`, `brand.coords` |

Two more are composed in the component that needs them: the ticket's first
badge is `event.modality`, and the "first time here?" footnote links using the
Onboarding call's own title.

Edit the source key and every use follows. That is the point: the motto appears
in three places and used to be written out three times, which is exactly the
kind of thing that goes stale one edit at a time.

## What is not in here

Colours, links, ISO dates, seat counts and logo paths are identical in every
language, so they live in `src/data/site.ts` and are shared. That file joins the
two halves back together into the shapes the components read.

Adding a partner therefore touches two files: the name in
`ecosystem.partners` here, its logo and URL in the registry in `site.ts`. The
key ties them, and a key that exists in only one of the two is a type error.
