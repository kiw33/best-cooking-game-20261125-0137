// DAPUR PANAS — everything the player sees, painted on one canvas. The
// playfield is a fixed 1280x720 logical area, scaled to the window with
// letterboxing; every ingredient, plate and ticket is drawn in code — no
// image or font is fetched, so the game runs fully offline.
import {
  FIELD, FONT, FONT_DISPLAY, INGREDIENTS, PALETTE, PANTRY_KEYS, STATIONS,
} from './config.js';
import {
  SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_VICTORY,
} from './world.js';
import { itemEmoji, itemName } from './config.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, font = FONT, align = 'left', weight = '') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px ${font}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(s, x, y);
}

export function createRenderer(canvas, input) {
  const ctx = canvas.getContext('2d');

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = canvas.clientWidth || FIELD.width;
    const ch = canvas.clientHeight || FIELD.height;
    canvas.width = Math.round(cw * dpr);
    canvas.height = Math.round(ch * dpr);
    const scale = Math.min(canvas.width / FIELD.width, canvas.height / FIELD.height);
    const ox = (canvas.width - FIELD.width * scale) / 2;
    const oy = (canvas.height - FIELD.height * scale) / 2;
    ctx.setTransform(scale, 0, 0, scale, ox, oy);
    input.setTransform(scale / dpr, ox / dpr, oy / dpr);
  }

  function drawFloor(time) {
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    // Warm checkerboard tiles.
    const tile = 64;
    for (let ty = 84; ty < FIELD.height; ty += tile) {
      for (let tx = 0; tx < FIELD.width; tx += tile) {
        const even = ((tx / tile + ty / tile) | 0) % 2 === 0;
        ctx.fillStyle = even ? PALETTE.floorA : PALETTE.floorB;
        ctx.fillRect(tx, ty, tile, tile);
      }
    }
    // A rug by the serving window, for warmth.
    ctx.fillStyle = '#a33d2e';
    roundRect(ctx, 1060, 500, 200, 120, 12);
    ctx.fill();
    ctx.strokeStyle = '#e8c98f';
    ctx.lineWidth = 3;
    roundRect(ctx, 1072, 512, 176, 96, 8);
    ctx.stroke();
    void time;
  }

  function drawStationBase(id, rect, highlight) {
    ctx.fillStyle = PALETTE.counterEdge;
    roundRect(ctx, rect.x - 3, rect.y - 3, rect.w + 6, rect.h + 6, 12);
    ctx.fill();
    ctx.fillStyle = PALETTE.counterTop;
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 10);
    ctx.fill();
    ctx.fillStyle = PALETTE.counter;
    ctx.fillRect(rect.x, rect.y + rect.h - 14, rect.w, 14);
    if (highlight) {
      ctx.strokeStyle = PALETTE.gold;
      ctx.lineWidth = 4;
      roundRect(ctx, rect.x - 3, rect.y - 3, rect.w + 6, rect.h + 6, 12);
      ctx.stroke();
    }
    text(ctx, STATIONS[id].label, rect.x + rect.w / 2, rect.y + rect.h + 16, 13, PALETTE.muted, FONT, 'center', '700');
  }

  function drawPantry(world, rect, highlight) {
    drawStationBase('pantry', rect, highlight);
    const binW = rect.w / PANTRY_KEYS.length;
    PANTRY_KEYS.forEach((id, i) => {
      const cx = rect.x + binW * i + binW / 2;
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      roundRect(ctx, rect.x + binW * i + 4, rect.y + 6, binW - 8, rect.h - 12, 8);
      ctx.fill();
      text(ctx, INGREDIENTS[id].emoji, cx, rect.y + 40, 30, '#fff', FONT, 'center');
      text(ctx, `${i + 1}`, cx, rect.y + rect.h - 8, 11, PALETTE.muted, FONT, 'center', '700');
    });
  }

  function progressBar(x, y, w, h, frac, color) {
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    roundRect(ctx, x, y, w, h, h / 2);
    ctx.fill();
    ctx.fillStyle = color;
    roundRect(ctx, x, y, Math.max(h, w * Math.min(1, frac)), h, h / 2);
    ctx.fill();
  }

  function drawBoard(world, rect, highlight) {
    drawStationBase('board', rect, highlight);
    ctx.fillStyle = PALETTE.board;
    roundRect(ctx, rect.x + 14, rect.y + 10, rect.w - 28, rect.h - 20, 8);
    ctx.fill();
    const board = world.board;
    if (board !== null) {
      text(ctx, INGREDIENTS[board.item].emoji, rect.x + rect.w / 2, rect.y + 42, 30, '#fff', FONT, 'center');
      if (!board.done) {
        progressBar(rect.x + 22, rect.y + rect.h - 18, rect.w - 44, 8, board.progress, '#ffb020');
        text(ctx, '🔪', rect.x + rect.w - 24, rect.y + 26, 18, '#fff', FONT, 'center');
      } else {
        text(ctx, '✓', rect.x + rect.w - 24, rect.y + 26, 18, '#2e7d32', FONT, 'center', '700');
      }
    } else {
      text(ctx, '—', rect.x + rect.w / 2, rect.y + 42, 26, 'rgba(0,0,0,0.35)', FONT, 'center');
    }
  }

  function drawGrill(world, rect, highlight, time) {
    drawStationBase('grill', rect, highlight);
    world.grill.forEach((slot, i) => {
      const cx = rect.x + 55 + i * 110;
      const cy = rect.y + rect.h / 2;
      ctx.fillStyle = '#1d1d1d';
      ctx.beginPath();
      ctx.arc(cx, cy, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#444';
      ctx.lineWidth = 3;
      ctx.stroke();
      if (slot === null) return;
      if (slot.state === 'cooking') {
        ctx.fillStyle = '#8a4b2d';
        ctx.beginPath();
        ctx.arc(cx, cy, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = PALETTE.grillHot;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(cx, cy, 26, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * slot.progress);
        ctx.stroke();
        text(ctx, '🥩', cx, cy + 9, 24, '#fff', FONT, 'center');
      } else if (slot.state === 'ready') {
        const pulse = 0.6 + 0.4 * Math.sin(time * 6);
        ctx.fillStyle = `rgba(123, 228, 149, ${0.25 + 0.35 * pulse})`;
        ctx.beginPath();
        ctx.arc(cx, cy, 30, 0, Math.PI * 2);
        ctx.fill();
        text(ctx, '🍖', cx, cy + 9, 24, '#fff', FONT, 'center');
        progressBar(cx - 24, cy + 34, 48, 6, slot.readyLeft / 5.5, '#7be495');
      } else {
        // Burnt: blackened patty with a wisp of smoke.
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(cx, cy, 22, 0, Math.PI * 2);
        ctx.fill();
        text(ctx, '🔥', cx, cy + 9, 22, '#fff', FONT, 'center');
        ctx.fillStyle = `rgba(200,200,200,${0.25 + 0.2 * Math.sin(time * 3 + i)})`;
        ctx.beginPath();
        ctx.arc(cx + 6, cy - 26 - 4 * Math.sin(time * 2 + i), 7, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  function drawPlateItems(items, cx, cy, size) {
    if (items.length === 0) return;
    const step = Math.min(30, 150 / items.length);
    const x0 = cx - ((items.length - 1) * step) / 2;
    items.forEach((item, i) => {
      text(ctx, itemEmoji(item), x0 + i * step, cy + 8, size, '#fff', FONT, 'center');
    });
  }

  function drawAssembly(world, rect, highlight) {
    drawStationBase('assembly', rect, highlight);
    const plate = world.assembly;
    if (plate === null) {
      text(ctx, 'letakkan piring di sini', rect.x + rect.w / 2, rect.y + 44, 14, 'rgba(0,0,0,0.45)', FONT, 'center');
      return;
    }
    ctx.fillStyle = '#f4f4f4';
    ctx.beginPath();
    ctx.ellipse(rect.x + rect.w / 2, rect.y + rect.h / 2 + 4, 86, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#bbb';
    ctx.lineWidth = 2;
    ctx.stroke();
    drawPlateItems(plate.items, rect.x + rect.w / 2, rect.y + rect.h / 2 - 4, 26);
  }

  function drawPlates(world, rect, highlight) {
    drawStationBase('plates', rect, highlight);
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = '#f4f4f4';
      ctx.beginPath();
      ctx.ellipse(rect.x + rect.w / 2, rect.y + 34 + i * 16, 34, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#bbb';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    text(ctx, '∞', rect.x + rect.w / 2, rect.y + rect.h - 8, 13, PALETTE.muted, FONT, 'center', '700');
    void world;
  }

  function drawWindow(world, rect, highlight) {
    drawStationBase('window', rect, highlight);
    ctx.fillStyle = '#2b1a08';
    roundRect(ctx, rect.x + 10, rect.y + 10, rect.w - 20, 74, 8);
    ctx.fill();
    text(ctx, '🔔', rect.x + rect.w / 2, rect.y + 46, 30, '#fff', FONT, 'center');
    text(ctx, 'SAJI', rect.x + rect.w / 2, rect.y + 76, 13, PALETTE.muted, FONT, 'center', '700');
    text(ctx, '→', rect.x + rect.w / 2, rect.y + rect.h - 14, 26, PALETTE.gold, FONT, 'center', '700');
    void world;
  }

  function drawTrash(world, rect, highlight) {
    drawStationBase('trash', rect, highlight);
    ctx.fillStyle = '#3a3a3a';
    roundRect(ctx, rect.x + 22, rect.y + 14, rect.w - 44, rect.h - 28, 8);
    ctx.fill();
    ctx.fillStyle = '#555';
    ctx.fillRect(rect.x + 16, rect.y + 8, rect.w - 32, 8);
    text(ctx, '🗑️', rect.x + rect.w / 2, rect.y + 56, 30, '#fff', FONT, 'center');
    void world;
  }

  function drawPlayer(world, time) {
    const p = world.player;
    // Shadow.
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(p.x, p.y + 18, 20, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    // Body: white chef coat with a red neckerchief.
    ctx.fillStyle = '#f8f8f8';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d8d8d8';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#d23b3b';
    ctx.beginPath();
    ctx.moveTo(p.x - 8, p.y + 2);
    ctx.lineTo(p.x + 8, p.y + 2);
    ctx.lineTo(p.x, p.y + 12);
    ctx.closePath();
    ctx.fill();
    // Face.
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(p.x - 7, p.y - 4, 2.4, 0, Math.PI * 2);
    ctx.arc(p.x + 7, p.y - 4, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y + 2, 6, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
    // Chef hat, bobbing gently while walking.
    const bob = Math.hypot(p.vx, p.vy) > 40 ? Math.sin(time * 14) * 1.5 : 0;
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, p.x - 14, p.y - 34 + bob, 28, 14, 6);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(p.x - 8, p.y - 34 + bob, 7, 0, Math.PI * 2);
    ctx.arc(p.x, p.y - 37 + bob, 8, 0, Math.PI * 2);
    ctx.arc(p.x + 8, p.y - 34 + bob, 7, 0, Math.PI * 2);
    ctx.fill();
    // What the chef carries, held up high.
    const hands = world.hands;
    if (hands !== null) {
      const hy = p.y - 52 + bob;
      if (hands.kind === 'plate') {
        ctx.fillStyle = '#f4f4f4';
        ctx.beginPath();
        ctx.ellipse(p.x, hy + 6, 26, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#bbb';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        drawPlateItems(hands.items, p.x, hy - 4, 18);
      } else {
        text(ctx, itemEmoji(hands.item), p.x, hy + 6, 30, '#fff', FONT, 'center');
        text(ctx, itemName(hands.item), p.x, hy - 12, 11, PALETTE.text, FONT, 'center', '700');
      }
    }
  }

  function drawTicket(order, x, y, time) {
    const urgent = order.patience <= 8;
    const flash = urgent && Math.sin(time * 8) > 0;
    ctx.fillStyle = flash ? '#ffd9d9' : PALETTE.ticket;
    roundRect(ctx, x, y, 218, 68, 8);
    ctx.fill();
    ctx.strokeStyle = urgent ? PALETTE.danger : PALETTE.ticketEdge;
    ctx.lineWidth = urgent ? 3 : 2;
    roundRect(ctx, x, y, 218, 68, 8);
    ctx.stroke();
    text(ctx, order.recipe.emoji, x + 10, y + 30, 26, '#000', FONT, 'left');
    text(ctx, order.recipe.name, x + 44, y + 22, 14, '#3a2408', FONT, 'left', '700');
    const items = order.recipe.items.map((i) => itemEmoji(i)).join(' ');
    text(ctx, items, x + 44, y + 44, 15, '#3a2408', FONT, 'left');
    text(ctx, `${order.recipe.price}`, x + 208, y + 22, 14, '#3a2408', FONT, 'right', '700');
    const frac = Math.max(0, order.patience / order.maxPatience);
    const color = frac > 0.5 ? '#4caf50' : frac > 0.25 ? '#ff9800' : '#e53935';
    progressBar(x + 10, y + 52, 198, 8, frac, color);
  }

  function drawHud(world, time) {
    // Top bar.
    ctx.fillStyle = 'rgba(20, 12, 4, 0.85)';
    ctx.fillRect(0, 0, FIELD.width, 84);
    ctx.fillStyle = PALETTE.panelEdge;
    ctx.fillRect(0, 84, FIELD.width, 2);
    world.orders.forEach((order, i) => drawTicket(order, 16 + i * 230, 8, time));
    if (world.orders.length === 0 && world.screen === SCREEN_PLAY) {
      text(ctx, 'Menunggu pesanan…', 24, 48, 16, PALETTE.muted, FONT, 'left');
    }
    // Coins, combo, clock, strikes on the right.
    const right = FIELD.width - 16;
    text(ctx, `🪙 ${world.coins}`, right, 32, 24, PALETTE.gold, FONT, 'right', '700');
    const mult = Math.min(2, 1 + 0.1 * Math.max(0, world.combo - 1));
    text(
      ctx,
      world.combo > 1 ? `KOMBO x${mult.toFixed(1)} (${world.combo})` : 'KOMBO —',
      right, 58, 14, world.combo > 1 ? PALETTE.ok : PALETTE.muted, FONT, 'right', '700',
    );
    const mm = String(Math.floor(world.timeLeft / 60));
    const ss = String(Math.floor(world.timeLeft % 60)).padStart(2, '0');
    const clockColor = world.timeLeft <= 30 ? PALETTE.danger : PALETTE.text;
    text(ctx, `${mm}:${ss}`, right - 190, 32, 24, clockColor, FONT, 'right', '700');
    text(ctx, `⏱ SHIFT`, right - 190, 58, 13, PALETTE.muted, FONT, 'right', '700');
    text(ctx, '✖'.repeat(world.strikes) + '·'.repeat(Math.max(0, 3 - world.strikes)), right - 300, 32, 20, PALETTE.danger, FONT, 'right');
    text(ctx, 'STRIKE', right - 300, 58, 13, PALETTE.muted, FONT, 'right', '700');
  }

  function drawPrompt(world) {
    const prompt = world.prompt();
    if (prompt === '') return;
    const p = world.player;
    const w = ctx.measureText(prompt).width + 24;
    ctx.font = `700 14px ${FONT}`;
    const tw = ctx.measureText(prompt).width + 24;
    void w;
    ctx.fillStyle = 'rgba(20, 12, 4, 0.85)';
    roundRect(ctx, p.x - tw / 2, p.y + 28, tw, 26, 13);
    ctx.fill();
    text(ctx, prompt, p.x, p.y + 46, 14, PALETTE.text, FONT, 'center', '700');
  }

  function drawToast(world) {
    if (world.message === '' || world.now > world.messageUntil) return;
    ctx.font = `700 18px ${FONT}`;
    const tw = ctx.measureText(world.message).width + 28;
    ctx.fillStyle = 'rgba(20, 12, 4, 0.88)';
    roundRect(ctx, (FIELD.width - tw) / 2, 96, tw, 34, 17);
    ctx.fill();
    ctx.strokeStyle = PALETTE.panelEdge;
    ctx.lineWidth = 1.5;
    roundRect(ctx, (FIELD.width - tw) / 2, 96, tw, 34, 17);
    ctx.stroke();
    text(ctx, world.message, FIELD.width / 2, 119, 18, PALETTE.text, FONT, 'center', '700');
  }

  function overlay(title, lines, accent) {
    ctx.fillStyle = 'rgba(10, 6, 2, 0.78)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    text(ctx, title, FIELD.width / 2, 190, 64, accent, FONT_DISPLAY, 'center');
    lines.forEach((line, i) => {
      text(ctx, line.text, FIELD.width / 2, 250 + i * 34, line.size, line.color, FONT, 'center', line.weight ?? '');
    });
  }

  function drawTitle(world) {
    overlay('DAPUR PANAS', [
      { text: '🍳  Rush Hour Kitchen  🍔', size: 26, color: PALETTE.gold },
      { text: 'Satu shift makan malam. Pesanan datang terus — potong, panggang,', size: 19, color: PALETTE.text },
      { text: 'susun di piring, sajikan sebelum pelanggan kabur. 3 strike = shift berakhir.', size: 19, color: PALETTE.text },
      { text: 'WASD / panah — jalan   •   E — pakai stasiun   •   1-5 / klik — ambil bahan', size: 17, color: PALETTE.muted },
      { text: 'P — jeda   •   M — suara   •   R — ulang shift', size: 17, color: PALETTE.muted },
    ], PALETTE.gold);
    text(ctx, '🍞 🥩 🥬 🍅 🧀', FIELD.width / 2, 480, 34, '#fff', FONT, 'center');
    text(
      ctx,
      world.best > 0 ? `Rekor koin: ${world.best}  •  Tekan Enter / klik untuk mulai` : 'Tekan Enter / klik untuk mulai',
      FIELD.width / 2, 540, 20, PALETTE.text, FONT, 'center', '700',
    );
  }

  function drawPaused() {
    overlay('JEDA', [
      { text: 'Istirahat sebentar, chef.', size: 20, color: PALETTE.text },
      { text: 'P / Enter — lanjut   •   R — ulang shift', size: 17, color: PALETTE.muted },
    ], PALETTE.text);
  }

  function drawResults(world, failed) {
    const stars = world.stars();
    const starRow = '★'.repeat(stars) + '☆'.repeat(3 - stars);
    overlay(failed ? 'SHIFT GAGAL' : 'SHIFT SELESAI!', [
      { text: starRow, size: 54, color: PALETTE.gold },
      { text: failed ? 'Tiga pesanan kabur — dapur tutup lebih awal.' : 'Makan malam selesai. Dapur bersih, dompet terisi.', size: 19, color: PALETTE.text },
      { text: `Koin: ${world.coins}   •   Tersaji: ${world.served}   •   Kabur: ${world.missed}`, size: 20, color: PALETTE.text, weight: '700' },
      { text: world.newBest ? '🏆 Rekor baru!' : `Rekor: ${world.best} koin`, size: 18, color: PALETTE.gold, weight: '700' },
      { text: 'Tekan R / Enter untuk shift berikutnya', size: 17, color: PALETTE.muted },
    ], failed ? PALETTE.danger : PALETTE.gold);
  }

  return {
    draw(world, time) {
      resize();
      ctx.clearRect(0, 0, FIELD.width, FIELD.height);
      drawFloor(time);
      const near = world.screen === SCREEN_PLAY ? world.nearestStation() : null;
      drawPantry(world, STATIONS.pantry, near === 'pantry');
      drawBoard(world, STATIONS.board, near === 'board');
      drawGrill(world, STATIONS.grill, near === 'grill', time);
      drawAssembly(world, STATIONS.assembly, near === 'assembly');
      drawPlates(world, STATIONS.plates, near === 'plates');
      drawWindow(world, STATIONS.window, near === 'window');
      drawTrash(world, STATIONS.trash, near === 'trash');
      drawPlayer(world, time);
      drawHud(world, time);
      drawPrompt(world);
      drawToast(world);
      if (world.screen === SCREEN_TITLE) drawTitle(world);
      else if (world.screen === SCREEN_PAUSED) drawPaused();
      else if (world.screen === SCREEN_VICTORY) drawResults(world, false);
      else if (world.screen === SCREEN_OVER) drawResults(world, true);
    },
  };
}
