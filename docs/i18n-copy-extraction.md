# Copy extraction and the i18n layer

**Status:** complete (2026-08-11)

## Goal

Every string a visitor reads lives in one JSON file, so adding a language means
translating that file rather than hunting text across nine components.

## Context

Copy was in three places at once. `src/data/site.ts` held most of it mixed in
with tones, links and ISO dates. Section headings, button labels, `aria`
labels, the `<title>` and the ticket's seat and countdown wording were written
straight into components. Two client scripts carried Spanish string literals
that no translation could have reached at all.

## Plan

1. Write `src/i18n/es.json` from a full sweep of every rendered string.
2. Add the loader: typed `copy`, `format()` for `{placeholder}` slots.
3. Reduce `site.ts` to non-translatable config and have it join the two halves.
4. Rewire the components; give client scripts their strings via data attributes.
5. Split `WhatsHappening` into `NextEvent` and `CommunityCalls`.
6. Prove the rendered page did not change.

All six done.

## Decisions

**Split by what a translation changes, not by file type.** Tones, links, ISO
instants, seat counts and logo paths are the same in every language, so they
stay in `site.ts`; a second locale would otherwise carry its own copy of them
and they would drift. Everything else is in the JSON.

**Partner and social names are in the JSON** even though nobody translates
"ESPOL". They are visible text, and a translator opening the file to find them
missing would reasonably wonder what else was. Their logos and URLs stay in the
registry, paired by key; a key in only one of the two is a type error.

**`format()` throws rather than returning a result.** A missing placeholder has
no sensible fallback, and this matches the existing convention documented in
`architecture.md`: fatal config faults throw, recoverable ones return a value.
Considered and rejected returning `Result` here, which would have made `format`
inconsistent with `countdownFrom` and `seatsAt` and pushed `.ok` checks into
every template expression.

**Client scripts get data attributes, not imports.** Importing the copy module
into a `<script>` would pull every locale string into the browser bundle. The
ticket's eleven strings ride on one `data-copy` attribute; the shared
`TicketCopy` type keeps both ends of that hop agreeing on the keys, since a
rename would otherwise silently paint an empty string.

**Placeholder logic lives in `format.ts`, apart from the loader.** That module
has no JSON import, which is what lets the client take `formatLoose` without
the content tree. `format` throws for the build, `formatLoose` leaves an
unfilled slot visible for the browser, where a throw would leave the page
half-painted.

**Strings built from other strings have no key.** The motto appeared in three
places and was written out three times. It is now two halves in `brand.motto`,
composed by `derived`. Same for the meta description, the equator strip, the
ticket's modality badge, and the Onboarding footnote link.

**Meta description is derived, not authored.** It is currently `brand.promise`
plus the motto verbatim. If it ever needs to diverge for SEO, add the key back
then rather than carry a duplicate now.

## Verification

`npm run verify`: 0 type errors, 63 tests, clean build.

Output equivalence was checked by building the pre-refactor commit in a git
worktree and diffing the rendered HTML. The only differences are intentional:
the `data-intl-locale` attribute, `data-copy` replacing `data-cta-*`, the pause
and resume labels on the ecosystem toggle, a reordering of three badge utility
classes, and `&nbsp;` becoming a regular space in the seat suffix (the parent
already carries `whitespace-nowrap`, so it cannot break either way).

Separately, every visible string and `aria` label was extracted from the built
page and checked against the JSON; everything not matched is a filled template
or a computed date.

## Files

Added: `src/i18n/{es.json,index.ts,format.ts,ticketCopy.ts,copy.test.ts,README.md}`,
`src/components/{NextEvent,CommunityCalls}.astro`, this doc.

Removed: `src/components/WhatsHappening.astro`.

Modified: `src/data/site.ts`, `src/lib/{errors.ts,eventDate.ts}`,
`src/layouts/Base.astro`, `src/pages/index.astro`,
`src/components/{Hero,Nav,HappeningNow,Ecosystem,JoinMovement,Footer}.astro`,
`docs/architecture.md`.

## Deferred

`docs/architecture.md` still describes a partner-roulette engine at
`src/lib/deck.ts`, which no longer exists; the Ecosystem section became CSS
marquees in commit `713ec53`. Out of scope here and left alone.
