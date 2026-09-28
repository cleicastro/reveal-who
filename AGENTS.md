# Agent Notes

## Commands
- Install/runtime tooling is Node + Gulp 4; `package-lock.json` is present and README setup uses `npm install`.
- `npm start` runs the default Gulp task: clean/copy/build, then BrowserSync from `build/` with watchers for `src/**/*.js` and `static/**/*`. It is long-running and BrowserSync defaults to port 3000.
- For a finite local build check, use `npx gulp build`. Verified working; it writes ignored output under `build/`.
- `npm run production` currently runs `gulp --production`, which still invokes the default `serve` task and fails before serving with `TypeError: pngquant is not a function` in `gulpfile.js`.
- There are no repo test, lint, typecheck, formatter, CI, or pre-commit configs in the current tree.

## Build Wiring
- Browserify entrypoint is `src/js/game.js`; bundled output is always `build/scripts/game.min.js`.
- Static source lives in `static/`; Gulp copies it into ignored `build/` and also copies Phaser plus `src/js/lib/*` into `build/scripts/`.
- Development builds generate a source map via `exorcist`; production builds skip the source map and attempt Uglify plus image/JSON minification.

## App Structure
- Phaser 2 is loaded globally from `static/index.html`; modules reference global `Phaser`, `GAME`, and browser globals rather than importing Phaser.
- State registration happens in `src/js/game.js` from `src/js/states/index.js`; flow is `Boot -> Preload -> Menu -> Play/Over`.
- Most game objects attach mutable state to the singleton exported from `src/js/game.js` (`GAME.player`, groups, sounds, counters). Check existing object modules before adding new global fields.
- Asset keys and file paths are centralized in `src/js/states/preload.js`; it currently references missing `static/assets/images/items/items_2.{png,json}` files.

## Gotchas
- `build/` and `node_modules/` are ignored; do not commit generated build output.
- `src/js/objects/constants.js` controls map dimensions, scaling, music, and `DEBUG_ON`; enabling debug also loads the Phaser Debug plugin in `Boot`.
