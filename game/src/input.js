// Keyboard and mouse input. Held keys give a steering direction; one-shot
// presses (confirm, interact, pause, restart, pantry 1-5, mute) are queued as
// bit flags and taken once by the loop, so a press between two frames is
// never lost and never counted twice. The mouse position is reported in
// logical-field coordinates (the renderer tells us the current scale).
export const ACTION_CONFIRM = 1;
export const ACTION_INTERACT = 2;
export const ACTION_PAUSE = 4;
export const ACTION_RESTART = 8;
export const ACTION_MUTE = 16;
export const ACTION_PANTRY_1 = 32;
export const ACTION_PANTRY_2 = 64;
export const ACTION_PANTRY_3 = 128;
export const ACTION_PANTRY_4 = 256;
export const ACTION_PANTRY_5 = 512;
export const ACTION_PANTRY = [
  ACTION_PANTRY_1,
  ACTION_PANTRY_2,
  ACTION_PANTRY_3,
  ACTION_PANTRY_4,
  ACTION_PANTRY_5,
];

const LEFT = new Set(['ArrowLeft', 'KeyA']);
const RIGHT = new Set(['ArrowRight', 'KeyD']);
const UP = new Set(['ArrowUp', 'KeyW']);
const DOWN = new Set(['ArrowDown', 'KeyS']);
const CONFIRM = new Set(['Enter']);
const INTERACT = new Set(['KeyE', 'Space']);
const PAUSE = new Set(['KeyP', 'Escape']);
const RESTART = new Set(['KeyR']);
const MUTE = new Set(['KeyM']);
const PANTRY_CODES = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'];

export function createInput(canvas) {
  const held = { left: false, right: false, up: false, down: false };
  let actions = 0;
  let mouseX = 640;
  let mouseY = 420;
  let mouseDown = false;
  // Set by the renderer each frame: canvas CSS pixels per logical unit, and
  // the letterbox offset, so clicks map onto the field.
  let scale = 1;
  let offsetX = 0;
  let offsetY = 0;

  window.addEventListener('keydown', (event) => {
    if (LEFT.has(event.code)) held.left = true;
    else if (RIGHT.has(event.code)) held.right = true;
    else if (UP.has(event.code)) held.up = true;
    else if (DOWN.has(event.code)) held.down = true;
    else if (CONFIRM.has(event.code)) {
      if (!event.repeat) actions |= ACTION_CONFIRM;
    } else if (INTERACT.has(event.code)) {
      if (!event.repeat) actions |= ACTION_INTERACT;
    } else if (PAUSE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else if (RESTART.has(event.code)) {
      if (!event.repeat) actions |= ACTION_RESTART;
    } else if (MUTE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_MUTE;
    } else if (PANTRY_CODES.includes(event.code)) {
      if (!event.repeat) actions |= ACTION_PANTRY[PANTRY_CODES.indexOf(event.code)];
    } else return;
    event.preventDefault();
  });
  window.addEventListener('keyup', (event) => {
    if (LEFT.has(event.code)) held.left = false;
    else if (RIGHT.has(event.code)) held.right = false;
    else if (UP.has(event.code)) held.up = false;
    else if (DOWN.has(event.code)) held.down = false;
  });
  // A key released while the tab is hidden never sends keyup: let go on blur.
  window.addEventListener('blur', () => {
    held.left = held.right = held.up = held.down = false;
    mouseDown = false;
  });

  function trackPointer(event) {
    const rect = canvas.getBoundingClientRect();
    mouseX = (event.clientX - rect.left - offsetX) / scale;
    mouseY = (event.clientY - rect.top - offsetY) / scale;
  }
  canvas.addEventListener('pointermove', trackPointer);
  canvas.addEventListener('pointerdown', (event) => {
    trackPointer(event);
    mouseDown = true;
    actions |= ACTION_CONFIRM;
  });
  canvas.addEventListener('pointerup', () => {
    mouseDown = false;
  });

  return {
    setTransform(nextScale, nextOffsetX, nextOffsetY) {
      scale = nextScale;
      offsetX = nextOffsetX;
      offsetY = nextOffsetY;
    },
    /** Steering direction, -1/0/1 on each axis (diagonals normalised by caller). */
    direction() {
      return {
        x: (held.right ? 1 : 0) - (held.left ? 1 : 0),
        y: (held.down ? 1 : 0) - (held.up ? 1 : 0),
      };
    },
    mouse() {
      return { x: mouseX, y: mouseY, down: mouseDown };
    },
    /** The one-shot presses since the last call, as ACTION_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
  };
}
