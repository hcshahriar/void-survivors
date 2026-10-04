# Void Survivors Engineering Notes

## Architecture

- `src/core/` contains deterministic, renderer-free rules. It may import `src/data/` and other core modules, but never Phaser, browser globals, or DOM types.
- `src/data/` is the typed source of truth for balance and content. Game systems consume these definitions instead of embedding tuning values.
- `src/scenes/` owns scene transitions and screen-level flow. `src/entities/` owns game actors; `src/systems/` coordinates combat, spawning, pickups, progression, and pools.
- `src/audio/` owns procedural audio and its lifecycle. `src/ui/` owns DOM overlays and menus. `src/utils/` contains small shared adapters that are not game rules.
- `tests/` runs in Node and tests core behavior without a Phaser renderer or browser environment.

## Conventions

- Keep TypeScript strict. Avoid `any`, unused symbols, hidden global state, and placeholder TODOs.
- Keep tuning values in typed content or balance objects. Pass random sources into core decisions so tests can use seeded deterministic sequences.
- Treat local persistence as untrusted: version saves, validate/migrate on read, catch storage errors, and return defaults on invalid data.
- Use pools for frequently created Phaser objects. Do not allocate arrays, closures, or temporary objects inside hot per-frame loops.
- Put state transitions behind scenes or explicit systems; views render state and dispatch intent rather than deciding game rules.
- Add focused Vitest coverage in `tests/` whenever core behavior or data contracts change.

## Checks

Run `npm run lint`, `npm test`, and `npm run build` before completing a phase. Run `npm run format:check` when changing source, config, or docs.
