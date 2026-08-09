/**
 * Single source of content for the landing page.
 * Figures, dates, logos and links marked PLACEHOLDER need real data before launch.
 *
 * This module holds values only. Anything that computes — seat curves, date
 * formatting, logo geometry — lives in `src/lib/` so it can be tested without
 * dragging the whole content tree along.
 */
import type { SeatCurve } from '../lib/seats';
import type { Tone } from '../lib/tone';

export const brand = {
  name: 'Ecuador Web3',
  tagline: 'El hogar del Ecosistema Web3 Ecuatoriano.',
  promise: 'Un espacio donde todos son bienvenidos.',
  motto: 'Construimos con propósito, crecemos juntos.',
  coords: '0°0\'0"',
  place: 'Mitad del Mundo',
};

export const nav = [
  { label: 'Ecuador en Web3', href: '#ahora' },
  { label: 'Eventos', href: '#eventos' },
  { label: 'Ecosistema', href: '#ecosistema' },
  { label: 'Comunidad', href: '#unete' },
];

export const heroTicker = [
  'Builders',
  'Devs',
  'Artistas',
  'Founders',
  'Estudiantes',
  'Traders',
  'Diseñadores',
  'Investigadores',
  'Curiosos',
  'Tú',
];

export const stats = [
  { value: 2400, suffix: '+', label: 'Miembros en la comunidad' },
  { value: 40, suffix: '', label: 'Eventos realizados' },
  { value: 9, suffix: '', label: 'Universidades aliadas' },
];

export const pillars: {
  kicker: string;
  title: string;
  body: string;
  tone: Tone;
}[] = [
  {
    kicker: 'La oportunidad',
    title: 'Dolarizados y conectados',
    body: 'Ecuador usa dólares, recibe remesas todos los meses y tiene una población joven con teléfono en la mano. Son las condiciones exactas para que Web3 resuelva algo real y no se quede en teoría.',
    tone: 'yellow',
  },
  {
    kicker: 'La visión',
    title: 'Aprender, construir y trabajar sin irse',
    body: 'Que cualquier persona en el país pueda entrar a este espacio, formarse y vivir de lo que construye. Sin mudarse a Buenos Aires, a Bogotá ni a Lisboa.',
    tone: 'blue',
  },
  {
    kicker: 'El crecimiento',
    title: 'De un grupo de chat a doce ciudades',
    body: 'Empezó con gente compartiendo links. Hoy hay meetups, calls semanales y capítulos que se organizan solos. Cada mes llega alguien que trae su propio pedazo del ecosistema.',
    tone: 'red',
  },
];

/** Next public event — Workshop: Web3 desde Cero (Luma). */
export const nextEvent = {
  code: 'WS-001',
  title: 'Web3 desde Cero',
  /** Accent line under the title — workshop framing, not a calendar year. */
  accent: 'Primer curso',
  /** The one source for every date the ticket prints. Keep the -05:00 offset
      explicit so the clock is Ecuador time for every visitor, not the
      browser's local zone. Display strings are formatted in lib/eventDate. */
  startsAt: '2026-08-11T19:30:00-05:00',
  /** End of Día 2 — used for the printed date range on the ticket. */
  endsAt: '2026-08-12T21:00:00-05:00',
  city: 'Virtual',
  hosts: ['Elizabeth Pacheco', 'Gelois o7'],
  body: 'Dos sesiones para entender blockchain y Web3, sin conocimientos previos.',
  /** Short conversion hooks near the CTA — keep to three. */
  hooks: ['Sin experiencia previa', 'Exclusivo Ecuador', 'Cupos limitados'],
  cta: {
    label: 'Asegura tu cupo',
    href: 'https://luma.com/s5r5q74x',
    soldOutLabel: 'Lista de espera',
    /** Reassurance under the button: cost + friction. */
    note: 'Gratis · toma menos de 2 minutos',
  },
};

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

export const calls: {
  title: string;
  cadence: string;
  /** Three-letter day label for the calendar cell, e.g. "Jue". */
  day: string;
  time: string;
  where: string;
  /** Who this call is for — one short line. */
  audience: string;
  body: string;
  href: string;
  featured?: boolean;
  tone: Tone;
}[] = [
  {
    title: 'Community Call',
    cadence: 'Semanal',
    day: 'Jue',
    time: '19:00',
    where: 'Google Meet',
    audience: 'Toda la comunidad',
    body: 'Actualizaciones del ecosistema, presentaciones de proyectos y micrófono abierto. El punto semanal para enterarte y conectar.',
    href: '#unete',
    featured: true,
    tone: 'yellow',
  },
  {
    title: 'Dev Circle',
    cadence: 'Quincenal',
    day: 'Mar',
    time: '20:00',
    where: 'Discord',
    audience: 'Builders y devs',
    body: 'Sesiones técnicas: Solidity, cuentas abstraídas, infra y lo que traiga la gente.',
    href: '#unete',
    tone: 'red',
  },
  {
    title: 'Onboarding 101',
    cadence: 'Mensual',
    day: 'Sáb',
    time: '11:00',
    where: 'Presencial + stream',
    audience: 'Principiantes',
    body: 'Para quien llega por primera vez. Wallets, seguridad y primeros pasos, sin apuro.',
    href: '#unete',
    tone: 'bone',
  },
  {
    title: 'Arte y Cultura',
    cadence: 'Mensual',
    day: 'Mié',
    time: '19:00',
    where: 'Espacio en X',
    audience: 'Artistas y curadores',
    body: 'Artistas, coleccionistas y curadores del país conversando sobre lo que están haciendo.',
    href: '#unete',
    tone: 'yellow',
  },
];

/**
 * Convocatorias are hidden for now. Flip to true to bring back the section,
 * its footer link, and the mention of it in the What's Happening lead.
 */
export const showOpenCalls = false;

export const openCalls = [
  { title: 'Speakers para el Summit 2026', meta: 'Cierra 15 FEB', status: 'Abierta' },
  { title: 'Organizadores de capítulo en Manta y Loja', meta: 'Sin fecha límite', status: 'Abierta' },
  { title: 'Grants para proyectos locales · Ronda 2', meta: 'Abre 01 MAR', status: 'Pronto' },
  { title: 'Voluntarios de producción y contenido', meta: 'Sin fecha límite', status: 'Abierta' },
];

/**
 * A single partner tile.
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
 * With no `logo`, the tile sets `name` as a wordmark in the display face. Both
 * variants fill the identical box, so any mix of the two stays on the grid.
 */
export interface EcosystemItem {
  name: string;
  logo?: string;
  scale?: number;
  url?: string;
}

/** PLACEHOLDER: names stand in for real partners; none have logos on file yet. */
export const ecosystem: {
  id: string;
  label: string;
  tone: Tone;
  items: EcosystemItem[];
}[] = [
  {
    id: 'comunidades',
    label: 'Comunidades',
    tone: 'yellow',
    items: [
      { name: 'Blockchain Ecuador' },
      { name: 'Cripto Guayaquil' },
      { name: 'DAO Andina' },
      { name: 'Quito Devs' },
      { name: 'NFT Ecuador' },
      { name: 'Bitcoin Cuenca' },
      { name: 'Web3 Manta' },
      { name: 'Mujeres en Blockchain' },
    ],
  },
  {
    id: 'universidades',
    label: 'Universidades',
    tone: 'blue',
    items: [
      { name: 'ESPOL' },
      { name: 'USFQ' },
      { name: 'EPN' },
      { name: 'PUCE' },
      { name: 'UDLA' },
      { name: 'Universidad de Cuenca' },
      { name: 'ESPE' },
      { name: 'Yachay Tech' },
    ],
  },
  {
    id: 'blockchains',
    label: 'Blockchains',
    tone: 'red',
    items: [
      { name: 'Ethereum' },
      { name: 'Solana' },
      { name: 'Base' },
      { name: 'Polygon' },
      { name: 'Stellar' },
      { name: 'Celo' },
      { name: 'Arbitrum' },
      { name: 'Starknet' },
    ],
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
  {
    num: '01',
    title: 'Únete',
    body: 'Entra al grupo, ven al próximo evento y pregunta lo que necesites. No hace falta saber nada todavía.',
    cta: 'Entrar al Telegram',
    href: '#',
    tone: 'yellow',
  },
  {
    num: '02',
    title: 'Organiza un evento',
    body: 'Ponemos la red, el playbook y el respaldo de la comunidad. Tú pones la ciudad y las ganas.',
    cta: 'Proponer un evento',
    href: '#',
    tone: 'bone',
  },
  {
    num: '03',
    title: 'Sé partner',
    body: 'Empresas, protocolos y universidades que quieren construir ecosistema en Ecuador, no solo patrocinar un logo.',
    cta: 'Conversemos',
    href: '#',
    tone: 'blue',
  },
  {
    num: '04',
    title: 'Core Member',
    body: 'Para quienes quieren sostener esto desde adentro: programación, contenido, alianzas y comunidad.',
    cta: 'Postular',
    href: '#',
    tone: 'ink',
  },
];

/** PLACEHOLDER: swap the # for real profile URLs. */
export const socials = [
  { label: 'X', href: '#' },
  { label: 'Telegram', href: '#' },
  { label: 'Discord', href: '#' },
  { label: 'Instagram', href: '#' },
  { label: 'LinkedIn', href: '#' },
  { label: 'GitHub', href: '#' },
  { label: 'Luma', href: '#' },
];

export const footerLinks = [
  {
    title: 'Ecosistema',
    links: [
      { label: 'Comunidades', href: '#ecosistema' },
      { label: 'Universidades', href: '#ecosistema' },
      { label: 'Blockchains', href: '#ecosistema' },
      { label: 'Partners', href: '#unete' },
    ],
  },
  {
    title: 'Comunidad',
    links: [
      { label: 'Próximo evento', href: '#eventos' },
      { label: 'Community Calls', href: '#eventos' },
      { label: 'Convocatorias', href: '#convocatorias' },
      { label: 'Core Members', href: '#unete' },
    ],
  },
  {
    title: 'Recursos',
    links: [
      { label: 'Playbook de eventos', href: '#' },
      { label: 'Kit de marca', href: '#' },
      { label: 'Código de convivencia', href: '#' },
      { label: 'Prensa', href: '#' },
    ],
  },
];
