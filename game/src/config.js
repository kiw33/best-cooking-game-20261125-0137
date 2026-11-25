// DAPUR PANAS — every tuning number, recipe and colour in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it to
// the window, so no rule below depends on the screen size.
export const FIELD = { width: 1280, height: 720 };

/** The simulation's fixed step, in seconds: 60 updates a second. */
export const STEP = 1 / 60;

/** One dinner-rush shift, in seconds. */
export const SHIFT_SECONDS = 180;

/** A missed (expired) order costs one strike; three strikes end the shift. */
export const MAX_STRIKES = 3;

/** Stars on the results screen, by coins earned in the shift. */
export const STAR_COINS = [250, 500, 850];

/** How long a fresh order waits before it walks out, in seconds. */
export const ORDER_PATIENCE = 42;
/** A new order arrives this often at the start of a shift, in seconds. */
export const ORDER_EVERY_START = 13;
/** ...and this often by the end of the shift. */
export const ORDER_EVERY_END = 8;
/** At most this many tickets open at once. */
export const MAX_ORDERS = 3;

/** Chopping a vegetable takes this long, in seconds. */
export const CHOP_SECONDS = 1.6;
/** A patty on the grill takes this long to cook, in seconds. */
export const COOK_SECONDS = 4;
/** A cooked patty waits this long on the grill before it burns. */
export const READY_SECONDS = 5.5;

/** A serve's tip is up to this share of the dish price, by patience left. */
export const TIP_SHARE = 0.5;
/** Each serve in a row without a miss adds this to the coin multiplier. */
export const COMBO_STEP = 0.1;
/** The coin multiplier never passes this. */
export const COMBO_MAX = 2;

export const PLAYER = {
  radius: 20,
  accel: 2800,
  maxSpeed: 330,
  drag: 0.86,
};

/** The pantry's raw ingredients: emoji, name and what the kitchen does with it. */
export const INGREDIENTS = {
  bun: { emoji: '🍞', name: 'Roti', chop: false, cook: false },
  patty: { emoji: '🥩', name: 'Daging', chop: false, cook: true },
  lettuce: { emoji: '🥬', name: 'Selada', chop: true, cook: false },
  tomato: { emoji: '🍅', name: 'Tomat', chop: true, cook: false },
  cheese: { emoji: '🧀', name: 'Keju', chop: false, cook: false },
};

/** The pantry bins, left to right, with the key that grabs each one. */
export const PANTRY_KEYS = ['bun', 'patty', 'lettuce', 'tomato', 'cheese'];

/**
 * A prepared item is named `<ingredient>-chopped` or `<ingredient>-cooked`.
 * Recipes list the prepared items a plate must hold, as a multiset.
 */
export const RECIPES = {
  classic: {
    name: 'Burger Klasik', price: 60, emoji: '🍔',
    items: ['bun', 'patty-cooked', 'lettuce-chopped'],
  },
  cheese: {
    name: 'Cheese Burger', price: 80, emoji: '🍔',
    items: ['bun', 'patty-cooked', 'cheese', 'tomato-chopped'],
  },
  salad: {
    name: 'Salad Segar', price: 45, emoji: '🥗',
    items: ['lettuce-chopped', 'tomato-chopped'],
  },
  double: {
    name: 'Double Stack', price: 110, emoji: '🍔',
    items: ['bun', 'patty-cooked', 'patty-cooked', 'cheese'],
  },
};
export const RECIPE_IDS = ['classic', 'cheese', 'salad', 'double'];

/** The emoji a prepared item shows on a plate, ticket or in the chef's hands. */
export function itemEmoji(item) {
  if (item === 'patty-cooked') return '🍖';
  if (item === 'patty-burnt') return '🔥';
  if (item.endsWith('-chopped')) return INGREDIENTS[item.slice(0, -8)]?.emoji ?? '❓';
  return INGREDIENTS[item]?.emoji ?? '❓';
}

/** The name a prepared item shows in prompts and tickets. */
export function itemName(item) {
  if (item === 'patty-cooked') return 'Daging Matang';
  if (item === 'patty-burnt') return 'Daging Gosong';
  if (item.endsWith('-chopped')) return `${INGREDIENTS[item.slice(0, -8)]?.name ?? '?'} Potong`;
  return INGREDIENTS[item]?.name ?? item;
}

/** Stations: rectangles in field coordinates, with a label and a prompt verb. */
export const STATIONS = {
  pantry: { x: 36, y: 92, w: 316, h: 76, label: 'PANTRY — BAHAN', hint: 'Klik bahan / tombol 1-5' },
  board: { x: 372, y: 92, w: 170, h: 76, label: 'TALENAN', hint: 'E — potong' },
  grill: { x: 562, y: 92, w: 220, h: 76, label: 'PANGGANGAN', hint: 'E — panggang / angkat' },
  assembly: { x: 802, y: 92, w: 260, h: 76, label: 'MEJA RACIK', hint: 'E — susun piring' },
  plates: { x: 36, y: 300, w: 96, h: 96, label: 'PIRING', hint: 'E — ambil piring' },
  window: { x: 1148, y: 300, w: 96, h: 180, label: 'JENDELA SAJI', hint: 'E — sajikan' },
  trash: { x: 36, y: 560, w: 96, h: 96, label: 'SAMPAH', hint: 'E — buang' },
};

/** How close the chef must be to a station to use it, in pixels. */
export const REACH = 108;

export const PALETTE = {
  backdrop: '#241708',
  floorA: '#8a5a2e',
  floorB: '#7d5027',
  wall: '#3d2712',
  counter: '#5d3a1a',
  counterTop: '#a9703a',
  counterEdge: '#2e1c0a',
  panel: 'rgba(20, 12, 4, 0.88)',
  panelEdge: '#c98f4e',
  text: '#fff6e8',
  muted: '#d8b98c',
  gold: '#f2c94c',
  danger: '#ff5d5d',
  ok: '#7be495',
  ticket: '#fff3d6',
  ticketEdge: '#d9a441',
  grillHot: '#ff7a2f',
  board: '#e8c98f',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
export const FONT_DISPLAY = '"Arial Black", system-ui, sans-serif';

/** Where the best coins total is kept between visits (this browser only). */
export const BEST_KEY = 'dapur-panas.best';
