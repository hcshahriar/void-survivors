import { BALANCE } from '../data/balance';
import type { BossDefinition, EnemyDefinition } from '../data/content';
import { chooseWeighted, type RandomSource } from './rng';

export interface WaveState {
  elapsedSeconds: number;
  wave: number;
  spawnIntervalMs: number;
  batchSize: number;
  difficulty: number;
  atVictory: boolean;
}

export function spawnIntervalAt(elapsedSeconds: number): number {
  const elapsed = Math.max(0, Math.min(BALANCE.run.durationSeconds, elapsedSeconds));
  return Math.max(
    BALANCE.waves.minimumIntervalMs,
    BALANCE.waves.firstIntervalMs - elapsed * BALANCE.waves.intervalReductionPerSecond,
  );
}

export function spawnBatchSizeAt(elapsedSeconds: number): number {
  const elapsed = Math.max(0, Math.min(BALANCE.run.durationSeconds, elapsedSeconds));
  return Math.min(
    BALANCE.waves.maximumBatchSize,
    BALANCE.waves.firstEnemyCount +
      Math.floor(elapsed / BALANCE.waves.batchIncreaseSeconds),
  );
}

export function getWaveState(elapsedSeconds: number): WaveState {
  const elapsed = Math.max(0, Math.min(BALANCE.run.durationSeconds, elapsedSeconds));
  const wave = Math.floor(elapsed / 60) + 1;
  return {
    elapsedSeconds: elapsed,
    wave,
    spawnIntervalMs: spawnIntervalAt(elapsed),
    batchSize: spawnBatchSizeAt(elapsed),
    difficulty: 1 + elapsed / BALANCE.run.durationSeconds,
    atVictory: elapsed >= BALANCE.run.durationSeconds,
  };
}

export function activeEnemyPool(
  elapsedSeconds: number,
  enemies: readonly EnemyDefinition[],
): EnemyDefinition[] {
  return enemies.filter((enemy) => enemy.unlockSecond <= elapsedSeconds);
}

export function chooseEnemy(
  elapsedSeconds: number,
  enemies: readonly EnemyDefinition[],
  random: RandomSource,
): EnemyDefinition | undefined {
  const available = activeEnemyPool(elapsedSeconds, enemies);
  return chooseWeighted(available, (enemy) => enemy.spawnWeight, random);
}

export function canSpawnEnemy(activeCount: number): boolean {
  return activeCount < BALANCE.run.enemyCap;
}

export function dueBosses(
  elapsedSeconds: number,
  spawnedBossIds: ReadonlySet<string>,
  bosses: readonly BossDefinition[],
): BossDefinition[] {
  return bosses.filter(
    (boss) => elapsedSeconds >= boss.spawnSecond && !spawnedBossIds.has(boss.id),
  );
}
