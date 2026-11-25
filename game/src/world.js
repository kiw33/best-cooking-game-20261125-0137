// DAPUR PANAS — the kitchen itself: the chef, the stations, the orders and
// the shift. No DOM here except a guarded localStorage read for the best
// coins total; everything else is plain state the renderer paints.
//
// One shift: 180 seconds, up to 3 tickets open at once, 3 strikes end it
// early. The loop is: pantry -> board/grill -> assembly plate -> window.
// The chef carries one thing at a time: one ingredient, or one plate.
import {
  BEST_KEY, CHOP_SECONDS, COMBO_MAX, COMBO_STEP, COOK_SECONDS, FIELD,
  INGREDIENTS, MAX_ORDERS, MAX_STRIKES, ORDER_EVERY_END, ORDER_EVERY_START,
  ORDER_PATIENCE, PANTRY_KEYS, PLAYER, READY_SECONDS, RECIPE_IDS, RECIPES,
  SHIFT_SECONDS, STAR_COINS, STATIONS, TIP_SHARE, REACH,
} from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_VICTORY = 'victory';
export const SCREEN_OVER = 'over';

/** How many of `item` one plate may hold (a Double Stack takes two patties). */
function plateLimit(item) {
  return item === 'patty-cooked' ? 2 : 1;
}

/** Whether two item lists hold the same items, order aside. */
function sameItems(a, b) {
  if (a.length !== b.length) return false;
  const rest = [...b];
  for (const item of a) {
    const i = rest.indexOf(item);
    if (i < 0) return false;
    rest.splice(i, 1);
  }
  return true;
}

/** A point's distance to a rectangle, 0 when the point is inside it. */
function distToRect(x, y, r) {
  const dx = Math.max(r.x - x, 0, x - (r.x + r.w));
  const dy = Math.max(r.y - y, 0, y - (r.y + r.h));
  return Math.hypot(dx, dy);
}

/** Whether the chef stands close enough to use a station. */
function nearStation(player, station) {
  return distToRect(player.x, player.y, station) <= REACH;
}

export function createWorld(random, audio) {
  const world = {
    screen: SCREEN_TITLE,
    random,
    audio,
    player: { x: 640, y: 430, vx: 0, vy: 0, facing: 1 },
    hands: null,
    board: null,
    grill: [null, null],
    assembly: null,
    orders: [],
    nextOrderId: 1,
    orderTimer: 2,
    timeLeft: SHIFT_SECONDS,
    elapsed: 0,
    coins: 0,
    combo: 0,
    served: 0,
    missed: 0,
    strikes: 0,
    best: 0,
    newBest: false,
    message: '',
    messageUntil: 0,
    now: 0,
    lowTickSecond: -1,
  };

  world.readBest = function readBest() {
    try {
      const raw = window.localStorage.getItem(BEST_KEY);
      const n = Number.parseInt(raw ?? '', 10);
      return Number.isInteger(n) && n > 0 ? n : 0;
    } catch {
      return 0;
    }
  };

  world.writeBest = function writeBest() {
    try {
      window.localStorage.setItem(BEST_KEY, String(world.best));
    } catch {
      // A private window or a blocked store: the best total just does not persist.
    }
  };

  world.best = world.readBest();

  function say(text) {
    world.message = text;
    world.messageUntil = world.now + 2.2;
  }

  world.start = function start() {
    world.screen = SCREEN_PLAY;
    world.player = { x: 640, y: 430, vx: 0, vy: 0, facing: 1 };
    world.hands = null;
    world.board = null;
    world.grill = [null, null];
    world.assembly = null;
    world.orders = [];
    world.nextOrderId = 1;
    world.orderTimer = 2;
    world.timeLeft = SHIFT_SECONDS;
    world.elapsed = 0;
    world.coins = 0;
    world.combo = 0;
    world.served = 0;
    world.missed = 0;
    world.strikes = 0;
    world.newBest = false;
    world.message = '';
    world.messageUntil = 0;
    world.lowTickSecond = -1;
  };

  /** The station the chef stands nearest to, or null when none is in reach. */
  world.nearestStation = function nearestStation() {
    let bestId = null;
    let bestDist = Infinity;
    for (const [id, rect] of Object.entries(STATIONS)) {
      const d = distToRect(world.player.x, world.player.y, rect);
      if (d < bestDist) {
        bestDist = d;
        bestId = id;
      }
    }
    return bestDist <= REACH ? bestId : null;
  };

  /** The one-line hint the renderer shows by the chef. */
  world.prompt = function prompt() {
    if (world.screen !== SCREEN_PLAY) return '';
    const station = world.nearestStation();
    if (station === null) return '';
    const hands = world.hands;
    if (station === 'pantry') {
      if (hands !== null) return 'Tangan penuh — sajikan atau buang dulu';
      return 'Pilih bahan: klik / tombol 1-5';
    }
    if (station === 'board') {
      if (world.board === null) {
        if (hands?.kind === 'item' && INGREDIENTS[hands.item]?.chop) return '[E] Letakkan untuk dipotong';
        return 'Butuh selada / tomat mentah';
      }
      if (world.board.done) return hands === null ? '[E] Ambil hasil potongan' : 'Tangan penuh';
      return 'Memotong… tunggu sebentar';
    }
    if (station === 'grill') {
      const ready = world.grill.find((s) => s?.state === 'ready');
      const burnt = world.grill.find((s) => s?.state === 'burnt');
      const free = world.grill.some((s) => s === null);
      if (hands?.kind === 'item' && hands.item === 'patty' && free) return '[E] Letakkan daging di grill';
      if (ready && hands === null) return '[E] Angkat daging matang!';
      if (burnt && hands === null) return '[E] Angkat daging gosong';
      if (hands !== null) return 'Tangan penuh';
      return 'Grill butuh daging mentah';
    }
    if (station === 'assembly') {
      if (world.assembly === null) {
        if (hands?.kind === 'plate') return '[E] Letakkan piring di meja';
        return 'Butuh piring kosong';
      }
      if (hands === null) return '[E] Angkat piring';
      if (hands.kind === 'item') return '[E] Tambah ke piring';
      return '';
    }
    if (station === 'plates') return hands === null ? '[E] Ambil piring kosong' : 'Tangan penuh';
    if (station === 'window') {
      if (hands?.kind === 'plate') return '[E] Sajikan piring ini!';
      return 'Bawa piring yang sudah lengkap';
    }
    if (station === 'trash') return hands !== null ? '[E] Buang yang di tangan' : 'Tidak ada yang dibuang';
    return '';
  };

  /** Take one ingredient from the pantry, when the hands are free. */
  world.pantryTake = function pantryTake(id) {
    if (world.screen !== SCREEN_PLAY) return;
    if (!nearStation(world.player, STATIONS.pantry)) {
      say('Terlalu jauh dari pantry');
      return;
    }
    if (world.hands !== null) {
      say('Tangan penuh!');
      return;
    }
    world.hands = { kind: 'item', item: id };
    audio.pickup();
  };

  /** The chef's E press on the nearest station (or a named one, from a click). */
  world.interact = function interact(stationId = null) {
    if (world.screen !== SCREEN_PLAY) return;
    const station = stationId ?? world.nearestStation();
    if (station === null) return;
    const hands = world.hands;

    if (station === 'pantry') {
      say('Pilih bahan: klik kotaknya / tombol 1-5');
      return;
    }
    if (station === 'board') {
      if (world.board === null) {
        if (hands?.kind === 'item' && INGREDIENTS[hands.item]?.chop) {
          world.board = { item: hands.item, progress: 0, done: false };
          world.hands = null;
          audio.place();
        } else {
          say('Talenan butuh selada / tomat mentah');
        }
        return;
      }
      if (world.board.done) {
        if (hands !== null) {
          say('Tangan penuh!');
          return;
        }
        world.hands = { kind: 'item', item: `${world.board.item}-chopped` };
        world.board = null;
        audio.pickup();
        return;
      }
      say('Masih dipotong…');
      return;
    }
    if (station === 'grill') {
      const ready = world.grill.findIndex((s) => s?.state === 'ready');
      const burnt = world.grill.findIndex((s) => s?.state === 'burnt');
      const free = world.grill.findIndex((s) => s === null);
      if (hands?.kind === 'item' && hands.item === 'patty' && free >= 0) {
        world.grill[free] = { state: 'cooking', progress: 0, readyLeft: 0 };
        world.hands = null;
        audio.sizzle();
        return;
      }
      if (ready >= 0 && hands === null) {
        world.grill[ready] = null;
        world.hands = { kind: 'item', item: 'patty-cooked' };
        audio.pickup();
        return;
      }
      if (burnt >= 0 && hands === null) {
        world.grill[burnt] = null;
        world.hands = { kind: 'item', item: 'patty-burnt' };
        audio.pickup();
        say('Gosong! Buang ke sampah');
        return;
      }
      if (hands !== null) say('Tangan penuh!');
      else say('Grill butuh daging mentah');
      return;
    }
    if (station === 'assembly') {
      if (world.assembly === null) {
        if (hands?.kind === 'plate') {
          world.assembly = { items: hands.items };
          world.hands = null;
          audio.place();
        } else {
          say('Letakkan piring kosong dulu');
        }
        return;
      }
      if (hands === null) {
        world.hands = { kind: 'plate', items: world.assembly.items };
        world.assembly = null;
        audio.pickup();
        return;
      }
      if (hands.kind === 'item') {
        const plate = world.assembly.items;
        const have = plate.filter((i) => i === hands.item).length;
        if (plate.length >= 5) {
          say('Piring sudah penuh');
          return;
        }
        if (have >= plateLimit(hands.item)) {
          say('Sudah ada di piring');
          return;
        }
        plate.push(hands.item);
        world.hands = null;
        audio.place();
        return;
      }
      say('Tangan penuh');
      return;
    }
    if (station === 'plates') {
      if (hands !== null) {
        say('Tangan penuh!');
        return;
      }
      world.hands = { kind: 'plate', items: [] };
      audio.pickup();
      return;
    }
    if (station === 'window') {
      if (hands?.kind !== 'plate') {
        say('Bawa piring yang sudah lengkap');
        return;
      }
      const order = world.orders.find((o) => sameItems(o.recipe.items, hands.items));
      if (order === undefined) {
        say('Tidak ada pesanan yang cocok!');
        audio.fail();
        return;
      }
      world.orders.splice(world.orders.indexOf(order), 1);
      const price = order.recipe.price;
      const patienceLeft = Math.max(0, order.patience / order.maxPatience);
      const tip = Math.round(price * TIP_SHARE * patienceLeft);
      world.combo += 1;
      const mult = Math.min(COMBO_MAX, 1 + COMBO_STEP * (world.combo - 1));
      const earned = Math.round((price + tip) * mult);
      world.coins += earned;
      world.served += 1;
      world.hands = null;
      audio.serve();
      say(`Tersaji! +${earned} koin${world.combo > 1 ? ` (kombo x${mult.toFixed(1)})` : ''}`);
      return;
    }
    if (station === 'trash') {
      if (hands === null) {
        say('Tidak ada yang dibuang');
        return;
      }
      world.hands = null;
      audio.place();
      say('Dibuang');
      return;
    }
  };

  /** A mouse click on the field: use the station clicked, when in reach. */
  world.clickAt = function clickAt(x, y) {
    if (world.screen !== SCREEN_PLAY) return false;
    for (const [id, rect] of Object.entries(STATIONS)) {
      if (x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h) {
        if (!nearStation(world.player, rect)) {
          say('Terlalu jauh — dekati dulu');
          return true;
        }
        if (id === 'pantry') {
          // Five bins share the pantry counter: pick by the click's x.
          const binW = rect.w / PANTRY_KEYS.length;
          const index = Math.min(PANTRY_KEYS.length - 1, Math.max(0, Math.floor((x - rect.x) / binW)));
          world.pantryTake(PANTRY_KEYS[index]);
          return true;
        }
        world.interact(id);
        return true;
      }
    }
    return false;
  };

  function spawnOrder() {
    // Early on the menu is simple; the full menu arrives as the rush builds.
    const pool = world.elapsed < 45
      ? ['classic', 'salad', 'classic', 'salad', 'cheese']
      : RECIPE_IDS;
    const id = random.pick(pool);
    const recipe = RECIPES[id];
    const maxPatience = ORDER_PATIENCE * (world.elapsed > 90 ? 0.85 : 1);
    world.orders.push({
      id: world.nextOrderId,
      recipeId: id,
      recipe,
      patience: maxPatience,
      maxPatience,
    });
    world.nextOrderId += 1;
  }

  function finish(screen) {
    world.screen = screen;
    if (world.coins > world.best) {
      world.best = world.coins;
      world.newBest = true;
      world.writeBest();
    }
    if (screen === SCREEN_VICTORY) audio.win();
    else audio.fail();
  }

  /** Stars earned this shift, 0-3. */
  world.stars = function stars() {
    let n = 0;
    for (const bar of STAR_COINS) if (world.coins >= bar) n += 1;
    return n;
  };

  world.update = function update(dt, input, actions) {
    world.now += dt;
    if (world.screen !== SCREEN_PLAY) return;

    // --- the chef moves (acceleration, drag, walls, solid counters).
    const dir = input.direction();
    const len = Math.hypot(dir.x, dir.y) || 1;
    const p = world.player;
    p.vx += (dir.x / len) * PLAYER.accel * dt;
    p.vy += (dir.y / len) * PLAYER.accel * dt;
    const drag = Math.pow(PLAYER.drag, dt * 60);
    p.vx *= drag;
    p.vy *= drag;
    const speed = Math.hypot(p.vx, p.vy);
    if (speed > PLAYER.maxSpeed) {
      p.vx = (p.vx / speed) * PLAYER.maxSpeed;
      p.vy = (p.vy / speed) * PLAYER.maxSpeed;
    }
    if (Math.abs(p.vx) > 10) p.facing = p.vx > 0 ? 1 : -1;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    const r = PLAYER.radius;
    p.x = Math.min(Math.max(p.x, r + 4), FIELD.width - r - 4);
    p.y = Math.min(Math.max(p.y, 176 + r), FIELD.height - r - 4);
    // Solid counters: push the chef out of any station rectangle he overlaps.
    for (const rect of Object.values(STATIONS)) {
      const cx = Math.min(Math.max(p.x, rect.x), rect.x + rect.w);
      const cy = Math.min(Math.max(p.y, rect.y), rect.y + rect.h);
      const dx = p.x - cx;
      const dy = p.y - cy;
      const d = Math.hypot(dx, dy);
      if (d < r && d > 0) {
        p.x = cx + (dx / d) * r;
        p.y = cy + (dy / d) * r;
      } else if (d === 0) {
        p.y = rect.y + rect.h + r;
      }
    }

    // --- the board chops on its own once a vegetable is on it.
    if (world.board !== null && !world.board.done) {
      world.board.progress += dt / CHOP_SECONDS;
      if (world.board.progress >= 1) {
        world.board.progress = 1;
        world.board.done = true;
        audio.chopDone();
      }
    }
    // --- the grill cooks, then waits, then burns.
    for (const slot of world.grill) {
      if (slot === null) continue;
      if (slot.state === 'cooking') {
        slot.progress += dt / COOK_SECONDS;
        if (slot.progress >= 1) {
          slot.progress = 1;
          slot.state = 'ready';
          slot.readyLeft = READY_SECONDS;
          audio.cooked();
        }
      } else if (slot.state === 'ready') {
        slot.readyLeft -= dt;
        if (slot.readyLeft <= 0) {
          slot.state = 'burnt';
          audio.burnt();
          say('Daging gosong di grill!');
        }
      }
    }

    // --- orders arrive, wait, and walk out.
    world.orderTimer -= dt;
    if (world.orderTimer <= 0 && world.orders.length < MAX_ORDERS) {
      spawnOrder();
      const t = world.elapsed / SHIFT_SECONDS;
      world.orderTimer = ORDER_EVERY_START + (ORDER_EVERY_END - ORDER_EVERY_START) * t;
    }
    for (const order of [...world.orders]) {
      order.patience -= dt;
      const whole = Math.ceil(order.patience);
      if (order.patience <= 8 && whole !== world.lowTickSecond && order.patience > 0) {
        world.lowTickSecond = whole;
        audio.tick();
      }
      if (order.patience <= 0) {
        world.orders.splice(world.orders.indexOf(order), 1);
        world.missed += 1;
        world.strikes += 1;
        world.combo = 0;
        audio.fail();
        say(`Pesanan ${order.recipe.name} kabur! Strike ${world.strikes}/${MAX_STRIKES}`);
        if (world.strikes >= MAX_STRIKES) {
          finish(SCREEN_OVER);
          return;
        }
      }
    }

    // --- the shift clock.
    world.elapsed += dt;
    world.timeLeft -= dt;
    if (world.timeLeft <= 0) {
      world.timeLeft = 0;
      finish(SCREEN_VICTORY);
    }
  };

  return world;
}
