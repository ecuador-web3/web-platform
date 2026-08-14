# Architecture

A static Astro build. No client framework, no database, and no data fetching at
runtime; one feed is read at build time and baked in. Every page is rendered
during the build and shipped as HTML plus a small amount of hand-written DOM
wiring.

## The layers

| Layer | Holds | Rule |
|---|---|---|
| `src/i18n/<lang>.json` | Every string a visitor reads | Text only. No component ever hardcodes a word. |
| `src/data/site.ts` | Tones, links, seat counts, partner registry | Values only, and only ones that survive translation. If it computes, it does not belong here. |
| `src/data/luma.ts` | The Luma calendar | The only module that touches the network, so there is one place to look for it. Fetches bytes; decides nothing. |
| `src/lib/` | Seat curve, countdown, date formatting, ICS and JSON reading, event selection, logo sizing, URL safety | Pure and tested. No DOM at module scope. |
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

## The event calendar (Luma)

The schedule used to be three hand-written strings in `site.ts`, so the ticket
advertised whatever event was current the day somebody last edited the file. It
went stale exactly as you would expect. The dates now come from the community's
Luma calendar (`cal-3EjE08k52VN0cif`, the one behind `luma.com/user/ecuadorweb3`).

**Two sources, on purpose.** `calendar/get-items` is Luma's own JSON and the
primary. It carries what the site wants to show: cover art, every host by name,
and the location fields. It is also undocumented and unversioned. The ICS feed
is the fallback: a published standard, far more stable, but schedule only. The
fallback fires when the JSON *requests* fail, not when they succeed with nothing
in them, because an empty calendar is a real answer and the site has states for
it. Luma's supported API (`public-api.luma.com`) is the only one with a
contract, but it needs a Luma Plus subscription and a per-calendar key, and this
calendar is on the free plan.

**Why build time.** Not a preference, a constraint: Luma serves no
`access-control-allow-origin` header on either endpoint, so a browser cannot
read them at all. Fetching during the build also keeps the site static with no
runtime dependency on Luma being up, and lets the build re-encode the cover art
rather than pointing visitors at 2 MB PNGs on someone else's CDN. The cost is
that freshness equals deploy frequency, so a new event reaches the site on the
next build rather than the moment it is published. A scheduled rebuild is what
closes that gap.

**The split.** `data/luma.ts` fetches and decides nothing. `lib/lumaJson.ts` and
`lib/ics.ts` each know one payload format. `lib/lumaCalendar.ts` knows what
"next" means here and owns the shape both readers produce. Only the fetcher can
fail in ways a test cannot reach.

Both readers are defensive, and `lumaJson.ts` more so: it takes `unknown` rather
than a declared response type, because the argument is whatever `JSON.parse`
returned from an endpoint with no contract, and typing it as the shape we hope
for would move the lie earlier rather than removing it. An entry that does not
parse is dropped and the rest of the calendar still renders.

Two details of iCalendar do real damage if skipped, which is why `ics.ts` is
tested rather than a regex at the call site. Long lines **fold** onto the next
line behind a single space, and Luma folds mid-word (the live feed splits
`Hosted` into `Ho` / ` sted`), so unfolding has to happen before anything is
read. TEXT values **escape** `\n`, `\,`, `\;` and `\\`, so a host list arrives as
`Ana\, Beto` and a naive comma split finds a partner too many.

A calendar that cannot be read is a warning, not a thrown error, on the same
reasoning as an unmeasurable partner logo: the sections render their empty
states, the deploy completes, and the next build picks it back up. A blip at
Luma should not block an unrelated copy fix from shipping.

### Virtual or in person

Luma's `location_type` is not dependable on this calendar: it reads `meet` on the
events somebody attached a Google Meet to and `unknown` on the ones where nobody
filled the field in. The physical fields are the reliable signal, because Luma
populates them whenever a real address is set, so `isVirtual` is stated as the
absence of a venue: no `geo_address_info` and no `coordinate` means nobody is
going anywhere.

Phrasing it that way rather than as a list of virtual platforms means an
in-person event added later is correctly *not* labelled online, whatever new
value `location_type` grows. The ICS path cannot tell either way and returns
`undefined`, which the templates render as no claim at all rather than as a
guess. The ticket's modality used to be the fixed copy string "Virtual", true of
every event held so far and ready to mislabel the first one that was not.

### Cover art

Luma serves originals at up to 1254px and 2 MB, and ignores every resize
parameter it is given. So `astro.config.mjs` authorises `images.lumacdn.com` and
the build downloads and re-encodes them: about 3 MB of PNG becomes tens of KB of
WebP served from this origin.

Two traps, both hit during the build:

- `inferSize` with a bare `width` sets the output width and leaves height at the
  original, squashing every square poster into a 1254px tall sliver. `widths`
  plus `sizes` scales both.
- Astro fetches remote images during the build, and one it cannot get raises
  `FailedToFetchRemoteImageDimensions` and takes the whole build down. That is
  the one failure mode in this pipeline that would otherwise be fatal, so
  `withReachableCovers` HEADs each cover first, in parallel, and drops the ones
  that do not answer. A cover Luma has moved costs a card its picture instead of
  costing the deploy.

Covers stay square thumbnails rather than banners. These posters are usually the
event title set as an image, so at banner size one fills half a card in order to
repeat the words directly beneath it, and cropping to a wide strip cuts them in
half. `alt=""` for the same reason: the title is always adjacent.

**What Luma still does not carry.** No dependable registration counts, so the
seat meter stays the simulation described below. No prose either: neither the
ICS DESCRIPTION (boilerplate, then a host line) nor the list JSON carries the
event's write-up. So the accent line, body, hooks and badges are still
`copy.event` and still describe whichever event was written up last. They want a
pass when a different event takes over the ticket: the schedule will be right on
its own, the prose will not.

Hosts are the exception. The JSON names every one of them; `hostsFrom` is only
for the ICS path, where Luma collapses long lists into "& 4 others". That tail is
counted rather than kept as a name, because rendering the literal string "4
others" inside Spanish copy is worse than saying how many were left out in the
site's own words.

## The sessions section (`CommunityCalls`)

This was four hand-written formats (Community Call, Builder Clinic, Web3 desde
Cero, Research & Payments Lab) whose day and time both read "Por confirmar".
Four cards that all say "to be confirmed" tell a visitor nothing, and there was
no mechanism by which they would ever start saying anything else.

It now renders the calendar, through `sessionsFrom`, in one of three states:

- **`upcoming`**, the events scheduled beyond the one already on the ticket.
  Skipping the first is the point: it sits directly above, and printing it twice
  on one screen reads as a bug rather than as emphasis.
- **`recent`**, the most recent finished sessions, used when nothing is left
  ahead. An empty calendar and a calendar of finished events look identical to a
  visitor otherwise, and they are not the same thing: one community has never
  met, the other met last week.
- **`none`**, when the calendar is empty, and the section does not render at
  all. The ticket above already says nothing is scheduled, and two full-height
  sections saying it reads as a bug.

`recent` is a different section rather than a dimmer version of the same one. A
card reading "próxima sesión" over a date from last month is a lie, so the badge,
the lead, the CTA and the list heading all switch with the state.

Between the ticket and this section every event on the calendar reaches the
page, so nothing scheduled is invisible.

## The ticket (`NextEvent` / `EventTicket`)

The section has two shapes, because an empty calendar is a real state and not a
failure. `nextEvent` is a `CalendarState`, so `NextEvent` either renders
`EventTicket` with an event in hand or renders a card that says nothing is
scheduled and points at the calendar. Modelling it as a discriminated state is
the same move as `CountdownState`: the template cannot forget the case.

The ticket lives in its own component for that reason. Threading a nullable
event through a hundred lines of markup would mean a non-null assertion at every
read, and keeping it separate also keeps the ticket's client script out of the
page entirely on the days nothing is on.

Two derived displays, both rendered server-side as the no-JS fallback and
recomputed on load:

- **Countdown**, from the event's `startsAt`. `lib/countdown.ts` returns a
  discriminated state, so "already started" is a variant the template has to
  handle rather than a countdown of zero.
- **Seat meter**, from the `seats` curve. `lib/seats.ts` derives reserved,
  remaining, percentage and sold-out from a single count, so they cannot drift.
  These are still simulated numbers; no free Luma source carries capacity.

Every printed date comes from `startsAt` through `lib/eventDate.ts`, pinned to
`America/Guayaquil`. The feed publishes in UTC, so the workshop's
`2026-08-12T00:30:00Z` prints as `19:30` on `11–12 AGO`. The date is Ecuador's,
not the visitor's, and not the build machine's.

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

The event CTA is the sharper case, and the reason that guard now earns its keep
twice over. Every other URL on the site was written by somebody with commit
access; this one arrives over the network from Luma and lands in an `href`.
`publicEventUrl` launders it through the same check, and an event whose link
does not survive falls back to the calendar profile rather than rendering a dead
or dangerous button.
