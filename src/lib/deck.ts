/**
 * The partner roulette: a column of stacked cards that cycles forever.
 *
 * Lives here rather than inside a `<script>` block so the parts with actual
 * logic — the wrap-around geometry, the speed rules, the settle — are ordinary
 * exported functions a test can import. The DOM wiring at the bottom is the
 * thin part.
 *
 * Nothing advances on its own without the caller's `isRunning` returning true,
 * which is what keeps the section clear of WCAG 2.2.2: the page owns a pause
 * control and this module obeys it.
 */

/* ------------------------------------------------------------------ *
 * DOM contract — attribute names live here, not scattered in markup.
 * ------------------------------------------------------------------ */

export const DECK_ATTR = {
  root: 'data-deck',
  stack: 'data-deck-stack',
  card: 'data-deck-card',
  link: 'data-deck-link',
  url: 'data-deck-url',
} as const;

export const deckAttrs = {
  root: { [DECK_ATTR.root]: '' },
  stack: { [DECK_ATTR.stack]: '' },
  link: { [DECK_ATTR.link]: '' },
} as const;

/** A card carries its partner URL only when there is a safe one to carry. */
export function deckCardAttrs(url?: string): Record<string, string> {
  return url ? { [DECK_ATTR.card]: '', [DECK_ATTR.url]: url } : { [DECK_ATTR.card]: '' };
}

const selector = (attribute: string) => `[${attribute}]`;

/* ------------------------------------------------------------------ *
 * Pure model
 * ------------------------------------------------------------------ */

/**
 * What the pointer is doing to a column. A union rather than four independent
 * booleans: `pressed && !hovered && holding` was representable before and meant
 * nothing, and every speed decision had to re-derive the real state from the
 * combination.
 */
export type PointerPhase = 'idle' | 'hover' | 'press' | 'hold';

export interface SpeedConfig {
  /** Cards per second at rest. */
  base: number;
  /** Cards per second while hovered or held. */
  boost: number;
}

export const DEFAULT_SPEED: SpeedConfig = { base: 0.22, boost: 0.85 };

/** Press longer than this and it is a hold, not a click. */
export const HOLD_MS = 200;
/** Pointer drift still counted as a click, in px. */
export const MOVE_TOLERANCE = 8;

const EASE = 4;
const SETTLE_EASE = 6;
const SETTLE_EPSILON = 0.0005;
const SPEED_EPSILON = 0.004;

const MIN_SCALE = 0.72;
const SCALE_FALLOFF = 0.14;
const OPACITY_FALLOFF = 0.34;
/** Beyond this many cards from centre a card is invisible. */
const VISIBLE_WITHIN = 1.6;
/** Within this many cards of centre a card answers the pointer. */
const INTERACTIVE_WITHIN = 0.5;

/** Fraction of the stack height between adjacent cards. */
export const SPACING_RATIO = 0.27;

/**
 * Speed the column should be heading toward.
 *
 * A press pins the column so the click that follows resolves to whatever the
 * visitor is actually looking at, rather than a card that moved out from under
 * the cursor.
 */
export function targetSpeed(
  phase: PointerPhase,
  keyboardHeld: boolean,
  isRunning: boolean,
  speed: SpeedConfig = DEFAULT_SPEED,
): number {
  if (!isRunning || keyboardHeld || phase === 'press') return 0;
  if (phase === 'hover' || phase === 'hold') return speed.boost;
  return speed.base;
}

/** Eased approach, snapped once it is close enough to stop creeping forever. */
export function easeSpeed(current: number, target: number, delta: number): number {
  const next = current + (target - current) * Math.min(1, delta * EASE);
  return Math.abs(target - next) < SPEED_EPSILON ? target : next;
}

/**
 * Signed distance from the centre line, wrapped into `[-count/2, count/2)` so a
 * card leaving the top reappears at the bottom without a seam.
 */
export function signedDistance(index: number, offset: number, count: number): number {
  const forward = (((index - offset) % count) + count) % count;
  return forward > count / 2 ? forward - count : forward;
}

export interface CardPlacement {
  readonly offsetY: number;
  readonly scale: number;
  readonly opacity: number;
  readonly zIndex: number;
  readonly interactive: boolean;
}

/**
 * Where a card sits given its distance from centre. Cards past `VISIBLE_WITHIN`
 * are fully transparent, which is what lets them be repositioned mid-wrap
 * without anything visibly jumping.
 */
export function placeCard(distance: number, centre: number, spacing: number): CardPlacement {
  const magnitude = Math.abs(distance);
  return {
    offsetY: centre + distance * spacing,
    scale: Math.max(MIN_SCALE, 1 - magnitude * SCALE_FALLOFF),
    opacity: magnitude > VISIBLE_WITHIN ? 0 : Math.max(0, 1 - magnitude * OPACITY_FALLOFF),
    zIndex: Math.round(100 - magnitude * 10),
    interactive: magnitude < INTERACTIVE_WITHIN,
  };
}

/**
 * Ease a stopped column onto the nearest card so it never rests half-way.
 * Rounding past the last card is fine — the result is normalized back into
 * range once it lands.
 */
export function settleOffset(offset: number, count: number, delta: number): number {
  const nearest = Math.round(offset);
  const next = offset + (nearest - offset) * Math.min(1, delta * SETTLE_EASE);
  return Math.abs(nearest - next) < SETTLE_EPSILON ? nearest % count : next;
}

/** Index of the card currently closest to the centre line. */
export function centredIndex(offset: number, count: number): number {
  return ((Math.round(offset) % count) + count) % count;
}

/* ------------------------------------------------------------------ *
 * DOM wiring
 * ------------------------------------------------------------------ */

export interface DeckOptions {
  isRunning: () => boolean;
  openUrl: (url: string) => void;
  speed?: SpeedConfig;
}

export interface Deck {
  step: (delta: number) => void;
  destroy: () => void;
}

/**
 * Bind one column. Returns a `step` the caller drives from its own animation
 * frame, so a page with three columns runs one loop rather than three.
 */
export function createDeck(root: HTMLElement, options: DeckOptions): Deck | null {
  const stack = root.querySelector<HTMLElement>(selector(DECK_ATTR.stack));
  const cards = [...root.querySelectorAll<HTMLElement>(selector(DECK_ATTR.card))];
  if (!stack || cards.length === 0) return null;

  const speed = options.speed ?? DEFAULT_SPEED;

  let phase: PointerPhase = 'idle';
  let keyboardHeld = false;
  let offset = 0;
  let velocity = speed.base;
  let centre = 0;
  let spacing = 0;
  let lastCentred = -1;
  let holdTimer = 0;
  let pressedAt = 0;
  let pressedX = 0;
  let pressedY = 0;

  const measure = () => {
    const height = stack.clientHeight;
    centre = (height - (cards[0]?.offsetHeight ?? 0)) / 2;
    /* Tighter than the card height on purpose: the neighbours tuck behind the
       centre card, which is what makes it read as a stack. */
    spacing = height * SPACING_RATIO;
  };

  const paint = () => {
    cards.forEach((card, index) => {
      const placement = placeCard(signedDistance(index, offset, cards.length), centre, spacing);
      card.style.transform = `translate3d(0, ${placement.offsetY}px, 0) scale(${placement.scale})`;
      card.style.opacity = String(placement.opacity);
      card.style.zIndex = String(placement.zIndex);
      /* Parked cards sit well outside the stack box, and an invisible element
         still answers the pointer — left interactive they stretch the column's
         hover target up over the category label. */
      card.style.pointerEvents = placement.interactive ? 'auto' : 'none';
    });

    const centred = centredIndex(offset, cards.length);
    if (centred === lastCentred) return;
    lastCentred = centred;

    cards.forEach((card, index) => {
      /* Only the centred card's link takes a tab stop; the others stay
         announced but unreachable while they sit behind it. */
      card
        .querySelectorAll<HTMLElement>(selector(DECK_ATTR.link))
        .forEach((link) => link.setAttribute('tabindex', index === centred ? '0' : '-1'));
    });
    stack.style.cursor = cards[centred]?.dataset.deckUrl ? 'pointer' : '';
  };

  const step = (delta: number) => {
    const target = targetSpeed(phase, keyboardHeld, options.isRunning(), speed);
    velocity = easeSpeed(velocity, target, delta);

    if (velocity > 0) offset = (offset + velocity * delta) % cards.length;
    else if (target === 0) offset = settleOffset(offset, cards.length, delta);

    paint();
  };

  const centredUrl = () => cards[centredIndex(offset, cards.length)]?.dataset.deckUrl;

  const clearHold = () => {
    window.clearTimeout(holdTimer);
    holdTimer = 0;
  };

  const onPointerEnter = () => {
    if (phase === 'idle') phase = 'hover';
  };

  const onPointerLeave = () => {
    clearHold();
    phase = 'idle';
  };

  const onPointerDown = (event: PointerEvent) => {
    pressedAt = event.timeStamp;
    pressedX = event.clientX;
    pressedY = event.clientY;
    phase = 'press';
    holdTimer = window.setTimeout(() => {
      if (phase === 'press') phase = 'hold';
    }, HOLD_MS);
  };

  const onPointerUp = (event: PointerEvent) => {
    clearHold();
    const wasQuick = event.timeStamp - pressedAt < HOLD_MS;
    const stayedPut =
      Math.abs(event.clientX - pressedX) < MOVE_TOLERANCE &&
      Math.abs(event.clientY - pressedY) < MOVE_TOLERANCE;
    phase = 'hover';

    /* The anchor handles its own activation — don't open the tab twice. */
    if (event.target instanceof Element && event.target.closest(selector(DECK_ATTR.link))) return;

    const url = centredUrl();
    if (wasQuick && stayedPut && url) options.openUrl(url);
  };

  const onFocusIn = (event: FocusEvent) => {
    /* Only a keyboard focus pauses. Clicking the stack focuses it too (it
       carries tabindex="0"), so treating every focus as a pause left the column
       parked for good after any click. */
    keyboardHeld = event.target instanceof Element && event.target.matches(':focus-visible');
  };

  const onFocusOut = () => {
    keyboardHeld = false;
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault();
      offset = (offset + 1) % cards.length;
    }
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault();
      offset = (offset - 1 + cards.length) % cards.length;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      const url = centredUrl();
      if (!url) return;
      event.preventDefault();
      options.openUrl(url);
    }
  };

  stack.addEventListener('pointerenter', onPointerEnter);
  stack.addEventListener('pointerleave', onPointerLeave);
  stack.addEventListener('pointerdown', onPointerDown);
  stack.addEventListener('pointerup', onPointerUp);
  stack.addEventListener('focusin', onFocusIn);
  stack.addEventListener('focusout', onFocusOut);
  stack.addEventListener('keydown', onKeyDown);

  const resize = new ResizeObserver(measure);
  resize.observe(stack);

  measure();
  paint();

  return {
    step,
    destroy: () => {
      clearHold();
      resize.disconnect();
      stack.removeEventListener('pointerenter', onPointerEnter);
      stack.removeEventListener('pointerleave', onPointerLeave);
      stack.removeEventListener('pointerdown', onPointerDown);
      stack.removeEventListener('pointerup', onPointerUp);
      stack.removeEventListener('focusin', onFocusIn);
      stack.removeEventListener('focusout', onFocusOut);
      stack.removeEventListener('keydown', onKeyDown);
    },
  };
}
