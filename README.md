# Ecuador Web3: web platform

The landing page for the Ecuadorian Web3 ecosystem. A single Astro page, no
client framework, all copy in one content module.

## Getting started

```sh
npm install
npm run dev        # http://localhost:4321
```

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with HMR |
| `npm run build` | Static build to `dist/` |
| `npm run preview` | Serve the built output |
| `npm run check` | `astro check`, types across `.astro` and `.ts` |
| `npm test` | Vitest, once |
| `npm run test:watch` | Vitest, watching |
| `npm run verify` | check + test + build. Run before every commit. |

`npm run build` does **not** type-check, because Vite strips types without
looking at them. `npm run verify` is what tells you the code is sound.

## Layout

```
src/
├── pages/index.astro      One page, composed of the sections below
├── layouts/Base.astro     <head>, skip link, scroll reveal, cursor, magnetics
├── components/            One section each; templates plus thin DOM wiring
├── data/site.ts           All copy and content. Values only, no logic.
├── lib/                   Pure logic, with tests beside it
└── styles/global.css      Design tokens and the shared utility layer
public/logos/              Partner logo files
```

The split that matters: **`data/` holds values, `lib/` holds logic, components
hold markup.** Anything with a branch worth testing belongs in `lib/`. That is
why the roulette geometry and the seat curve live there rather than inside a
`<script>` block where no test can reach them.

## Editing content

Everything a non-developer would want to change is in
[`src/data/site.ts`](src/data/site.ts): the next event, community calls, partner
lists, footer links, social URLs.

**Adding a partner logo.** Drop the file in `public/logos/` and point at it:

```ts
{ name: 'ESPOL', logo: '/logos/espol.svg', url: 'https://espol.edu.ec' }
```

SVG is preferred, cropped tight to the artwork. Baked-in transparent padding is
the main reason a logo looks undersized next to its neighbours. Sizing is
automatic; see [docs/architecture.md](docs/architecture.md#logo-normalization).
A partner with no `logo` renders as a wordmark instead, and the two mix on the
same grid without looking accidental.

## Before launch

Two placeholders must be replaced. Both are marked `PLACEHOLDER` in `site.ts`:

- **The seat meter is a simulation.** `seats` describes a demand curve derived
  from the clock, not from real registrations. Point `seatsAt` at the live Luma
  count before launch. A meter that contradicts the door is worse than no meter.
- **Partner names stand in for real partners**, and none have logos or URLs yet.

## Documentation

- [docs/architecture.md](docs/architecture.md) explains how the page is put together
- [docs/decisions.md](docs/decisions.md) explains why it is put together that way
