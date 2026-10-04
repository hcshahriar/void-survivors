# Void Survivors: Design

## Premise

Hold the line in a failing deep-space containment zone. Void Survivors is a fast, replayable arena survival game: pilot a lone ship, evade incoming void creatures, and let its targeting rig fire at the nearest threat while you decide where to move.

## Player experience

- Start a run immediately from the title screen; no account, tutorial, or setup is required.
- Read the battlefield at a glance: the player, enemies, projectiles, pickups, health, and elapsed time use distinct silhouettes and colors.
- Make movement the central decision. The weapon fires automatically, so staying alive and positioning for the next opening are the player's work.
- Each run ends in defeat or a deliberate pause. A clear summary and one-action restart make another attempt frictionless.

## Core loop

1. Move through an open, bounded arena while enemies close in from outside the viewport.
2. The ship automatically targets and fires at the nearest enemy in range.
3. Defeated enemies can drop energy shards. Collecting them increases the run's score and experience.
4. Enemy pressure rises over time. Survive as long as possible and beat the previous score on the next run.

## Controls

- `W`, `A`, `S`, `D` or arrow keys: move in four directions, normalized diagonally.
- `P` or `Escape`: pause or resume an active run.
- `Enter` or `Space`: start, restart, or confirm the end screen.

## Game rules

- The ship has a small health pool and brief damage invulnerability to prevent a single collision from draining all health instantly.
- Enemies spawn just beyond the visible arena edge, steer toward the ship, and damage on contact.
- The weapon has a fixed range and cooldown; it chooses the nearest valid target and creates a visible projectile.
- Enemy spawn rate and durability increase gently as the run continues, preserving a readable opening and a tense late game.
- Pickups are optional to survive but reward safe, deliberate movement through the arena.
- The run ends at zero health. The final time and score remain visible until the player starts again.

## Visual direction

The game should feel like a bright instrument panel suspended in near-black space, not a generic purple neon screen. Use a charcoal-blue void, restrained cyan and mint for the ship and friendly information, hot coral for threats and damage, and warm amber for score and pickups. A sparse starfield and thin orbital markings provide depth without competing with gameplay. Favor crisp geometric shapes and short flashes over heavy bloom; all essential state must remain legible on a small display.

## Interface

- The title screen introduces the ship and starts the first run with a single primary action.
- During play, a compact HUD shows health, elapsed survival time, and score without covering the arena.
- Pause is an explicit overlay with resume and restart actions; simulation and timers stop while paused.
- Defeat presents the run result and a prominent retry action.
- The canvas scales to the available viewport while preserving a consistent arena coordinate system and keeping keyboard focus available.

## Scope

The first version is a complete single-player arcade loop, not a meta-progression system. It needs one ship, one basic weapon, one enemy archetype, one pickup, a title/pause/defeat flow, and persistent best-score storage in the browser. Keep gameplay rules independent enough to test without rendering; introduce additional weapons, enemy types, and upgrades only after this loop feels good.

## Acceptance checks

- A player can start, move, pause, resume, lose, and restart without reloading the page.
- Enemies approach the player; the weapon selects and hits targets automatically.
- Health, timer, score, and best score update at the right moments.
- Gameplay pauses completely under the pause overlay and ends cleanly when health reaches zero.
- The arena and HUD remain usable on desktop and narrow mobile viewports.
