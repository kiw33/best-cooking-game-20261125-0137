// Screenshot staging: ?shot=start|play|victory|end (with &seed=N) paints one
// fixed scene instead of running the loop, twice, then sets
// window.__shotReady so a screenshot tool knows the frame is final.
// Every shot is a real render of the game's own code — never a picture.
import {
  SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_VICTORY,
} from './world.js';

export function stageShot(world, renderer, shot, random) {
  void random;
  if (shot === 'start') {
    world.screen = SCREEN_TITLE;
    world.best = 850;
    world.coins = 0;
    renderer.draw(world, 1.2);
    renderer.draw(world, 1.2);
  } else if (shot === 'play') {
    // A busy mid-shift frame: two tickets open, a patty sizzling on the grill,
    // lettuce chopped on the board, a plate half-built on the assembly counter,
    // and the chef mid-kitchen carrying a tomato.
    world.start();
    world.elapsed = 62;
    world.timeLeft = 118;
    world.coins = 320;
    world.combo = 3;
    world.served = 5;
    world.orders = [
      { id: 6, recipeId: 'classic', recipe: { name: 'Burger Klasik', price: 60, emoji: '🍔', items: ['bun', 'patty-cooked', 'lettuce-chopped'] }, patience: 26, maxPatience: 42 },
      { id: 7, recipeId: 'salad', recipe: { name: 'Salad Segar', price: 45, emoji: '🥗', items: ['lettuce-chopped', 'tomato-chopped'] }, patience: 9, maxPatience: 42 },
    ];
    world.board = { item: 'lettuce', progress: 1, done: true };
    world.grill = [{ state: 'cooking', progress: 0.62, readyLeft: 0 }, null];
    world.assembly = { items: ['bun', 'cheese'] };
    world.hands = { kind: 'item', item: 'tomato' };
    world.player.x = 640;
    world.player.y = 400;
    world.player.vx = 120;
    world.screen = SCREEN_PLAY;
    world.message = 'Daging di grill hampir matang!';
    world.messageUntil = 99;
    renderer.draw(world, 2.4);
    renderer.draw(world, 2.4);
  } else if (shot === 'victory') {
    world.start();
    world.elapsed = 180;
    world.timeLeft = 0;
    world.coins = 920;
    world.served = 14;
    world.missed = 1;
    world.strikes = 1;
    world.combo = 5;
    world.newBest = true;
    world.best = 920;
    world.screen = SCREEN_VICTORY;
    renderer.draw(world, 1.2);
    renderer.draw(world, 1.2);
  } else if (shot === 'end') {
    world.start();
    world.elapsed = 141;
    world.timeLeft = 39;
    world.coins = 410;
    world.served = 7;
    world.missed = 3;
    world.strikes = 3;
    world.combo = 0;
    world.best = 850;
    world.newBest = false;
    world.screen = SCREEN_OVER;
    renderer.draw(world, 1.2);
    renderer.draw(world, 1.2);
  }
  window.__shotReady = true;
}
