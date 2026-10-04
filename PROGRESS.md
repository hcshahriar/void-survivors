# Development Progress

## Phase 1: Foundation and core

**Status:** Done

**Done:** Added typed balance/content catalogs; pure deterministic core modules for RNG, combat, XP, wave timing, upgrades/evolutions, meta shop, versioned saves, leaderboard, and achievements; Node-only tests; strict TS project references; flat ESLint config; Prettier; Phaser build chunk; architecture guidance in `.github/copilot-instructions.md`; `package-lock.json`.

**Checks:** `npm run lint`, `npm test` (33 passing), and `npm run build` all pass.

## Phase 2: Core loop vertical slice

**Status:** Done

**Done:** Replaced the monolithic prototype with Boot/Menu/Game/UIOverlay/GameOver scenes; generated textures once in Boot; added FIT scaling, keyboard/arrows, gamepad, and touch joystick input; pooled player combat entities; six auto-fire weapon behaviors; eight enemy behaviors; magnetized XP and queued, pausing level-up choices; HUD, pause/restart, defeat/victory routing, and run result persistence.

**Checks:** `npm run lint`, `npm test` (33 passing), and `npm run build` all pass. Browser check confirmed deploy, live combat/score, and pause/resume by button and `P`.

## Phase 3: Full 15-minute run

**Status:** Done

**Done:** Added seeded 15-minute wave pressure with a 300-enemy cap and off-screen spawning; eight distinct enemy behaviors including telegraphed dasher/exploder attacks; three timed multi-phase bosses with charged patterns, HUD health bars, and minion summons; elite drops; six weapon/passive chest evolution recipes; pooled projectiles, enemies, gems, particles, and damage numbers; final victory gated on defeating the singularity.

**Checks:** `npm run lint`, `npm test` (35 passing), and `npm run build` all pass without warnings.

## Phase 4: Meta and polish

**Status:** Done

**Done:** Added menu navigation, permanent upgrade shop with starting-score and reroll effects, three-ship selection/unlocks, pilot statistics, local top-ten board, 12 commendations with in-run toasts, saved audio/accessibility/display settings, gesture-unlocked procedural SFX and wave-intensity synth loop, visibility auto-pause, screen shake, hit feedback, pooled particles/numbers, and FPS overlay.

**Checks:** `npm run lint`, `npm test` (37 passing), and `npm run build` all pass without warnings. Browser check confirmed settings controls render and persist.

## Phase 5: Tests, CI, and docs

**Status:** Done

**Done:** Added Node 22 pull-request CI and GitHub Pages deployment workflows; completed the README with controls, features, scripts, architecture, extension guides, and Play Now link; added the MIT license; upgraded to patched ESLint 10/Vitest 5; verified clean `npm ci` and zero vulnerabilities. Fixed mobile canvas sizing, fresh-overlay lifecycle, P/Escape routing, and mutually exclusive victory/defeat transitions.

**Checks:** `npm ci`, `npm run format:check`, `npm run lint`, `npm test` (37 passing), `npm run build`, and `npm audit` (zero vulnerabilities) all pass. Browser checks cover title/navigation, settings persistence, gameplay/score, mobile fit, and keyboard/button pause/resume.

## Known issues

- Listen to procedural audio on a physical device and tune mix/loop feel if needed; automated browser checks cannot assess sound quality.
- The complete 15-minute victory balance has not been manually played through in real time; boss timings, progression, scaling, caps, and terminal rules are covered by core tests.

## Overall

**Status:** All five phases complete. The game is ready for local play and GitHub Pages deployment from `main`.

## Follow-up: Aim modes

**Status:** Done

**Done:** Added saved `Auto`/`Manual` aim selection with Auto as the default; Manual rotates toward the desktop cursor or right touch stick and fires only while the mouse button or right stick is held. Updated the Settings selector and README controls.

**Checks:** `npm run format:check`, `npm run lint`, `npm test` (38 passing), and `npm run build` pass. Browser check confirmed Manual persists, held mouse fire hits, Auto is restored as the browser-test save value, and no runtime errors occur.
