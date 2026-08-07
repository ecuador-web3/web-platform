# Architecture

A static Astro build. No client framework, no data fetching, no database. Every
page is rendered at build time and shipped as HTML plus a small amount of
hand-written DOM wiring.

## The three layers

| Layer | Holds | Rule |
|---|---|---|
| `src/data/site.ts` | Copy, dates, partner lists, links | Values only. If it computes, it does not belong here. |
| `src/lib/` | Seat curve, countdown, date formatting, logo sizing, roulette engine, URL safety | Pure and tested. No DOM at module scope. |
| `src/components/` | Markup, and the wiring that moves `lib` results into the DOM | Thin. A branch worth testing is a sign something belongs in `lib`. |

The reason for the split is testability. Logic that lives inside an Astro
`<script>` block cannot be imported by a test runner, so it never gets tested
and slowly accumulates bugs nobody can see. Everything with real behaviour was
moved out.

## Sections

`src/pages/index.astro` composes seven pieces, each a full-height section:

`Nav`, `Hero`, `HappeningNow`, `WhatsHappening`, `Ecosystem`, `JoinMovement`,
`Footer`.

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

## The ticket (`WhatsHappening`)

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
