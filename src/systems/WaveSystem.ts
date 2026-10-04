import Phaser from 'phaser';
import { BALANCE } from '../data/balance';
import {
  BOSSES,
  ENEMIES,
  type BossDefinition,
  type EnemyDefinition,
} from '../data/content';
import {
  activeEnemyPool,
  canSpawnEnemy,
  dueBosses,
  spawnBatchSizeAt,
  spawnIntervalAt,
} from '../core/waveDirector';
import { SeededRandom } from '../core/rng';
import { EnemyEntity } from '../entities/EnemyEntity';
import { ObjectPool } from './ObjectPool';

export class WaveSystem {
  elapsedSeconds = 0;
  spawnElapsedMs = 0;
  colorblind = false;
  readonly spawnedBosses = new Set<string>();
  readonly random: SeededRandom;

  constructor(
    private readonly scene: Phaser.Scene,
    seed: number,
    private readonly enemyPool: ObjectPool<EnemyEntity>,
  ) {
    this.random = new SeededRandom(seed);
  }

  update(deltaMs: number): void {
    this.elapsedSeconds += deltaMs / 1_000;
    this.spawnElapsedMs += deltaMs;
    const elapsed = Math.min(this.elapsedSeconds, BALANCE.run.durationSeconds);
    if (
      this.spawnElapsedMs < spawnIntervalAt(elapsed) ||
      !canSpawnEnemy(this.enemyPool.active.length)
    )
      return;
    this.spawnElapsedMs = 0;
    const available = activeEnemyPool(elapsed, ENEMIES);
    const batchSize = spawnBatchSizeAt(elapsed);
    const difficulty = 1 + elapsed / BALANCE.run.durationSeconds;
    for (let count = 0; count < batchSize; count += 1) {
      if (!canSpawnEnemy(this.enemyPool.active.length)) break;
      const definition = this.pickEnemy(available);
      if (!definition) break;
      const position = this.spawnPosition();
      const elite = this.random.next() < Math.min(0.12, this.elapsedSeconds / 7_500);
      const enemy = this.enemyPool.acquire();
      enemy?.activate(definition, position.x, position.y, difficulty, elite);
      if (enemy && this.colorblind) enemy.setTint(0x70bfff);
    }
  }

  bossesDue(): BossDefinition[] {
    return dueBosses(this.elapsedSeconds, this.spawnedBosses, BOSSES);
  }

  markBossSpawned(id: string): void {
    this.spawnedBosses.add(id);
  }

  private pickEnemy(available: readonly EnemyDefinition[]): EnemyDefinition | undefined {
    let total = 0;
    for (const enemy of available) total += enemy.spawnWeight;
    let pick = this.random.next() * total;
    for (const enemy of available) {
      pick -= enemy.spawnWeight;
      if (pick < 0) return enemy;
    }
    return available.at(-1);
  }

  private spawnPosition(): { x: number; y: number } {
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    const margin = BALANCE.run.spawnMargin;
    const edge = this.random.integer(0, 3);
    if (edge === 0) return { x: this.random.next() * width, y: -margin };
    if (edge === 1) return { x: width + margin, y: this.random.next() * height };
    if (edge === 2) return { x: this.random.next() * width, y: height + margin };
    return { x: -margin, y: this.random.next() * height };
  }
}
