/**
 * Non-translatable configuration for the landing page, joined to the copy.
 *
 * The split is deliberate. Every string a visitor reads lives in
 * `src/i18n/<lang>.json`; this file holds what stays the same in every
 * language — accent tones, links, ISO instants, seat counts, logo files — and
 * stitches the two together into the shapes the components consume. A second
 * language means one new JSON file and no edits here.
 *
 * Figures, logos and links marked PLACEHOLDER need real data before launch. The
 * event schedule no longer does: it comes from the Luma calendar via `luma.ts`.
 *
 * This module holds values only. Anything that computes — seat curves, date
 * formatting, logo geometry, which event is next — lives in `src/lib/` so it can
 * be tested without dragging the whole content tree along, and the one thing
 * that reaches the network lives in `luma.ts` so there is a single place to look
 * for it.
 */
import { copy } from '../i18n';
import {
  sessionsFrom,
  upcomingFrom,
  type CalendarState,
  type SessionsState,
} from '../lib/lumaCalendar';
import type { SeatCurve } from '../lib/seats';
import type { Tone } from '../lib/tone';
import { lumaEvents } from './luma';

export const brand = copy.brand;

export const nav = [
  { label: copy.nav.items.ahora, href: '#ahora' },
  { label: copy.nav.items.eventos, href: '#eventos' },
  { label: copy.nav.items.ecosistema, href: '#ecosistema' },
  { label: copy.nav.items.unete, href: '#unete' },
];

export const heroTicker = copy.hero.ticker;

export const stats = [
  { value: 2400, suffix: '+', label: copy.happeningNow.stats.members },
  { value: 40, suffix: '', label: copy.happeningNow.stats.events },
  { value: 9, suffix: '', label: copy.happeningNow.stats.universities },
];

export const pillars: {
  kicker: string;
  title: string;
  body: string;
  tone: Tone;
}[] = [
  { ...copy.happeningNow.pillars.opportunity, tone: 'yellow' },
  { ...copy.happeningNow.pillars.vision, tone: 'blue' },
  { ...copy.happeningNow.pillars.growth, tone: 'red' },
];

/**
 * Next public event, read from the Luma calendar at build time.
 *
 * The dates and the sign-up link used to be three hand-written strings here,
 * which meant the ticket advertised whatever event was current on the day
 * somebody last edited this file. It went stale exactly as you would expect.
 * `luma.ts` now fetches the calendar and `upcomingFrom` picks the soonest event
 * that has not ended, so the section follows the calendar without an edit.
 *
 * What Luma does *not* carry is the editorial half — the accent line, the body,
 * the hooks, the badges and the tutor list are still `copy.event`, and still
 * describe whichever event was written up last. Worth a pass when a new one
 * lands: the schedule will be right on its own, the prose will not.
 *
 * `status: 'none'` is a real state, not a failure. There are no upcoming events
 * on the calendar as things stand, and the ticket renders its empty variant.
 */
export const nextEvent: CalendarState = upcomingFrom(lumaEvents, Date.now());

/** Where the ticket's empty state points, since the profile has no calendar slug. */
export { lumaProfileUrl } from './luma';

/**
 * PLACEHOLDER demand curve for the ticket's seat meter — see `lib/seats` for
 * what the numbers mean. Swap for the real Luma registration count when wired.
 */
export const seats: SeatCurve = {
  capacity: 50,
  anchorAt: '2026-08-09T00:00:00-05:00',
  anchorReserved: 36,
  perDay: 3,
};

/**
 * The community sessions section, also read from the Luma calendar.
 *
 * This used to be four hand-written formats (Community Call, Builder Clinic,
 * Web3 desde Cero, Research & Payments Lab), each with its day and time set to
 * "Por confirmar" because none of them had a confirmed slot. Four cards that all
 * say "to be confirmed" tell a visitor nothing, and there was no mechanism by
 * which they would ever start saying anything else.
 *
 * The section now shows the calendar itself: what is scheduled beyond the event
 * already on the ticket, or the most recent sessions when nothing is left
 * ahead. Every event on the calendar reaches the page through one of the two,
 * so nothing scheduled is invisible.
 */
export const sessions: SessionsState = sessionsFrom(lumaEvents, Date.now());

/**
 * Convocatorias are hidden for now. Flip to true to bring back the section,
 * its footer link, and the mention of it in the What's Happening lead.
 */
export const showOpenCalls = false;

/** Drives both the badge wording and its colour, so the two cannot drift. */
export type OpenCallStatus = keyof typeof copy.openCalls.status;

export const openCalls: { title: string; meta: string; status: OpenCallStatus }[] = [
  { ...copy.openCalls.items.speakers, status: 'open' },
  { ...copy.openCalls.items.chapters, status: 'open' },
  { ...copy.openCalls.items.grants, status: 'soon' },
  { ...copy.openCalls.items.volunteers, status: 'open' },
];

/**
 * A single partner tile.
 *
 * The display name is not here — it is `copy.ecosystem.partners[key]`, so the
 * roster reads the same way as the rest of the page even though brand names
 * are never actually translated.
 *
 * `logo` is a path under `public/logos/`. Prefer SVG; otherwise a PNG cropped
 * tight to the artwork — baked-in transparent padding is the main reason a logo
 * looks undersized next to its neighbours. Logos render in full colour, always
 * on a light tile, so partner brand guidelines hold.
 *
 * `scale` is an optical size override where 1 is the default box. Logos differ
 * in visual weight as much as in dimensions: wide wordmarks usually want ~0.85,
 * dense square marks ~1.15. Set it by eye against the tiles either side.
 *
 * With no `logo`, the tile sets the name as a wordmark in the display face.
 * Both variants fill the identical box, so any mix of the two stays on the grid.
 */
export type PartnerKey = keyof typeof copy.ecosystem.partners;

interface PartnerConfig {
  key: PartnerKey;
  logo?: string;
  scale?: number;
  url?: string;
}

export interface EcosystemItem {
  name: string;
  logo?: string;
  scale?: number;
  url?: string;
}

/** Resolves each key to its display name. An unknown key is a type error, so
    the registry here and the names in the copy file cannot drift apart. */
const partners = (list: PartnerConfig[]): EcosystemItem[] =>
  list.map(({ key, ...rest }) => ({ name: copy.ecosystem.partners[key], ...rest }));

/** Confirmed partners. Add official logos and URLs only after they are supplied. */
export const ecosystem: {
  id: string;
  label: string;
  tone: Tone;
  items: EcosystemItem[];
}[] = [
  {
    id: 'partners',
    label: copy.ecosystem.groups.partners,
    tone: 'yellow',
    items: partners([
      { key: 'aws-community-builders' },
      { key: 'eth-kpu' },
      { key: 'google-developer' },
      { key: 'jtx-latam' },
      { key: 'loxa-libre' },
      { key: 'python-ecuador' },
      { key: 'red-qqrucho' },
      { key: 'seed-latam' },
      { key: 'stratosphere' },
      { key: 'team1' },
      { key: 'litvm' },
      { key: 'superteam-brasil' },
    ]),
  },
];

export const paths: {
  num: string;
  title: string;
  body: string;
  cta: string;
  href: string;
  tone: Tone;
}[] = [
  { num: '01', ...copy.join.paths.join, href: '#', tone: 'yellow' },
  { num: '02', ...copy.join.paths.organize, href: '#', tone: 'bone' },
  { num: '03', ...copy.join.paths.partner, href: '#', tone: 'blue' },
  { num: '04', ...copy.join.paths.core, href: '#', tone: 'ink' },
];

/** PLACEHOLDER: swap the # for real profile URLs. */
export const socials = [
  { label: copy.footer.socials.x, href: '#' },
  { label: copy.footer.socials.telegram, href: '#' },
  { label: copy.footer.socials.discord, href: '#' },
  { label: copy.footer.socials.instagram, href: '#' },
  { label: copy.footer.socials.linkedin, href: '#' },
  { label: copy.footer.socials.github, href: '#' },
  { label: copy.footer.socials.luma, href: '#' },
];

export const footerLinks = [
  {
    title: copy.footer.columns.ecosistema.title,
    links: [
      { label: copy.footer.columns.ecosistema.links.comunidades, href: '#ecosistema' },
      { label: copy.footer.columns.ecosistema.links.universidades, href: '#ecosistema' },
      { label: copy.footer.columns.ecosistema.links.blockchains, href: '#ecosistema' },
      { label: copy.footer.columns.ecosistema.links.partners, href: '#unete' },
    ],
  },
  {
    title: copy.footer.columns.comunidad.title,
    links: [
      { label: copy.footer.columns.comunidad.links.nextEvent, href: '#eventos' },
      { label: copy.footer.columns.comunidad.links.calls, href: '#eventos' },
      { label: copy.footer.columns.comunidad.links.openCalls, href: '#convocatorias' },
      { label: copy.footer.columns.comunidad.links.core, href: '#unete' },
    ],
  },
  {
    title: copy.footer.columns.recursos.title,
    links: [
      { label: copy.footer.columns.recursos.links.playbook, href: '#' },
      { label: copy.footer.columns.recursos.links.brandKit, href: '#' },
      { label: copy.footer.columns.recursos.links.codeOfConduct, href: '#' },
      { label: copy.footer.columns.recursos.links.press, href: '#' },
    ],
  },
];
