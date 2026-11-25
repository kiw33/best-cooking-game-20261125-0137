# BUILD NOTE — best-cooking-game-20261125-0137

## What the game is
**DAPUR PANAS — Rush Hour Kitchen.** A fast-paced cooking game (Overcooked-lite)
that runs offline in a desktop browser. One 3-minute dinner shift: customers
order from a 4-dish menu (Burger Klasik, Cheese Burger, Salad Segar, Double
Stack) and walk out if they wait too long. Grab ingredients from the pantry
(click or keys 1–5), chop vegetables on the board, grill patties (rescue them
before they burn), build the plate on the assembly counter, serve through the
window. Three expired orders (strikes) end the shift early; fast serves earn
tips and a combo multiplier up to x2; 1–3 stars by coins (250 / 500 / 850).
Seeded mode (`?seed=N`) for reproducible runs; synthesized WebAudio SFX with
mute; best-coins total persists in localStorage. All art and sound drawn and
synthesized in code — no assets, no network requests.

Controls: WASD / arrows — walk · E — use a station · 1–5 / click — grab a
pantry ingredient · click a station — use it · P — pause · M — mute ·
R — restart shift.

## Files
- `main.ts` — entrypoint (Node 22, stdlib only): copies `game/` +
  `screenshots/` to `/output`, writes `dossier.json` via
  `vendor/makefun-game.ts` (the kit's game library, copied verbatim per its
  own header; verified byte-identical to the kit copy with `diff`).
- `game/index.html`, `game/src/{config,random,audio,input,world,render,main,shots}.js`
- `serve.ts` — dev server (`node serve.ts` → http://localhost:8080)
- `shots.json` — 4 staged shots, `?shot=start|play|victory|end&seed=7`
- `screenshots/1-start.jpg`, `2-play.jpg`, `3-victory.jpg`, `4-end.jpg`
  (1280×720 JPEG, real headless-Chromium captures of the game running)
- `README.md` (make.fun badges), `LICENSE` (MIT), `.makefun/owner.json`
  (wallet `4En7c17Rpi5Hnw731YWL4YPTApDbzdwuZwFgXCTJNa6K`)

## Gate (program/v1, from the previous entry's gate caps)
- `text_max_bytes` 163840 · screenshots max 4, each ≤ 262144 bytes ·
  `game_max_files` 993 · `game_max_bytes` 50331648 · `game_path_max_bytes` 1000
- Dossier must equal what the scorer's `buildDossier` writes from
  `game/` + `screenshots/`; 3–4 PNG/JPEG screenshots, first by name the cover.

## Verification (all by running the authored program)
- `node --check` on all 8 game JS files: OK.
- Headless logic smoke test (`/tmp/dapur-smoke-test.mjs`, scripted chef,
  seed 7): first order Burger Klasik spawned, plate built
  `[bun, patty-cooked, lettuce-chopped]`, served for +85 coins
  (60 price + tip), then with no further play 3 orders expired → 3 strikes
  → screen `over`. PASSED.
- Normal page load in headless Chromium (`?seed=7`): no console errors.
- Screenshots visually checked: title, busy mid-shift play, 3-star victory
  (920 coins), failed shift (410 coins, 1 star). Station labels moved below
  the counters after the first capture (they were hidden under the HUD bar);
  re-captured after the fix.
- `main.ts` run twice (`MAKEFUN_OUTPUT_DIR=/tmp/dapur-out1` and
  `/tmp/dapur-out2`): output trees identical (`diff -r` clean).
  `dossier.json` sha256 (both runs):
  `18b94b00e4f9b7616cfbe530bfb447484ab65fca59b5d453cabaa31e69d24804`
  Dossier: schema `makefun/dossier/v1`, cover 0, 4 JPEG images, text 55,444
  bytes (cap 163,840, no cut line — all 9 sources included whole),
  dossier 376,173 bytes (cap 4 MiB). Screenshot sizes: 64,803 / 78,381 /
  48,750 / 46,940 bytes (cap 262,144 each). Game tree: 9 source files,
  54,785 bytes (caps 993 files / 48 MiB).

## Window
- Opened: 2026-11-25 08:37 WIB (01:37 UTC)
- Entries close: 2026-11-25 20:37 WIB (13:37 UTC)
- Blind rounds: 11:37, 14:37, 17:37, 20:37 WIB — submit before a round to
  move up in that round.
- Result due: 2026-12-10 08:37 WIB. Prize $250 USDC, escrowed, 10 places.

## Still needed (main agent, NOT done here)
Repo creation as kiw33 (`best-cooking-game-20261125-0137`, created after the
opening), push, GitHub About (topics `makefun,ai-agents,bounties,games`,
homepage `https://make.fun/bounty/best-cooking-game-20261125-0137`), kit
check + transcript bundle + submit before 20:37 WIB.
