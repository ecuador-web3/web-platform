# Architecture

A static Astro build. No client framework, no data fetching, no database. Every
page is rendered at build time and shipped as HTML plus a small amount of
hand-written DOM wiring.

## The three layers

| Layer | Holds | Rule |
|---|---|---|
| `src/i18n/<lang>.json` | Every string a visitor reads | Text only. No component ever hardcodes a word. |
| `src/data/site.ts` | Tones, links, ISO dates, seat counts, partner registry | Values only, and only ones that survive translation. If it computes, it does not belong here. |
| `src/lib/` | Seat curve, countdown, date formatting, logo sizing, URL safety | Pure and tested. No DOM at module scope. |
| `src/components/` | Markup, and the wiring that moves `lib` results into the DOM | Thin. A branch worth testing is a sign something belongs in `lib`. |

The reason for the split is testability. Logic that lives inside an Astro
`<script>` block cannot be imported by a test runner, so it never gets tested
and slowly accumulates bugs nobody can see. Everything with real behaviour was
moved out.

## Copy and translations

`src/i18n/es.json` is the whole of the site's text — headings, buttons, `aria`
labels, the `<title>`, the strings the ticket script paints after the clock
moves. A component reads `copy.<section>.<key>`; it never spells a word out.

Adding a language is one file: duplicate `es.json`, translate the values, leave
the keys, register it in `src/i18n/index.ts`. The `LOCALES` map is declared
`satisfies Record<string, Copy>`, so a key a translator dropped or renamed is a
type error rather than a blank spot on the page.

The split against `site.ts` is by what a translation would change. Colours,
links, ISO instants, seat counts and logo files are the same in every language
and stay in `site.ts`, which joins the two halves into the shapes components
already consumed. Partner and social names sit in the JSON because they are
visible text, even though nobody will translate "ESPOL". Their logos and URLs
stay in the registry, paired to the name by key.

Interpolated strings use `{name}` slots filled by `format()`. A slot with no
value throws a `ConfigError` and stops the build: a translator dropping or
misspelling a placeholder is the one error editing a JSON file can actually
introduce, and `src/i18n/copy.test.ts` walks every string to catch it earlier.

Client scripts are the exception to "import the copy module". `WhatsHappening`
and `Ecosystem` receive their handful of strings as data attributes, so the
browser downloads eleven strings and two words rather than the whole content
tree.

## Sections

`src/pages/index.astro` composes eight pieces, each a full-height section:

`Nav`, `Hero`, `HappeningNow`, `NextEvent`, `CommunityCalls`, `Ecosystem`,
`JoinMovement`, `Footer`.

`NextEvent` and `CommunityCalls` were one `WhatsHappening` component. They share
no state and never did; the single file just made that hard to see, and at 600
lines the ticket's client script sat a long way from the markup it drives.

Sections declare `data-nav-theme` (`dark` / `light` / `blue` / `red`). A thin
observer band pinned under the nav in `Base.astro` recolours the navigation to
match whatever section is underneath it.

## Tone system

Five tones (`yellow`, `blue`, `red`, `bone`, `ink`) drawn from the flag palette.
`src/lib/tone.ts` owns the `Tone` union and one `TONE_STYLES` table keyed by it.

Content declares a tone; components read the slice they need (`sticker`, `rule`,
`surface`, `surfaceMuted`, `surfaceFaint`, `surfaceAction`). Because the table is
`Record<Tone, ToneStyles>` rather than `Record<string, …>`, a tone that does not
exist is a compile error in `site.ts` instead of a crash at render.

## Scroll reveal

`Base.astro` reveals `[data-reveal]` elements with a position sweep rather than
an `IntersectionObserver`. The observer only fires on a state *change*, so an
instant jump (anchor link, browser back, restored scroll position) can move an
element from not-intersecting straight back to not-intersecting with no callback
in between, leaving whole sections stuck at `opacity: 0`. Comparing positions has
no such gap. The pending list shrinks to empty and the listeners detach.

## When a failure throws and when it returns

Two shapes, picked by whether the caller has anything useful to do about it.

**Fatal, so it throws `ConfigError`.** `countdownFrom`, `seatsAt` and `format`
all take developer-authored config. None of a bad date, a capacity of zero, or
a placeholder no value was passed for has a sensible fallback, and each would
otherwise ship a page rendering `NaN`, an empty countdown, or a sentence with a
hole in it. Throwing stops the build at the commit that introduced the
typo. The error carries a code and scalar context so the build log names it.

**Recoverable, so it returns a result.** `logoSize` returns
`{ ok: false, reason }` for a logo it cannot measure, because there *is* a
sensible answer: fall back to square sizing, warn, and keep building. One
unmeasurable partner logo should not block a deploy.

The test is whether the caller can carry on. If it can, hand it a value it can
branch on; if it cannot, fail the build rather than inventing one.

## The ticket (`NextEvent`)

Two derived displays, both rendered server-side as the no-JS fallback and
recomputed on load:

- **Countdown**, from `nextEvent.startsAt`. `lib/countdown.ts` returns a
  discriminated state, so "already started" is a variant the template has to
  handle rather than a countdown of zero.
- **Seat meter**, from the `seats` curve. `lib/seats.ts` derives reserved,
  remaining, percentage and sold-out from a single count, so they cannot drift.

Every printed date comes from `startsAt` through `lib/eventDate.ts`, pinned to
`America/Guayaquil`. The date is Ecuador's, not the visitor's, and not the build
machine's.

## The partner roulettes (`Ecosystem`)

Three columns, each cycling through its category. `src/lib/deck.ts` holds the
whole model and exports it piecewise:

- `signedDistance` wraps a card's position into `[-n/2, n/2)`, which is what
  makes a card leaving the top reappear at the bottom with no seam.
- `placeCard` maps distance to transform, opacity, z-index and hit-testing.
  Cards past 1.6 away are fully transparent, which is exactly why they can be
  repositioned mid-wrap without anything visibly jumping.
- `targetSpeed` maps a `PointerPhase` (`idle` / `hover` / `press` / `hold`) plus
  keyboard focus and the section's pause state to a speed.
- `settleOffset` eases a stopped column onto the nearest card.

The component contributes one animation frame for all three columns, the pause
control, and the reduced-motion default.

### Accessibility

Continuous motion needs a stop (WCAG 2.2.2), so the section owns a pause button
that doubles as the play control for visitors on reduced-motion settings, where
the columns stay still until asked. All partners stay in the DOM and the
accessibility tree at all times; only the centred card's link takes a tab stop.
Pausing keys off `:focus-visible` rather than plain focus, because clicking a
`tabindex="0"` element focuses it too, and treating that as a pause parked the
column permanently after any click.

## Logo normalization

`src/lib/logoSize.ts`. Sizing a mixed logo set to a uniform height makes wide
wordmarks dominate; uniform width makes square marks tower. The fix is to size by
aspect ratio:

```
width = (w / h) ** 0.5 * BASE
```

At exponent `0.5` every logo covers the same *area* regardless of shape, which is
much closer to how the eye judges "same size" than either dimension alone.
Heights clamp to 22-56px so a very wide wordmark stays readable, and scale to 75%
on narrow screens so they do not shout over the wordmarks beside them.

Dimensions are read off disk at build time from the SVG `viewBox` or the PNG
IHDR chunk. Parsing is split from the file read (`ratioFromBytes`) so the format
handling can be tested from in-memory fixtures. A file that cannot be measured
falls back to square sizing and logs a build warning naming the file.

## Security

Partner URLs are developer-authored config rather than visitor input, but they
reach both `<a href>` and `window.open`, where a `javascript:` or `data:` value
would execute. `lib/url.ts` checks the scheme at the single point URLs enter the
page; anything that is not `http:` or `https:` renders as plain text with no link.
