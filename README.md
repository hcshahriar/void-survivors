# Void Survivors

[Play now](https://hcshahriar.github.io/void-survivors/)

A neon space survival roguelike built with Phaser 3 and TypeScript. Pilot a lone ship, hold the containment breach, and outlast the swarm for fifteen minutes.

## Features

- Six weapons with Auto or Manual aim, five upgrade levels, and chest-triggered evolutions.
- Eight enemy types with different movement, attack, healing, shield, and split behaviors.
- Three multi-phase bosses, elite drops, magnetized XP, and paused level-up choices.
- Permanent ship and system upgrades, three selectable ships, a local leaderboard, and commendations.
- Synthesized Web Audio, responsive visual settings, and saved pilot preferences.

## Controls

- Keyboard: `WASD` or arrow keys to move; `P` or `Escape` to pause or resume; `Enter` or `Space` to start or retry.
- Gamepad: left stick to move; Start to pause. Auto mode handles combat.
- Manual aim: point with the mouse and hold its button to fire.
- Touch: drag the left stick to move; in Manual mode, drag the right stick to aim and fire. Tap menus and upgrade cards.

## Run locally

Requires Node.js 22.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. Production assets use the `/void-survivors/` base path for GitHub Pages.

## Scripts

| Command                | Purpose                                   |
| ---------------------- | ----------------------------------------- |
| `npm run dev`          | Start the Vite development server.        |
| `npm test`             | Run the Node-only core test suite.        |
| `npm run test:watch`   | Run Vitest in watch mode.                 |
| `npm run lint`         | Check TypeScript with ESLint.             |
| `npm run format`       | Format project files with Prettier.       |
| `npm run format:check` | Check formatting without edits.           |
| `npm run build`        | Type-check and build the production game. |
| `npm run preview`      | Serve the production build locally.       |

## Architecture

- `src/core/`: deterministic, renderer-free rules for combat, waves, progression, upgrades, saves, achievements, and leaderboard.
- `src/data/`: typed balance and content definitions.
- `src/scenes/`: boot, menu, shop, ship selection, stats, settings, gameplay, overlays, and run summary.
- `src/entities/` and `src/systems/`: Phaser actors, pools, input, waves, combat, weapons, bosses, progression, and feedback.
- `src/audio/`, `src/ui/`, and `src/utils/`: procedural sound, shared scene UI, generated textures, and browser storage.
- `tests/`: Vitest tests for core rules. These run in Node without Phaser or a browser.

## Extend the game

### Add a weapon

Add the typed definition to `WEAPONS` in `src/data/content.ts`, add a generated projectile texture in `src/utils/createTextures.ts`, and implement its firing behavior in `src/systems/WeaponSystem.ts`. Set its max level and evolution passive in the data, add an `EVOLUTIONS` recipe, then cover selection and evolution rules in `tests/`.

### Add an enemy

Add an `EnemyDefinition` to `ENEMIES`, draw its texture in `src/utils/createTextures.ts`, and implement its movement/attack behavior in `src/systems/EnemySystem.ts`. Keep health, speed, damage, unlock time, and spawn weight in the definition; add focused tests for any new pure rule.

### Add a boss

Add its timed health and phase thresholds to `BOSSES`, then add a telegraph and attack pattern to `src/systems/BossSystem.ts`. Boss defeat and treasure-chest rewards are handled by `src/scenes/GameScene.ts`; update the wave schedule and tests when changing its timing.

See [DESIGN.md](DESIGN.md) for the game loop and visual direction, and [.github/copilot-instructions.md](.github/copilot-instructions.md) for architecture conventions.
