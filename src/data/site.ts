/**
 * Single source of content for the landing page.
 * Figures, dates, logos and links marked PLACEHOLDER need real data before launch.
 */

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

export const pillars = [
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

/** PLACEHOLDER: replace with the real next event before launch. */
export const nextEvent = {
  code: 'EVENTO #001',
  title: 'Ecuador Web3 Summit',
  year: '2026',
  date: '14 de marzo, 2026',
  dateShort: '14 MAR',
  time: '09:00',
  city: 'Quito',
  venue: 'Por confirmar',
  seats: '250 cupos',
  body: 'Un día completo de charlas, talleres y demos. Entrada libre con registro previo.',
  cta: { label: 'Reservar mi lugar', href: '#' },
};

export const calls = [
  {
    title: 'Community Call',
    cadence: 'Semanal',
    when: 'Jueves · 19:00 GMT-5',
    where: 'Google Meet',
    body: 'Actualizaciones del ecosistema, presentaciones de proyectos y micrófono abierto.',
    tone: 'yellow',
  },
  {
    title: 'Dev Circle',
    cadence: 'Quincenal',
    when: 'Martes · 20:00 GMT-5',
    where: 'Discord',
    body: 'Sesiones técnicas. Solidity, cuentas abstraídas, infra y lo que traiga la gente.',
    tone: 'red',
  },
  {
    title: 'Onboarding 101',
    cadence: 'Mensual',
    when: 'Primer sábado · 11:00',
    where: 'Presencial + stream',
    body: 'Para quien llega por primera vez. Wallets, seguridad y primeros pasos, sin apuro.',
    tone: 'bone',
  },
  {
    title: 'Arte y Cultura',
    cadence: 'Mensual',
    when: 'Miércoles · 19:00 GMT-5',
    where: 'Espacio en X',
    body: 'Artistas, coleccionistas y curadores del país conversando sobre lo que están haciendo.',
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

/** PLACEHOLDER: names stand in for real partner logos. */
export const ecosystem = [
  {
    id: 'comunidades',
    label: 'Comunidades',
    tone: 'yellow',
    items: [
      'Blockchain Ecuador', 'Cripto Guayaquil', 'DAO Andina', 'Quito Devs',
      'NFT Ecuador', 'Bitcoin Cuenca', 'Web3 Manta', 'Mujeres en Blockchain',
    ],
  },
  {
    id: 'universidades',
    label: 'Universidades',
    tone: 'blue',
    items: [
      'ESPOL', 'USFQ', 'EPN', 'PUCE', 'UDLA', 'Universidad de Cuenca',
      'ESPE', 'Yachay Tech',
    ],
  },
  {
    id: 'blockchains',
    label: 'Blockchains',
    tone: 'red',
    items: [
      'Ethereum', 'Solana', 'Base', 'Polygon', 'Stellar', 'Celo',
      'Arbitrum', 'Starknet',
    ],
  },
  {
    id: 'partners',
    label: 'Partners y Sponsors',
    tone: 'ink',
    items: [
      'Tu marca aquí', 'Tu protocolo aquí', 'Tu fondo aquí', 'Tu universidad aquí',
      'Tu comunidad aquí', 'Tu empresa aquí',
    ],
  },
];

export const paths = [
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
