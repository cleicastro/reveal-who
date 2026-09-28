# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SuperMarioWorldJS: a Super Mario World clone built with Phaser 2, ES6, and Vite. The game runs in a browser with keyboard controls (Arrow keys for movement, A to run, S to jump, D to spin jump, M to toggle mute). Modernized for Node 20+ with Vite 5 and modern Babel.

## Development Commands

**Start development server** (hot reload on port 3000):
```bash
npm start
```

**Build for production** (minified, tree-shaken):
```bash
npm run build
```

**Preview production build locally**:
```bash
npm run preview
```

No test, lint, typecheck, or formatter commands are configured.

## Architecture

### Game Flow

States load in sequence: **Boot** → **Preload** → **Menu** → **Play** / **Over**. State registration happens asynchronously in `game.js` via dynamic import after the Phaser instance is created (avoids circular import issues).

- **Boot** (`src/js/states/boot.js`): Physics system setup; slopes/debug plugins commented out (not available)
- **Preload** (`src/js/states/preload.js`): Asset loading (sprites, audio, tilemaps)
- **Menu** (`src/js/states/menu.js`): Title screen
- **Play** (`src/js/states/play.js`): Active gameplay
- **Over** (`src/js/states/over.js`): Game over/level end

### Code Organization

```
src/js/
├── game.js              # Entry point; creates GAME singleton, async-imports & registers states
├── states/
│   ├── index.js         # Re-exports all state classes
│   ├── boot.js
│   ├── preload.js
│   ├── menu.js
│   ├── play.js
│   └── over.js
└── objects/             # Game logic modules
    ├── constants.js     # Game config + gameplay tuning (lives, time, speeds, points)
    ├── frames.js        # Central atlas frame table (Mario small/big, enemies, items)
    ├── player.js        # Mario state machine (small/big, grow/shrink, invuln, death/respawn)
    ├── gamestate.js     # Run state: score, lives, time, coins, letter progress, checkpoint
    ├── mechanics.js     # Movement, jump/spin, size-aware animation, fall-death, freeze
    ├── map.js           # Tilemap/terrain (Yoshi's Island 1); buildSlopes() disabled
    ├── enemies.js       # Goomba + Green Koopa + shell; stomp/side combat dispatch
    ├── powerups.js      # ? blocks (hit-from-below) + growth mushroom physics
    ├── collectibles.js  # Coins + CAUÃ/AYLA letter glyphs + name-complete bonus
    ├── movingplatform.js# Horizontal/vertical moving platforms (with rider carry)
    ├── goal.js          # Staircase + flagpole/flag + castle; x-threshold completes level
    ├── camera.js        # Viewport following
    ├── controls.js      # Keyboard input
    ├── hud.js           # Camera-fixed HUD text (score/lives/time/coins/letters/state)
    ├── sound.js         # Audio registry + sound.play(name); built once (no restart leak)
    ├── coins.js         # (legacy, unused — superseded by collectibles.js)
    ├── enemy.js         # (legacy, unused — superseded by enemies.js)
    └── resize.js        # Responsive scaling
```

### Level 1 Gameplay (Super Mario World style)

Built on top of the existing Yoshi's Island 1 terrain (ground surface y≈384, world 5120×432).
`Play.create()` builds terrain, then populates entities via per-module `createLevel1()`/
`spawnLevel1()`; `Play.update()` drives the systems each frame in order: mechanics → enemies →
powerups → collectibles → moving platforms → goal → hud.

- **Mario state machine** (`player.js`): `marioSize` small/big. Mushroom grows; enemy side/below
  contact shrinks Big→Small with a damage-invulnerability window (`invulnUntil`), or kills Small
  Mario (lose a life, respawn at `GAME.checkpoint`). Grow uses a separate visual `flashUntil` that
  does NOT grant immunity. `frames.js` holds the verified per-size frame indices.
- **Combat** (`enemies.js`): stomp is detected by a velocity-independent "was-above-last-frame"
  test (`body.prev`), avoiding Arcade's touching.up false-pos/neg. Stomp kills Goomba (squash) /
  converts Koopa→shell + bounce + points. Idle shell is kicked on side contact; a moving shell
  plows through enemies (enemy-vs-enemy uses `overlap`, not `collide`) and damages Mario.
- **Collectible letters**: CAUÃ (intermediate area) and AYLA (advanced area), rendered as Phaser
  text glyphs; HUD shows `CAUÃ x/4` / `AYLA x/4`; completing a name awards a bonus + banner.
- **Goal**: crossing `GOAL_X` (flagpole) completes the level → `Over` state shows the victory
  screen ("VOCÊ VENCEU!"); 0 lives → game over. Press **S** to restart.

### Verifying gameplay (headless)

There is no test suite. To verify behavior, drive the running dev server with Chrome via
`puppeteer-core` (Chrome at `/usr/bin/google-chrome`; install with `npm i puppeteer-core --no-save`).
Boot with `waitUntil: 'domcontentloaded'` (NOT `networkidle2` — the external CDN scripts
intermittently fail and stall it), then `waitForFunction(() => window.GAME.state.current === 'Play')`.
Read/inspect state via `window.GAME` (score, lives, `player.marioSize`, `enemies`, `progress`).
Note: teleport-stomping by dropping the player far onto an enemy can ram it into the tile layer
(an artifact); real bounce-stomps leave enemies on the surface.

### Global State

Phaser is loaded globally via CDN (`index.html`). The app exports `GAME` (the Phaser.Game instance) as `window.GAME` and ES6 default export from `src/js/game.js`.

Game state is mutable and attached to `GAME`:
- `GAME.player` - player sprite object
- `GAME.groups` - sprite groups (enemies, coins, platforms)
- `GAME.sounds` - audio objects
- Various flags (muted, levelComplete, etc.)

**Circular imports**: Since `states/*` import `GAME` and `game.js` imports states, state registration is deferred via dynamic `import()` in `game.js` to avoid undefined references at module load time.

### Asset Pipeline

- **Locations**: source in `static/`, output in ignored `build/`
- **Keys**: sprite/atlas/audio identifiers centralized in `src/js/states/preload.js`
- **Vite config** (`vite.config.js`): copies `static/` as `publicDir`, outputs to `build/`, applies Terser + @vitejs/plugin-legacy for browser support

### Build System (Vite + Babel)

Vite v5 replaced Gulp/Browserify:
1. Bundle `src/js/game.js` (entrypoint in `index.html`) via Rollup + Babel
2. Apply @vitejs/plugin-legacy for older browser fallbacks
3. Minify with Terser
4. Serve `static/` files (assets, CSS, images) with hot reload during dev
5. Output to `build/` for production

## Phaser Plugins (Disabled)

- **ArcadeSlopes**: collision handling for slope tiles — plugin undefined at runtime, `map.js:buildSlopes()` and `player.js:GAME.slopes.enable()` are commented
- **Phaser.Plugin.Debug**: stats overlay — commented in `boot.js`

To re-enable slopes, integrate a compatible slopes library or manually implement tilemap collision logic. Debug can be restored if the plugin is available at runtime.

## Known Issues

- **Plugins unavailable**: ArcadeSlopes and Debug are disabled; gameplay is stable without them.
  Because ArcadeSlopes is off, the original map's diagonal slope-tile sections render as solid
  AABB "hills/steps" (cosmetic; still walkable).
- **CDN dependency**: `index.html` loads `phaser-ce` (and a non-functional arcade-slopes) from a
  CDN. If the CDN is unreachable the game will not boot; vendoring `phaser-ce` into `static/`
  would make it offline-robust.
- **Audio**: the gameplay SFX in `static/assets/audio/effects/` (stomp, kick, letter, powerup,
  shrink, oneup, levelclear, namebonus) are synthesized WAVs; regenerate with a tone script if needed.

## Configuration

Game constants live in `src/js/objects/constants.js`: rendering (SNES height, scale, resize
factor, music/debug flags, map size) plus gameplay tuning (START_LIVES, START_TIME, speeds,
gravity, STOMP_BOUNCE, INVULN_MS, point values, and the CAUÃ/AYLA name letters).
