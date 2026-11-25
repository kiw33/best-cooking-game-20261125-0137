// DAPUR PANAS — boot and the one loop: input is read every frame, the world
// advances in fixed 1/60 s steps (several in a slow frame, none in a fast
// one), and the renderer paints what is there. The game moves between five
// screens: title, play, paused, victory and game over.
//
// ?seed=N fixes the run's randomness. ?shot=start|play|victory|end (with
// &seed=N) stages that scene instead of running the loop, paints it twice
// and sets window.__shotReady for a screenshot.
import { STEP } from './config.js';
import { createRandom } from './random.js';
import { createAudio } from './audio.js';
import { createWorld, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_VICTORY } from './world.js';
import {
  ACTION_CONFIRM, ACTION_INTERACT, ACTION_MUTE, ACTION_PANTRY, ACTION_PAUSE, ACTION_RESTART, createInput,
} from './input.js';
import { PANTRY_KEYS } from './config.js';
import { createRenderer } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const random = createRandom(seed);
const audio = createAudio();
const input = createInput(canvas);
const world = createWorld(random, audio);
const renderer = createRenderer(canvas, input);
// A read-only handle for play-testing and debugging (the finalist review
// can poke at the live game with it too). Gameplay never reads it.
window.__dapurPanas = world;
world.best = world.readBest();

function announce(text) {
  status.textContent = text;
}

function handleActions(actions) {
  if (actions & ACTION_MUTE) {
    const muted = audio.toggleMute();
    announce(muted ? 'Sound off.' : 'Sound on.');
  }
  if (world.screen === SCREEN_TITLE) {
    if (actions & ACTION_CONFIRM) {
      audio.unlock();
      audio.click();
      world.start();
      announce('Shift dimulai. Sajikan pesanan sebelum pelanggan kabur.');
    }
    return;
  }
  if (world.screen === SCREEN_PLAY) {
    if (actions & ACTION_PAUSE) {
      world.screen = SCREEN_PAUSED;
      announce('Jeda.');
    } else if (actions & ACTION_RESTART) {
      world.start();
      announce('Shift diulang.');
    } else if (actions & ACTION_INTERACT) {
      world.interact();
    } else {
      for (let i = 0; i < ACTION_PANTRY.length; i += 1) {
        if (actions & ACTION_PANTRY[i]) {
          world.pantryTake(PANTRY_KEYS[i]);
          break;
        }
      }
    }
    // A click on a station uses it; a click elsewhere is just a confirm.
    if (actions & ACTION_CONFIRM) {
      const mouse = input.mouse();
      if (!world.clickAt(mouse.x, mouse.y)) {
        // Clicked open floor: nothing to do.
      }
    }
    return;
  }
  if (world.screen === SCREEN_PAUSED) {
    if (actions & ACTION_PAUSE || actions & ACTION_CONFIRM) {
      world.screen = SCREEN_PLAY;
      announce('Lanjut masak.');
    } else if (actions & ACTION_RESTART) {
      world.start();
      announce('Shift diulang.');
    }
    return;
  }
  if (world.screen === SCREEN_VICTORY || world.screen === SCREEN_OVER) {
    if (actions & ACTION_CONFIRM || actions & ACTION_RESTART) {
      audio.click();
      world.start();
      announce('Shift dimulai. Sajikan pesanan sebelum pelanggan kabur.');
    }
  }
}

if (shot) {
  stageShot(world, renderer, shot, random);
} else {
  let last = performance.now();
  let acc = 0;
  function frame(now) {
    const elapsed = Math.min(MAX_FRAME, (now - last) / 1000);
    last = now;
    acc += elapsed;
    const actions = input.takeActions();
    if (actions) handleActions(actions);
    let steps = 0;
    while (acc >= STEP && steps < 5) {
      // One-shot presses act on the first step only: a second step in the
      // same frame must not chop or serve twice.
      world.update(STEP, input, steps === 0 ? actions : 0);
      acc -= STEP;
      steps += 1;
    }
    if (steps === 5) acc = 0;
    renderer.draw(world, now / 1000);
    requestAnimationFrame(frame);
  }
  announce('DAPUR PANAS. Tekan Enter atau klik untuk mulai shift.');
  requestAnimationFrame(frame);
}
