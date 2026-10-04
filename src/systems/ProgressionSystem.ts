import Phaser from 'phaser';
import { awardExperience } from '../core/progression';
import { ExperienceGem } from '../entities/ExperienceGem';
import { PlayerEntity } from '../entities/PlayerEntity';
import { ObjectPool } from './ObjectPool';

export type GemCollected = (value: number) => void;

export class ProgressionSystem {
  constructor(
    private readonly gems: ObjectPool<ExperienceGem>,
    private readonly collected: GemCollected,
  ) {}

  update(deltaMs: number, player: PlayerEntity): number {
    const deltaSeconds = deltaMs / 1_000;
    let levelUps = 0;
    for (let index = 0; index < this.gems.active.length; index += 1) {
      const gem = this.gems.active[index]!;
      const distanceSquared = Phaser.Math.Distance.Squared(
        gem.x,
        gem.y,
        player.x,
        player.y,
      );
      const magnetRadius = player.pickupRadius;
      if (distanceSquared < magnetRadius * magnetRadius) {
        gem.magnetized = true;
        const angle = Phaser.Math.Angle.Between(gem.x, gem.y, player.x, player.y);
        const distance = Math.sqrt(distanceSquared);
        const speed = 150 + Math.max(0, 140 - distance) * 1.8;
        gem.x += Math.cos(angle) * speed * deltaSeconds;
        gem.y += Math.sin(angle) * speed * deltaSeconds;
      }

      if (distanceSquared < 18 * 18) {
        const xp = gem.value * (1 + (player.passiveLevels.scavenger ?? 0) * 0.1);
        const next = awardExperience(
          { level: player.level, experience: player.experience },
          xp,
        );
        levelUps += next.level - player.level;
        player.level = next.level;
        player.experience = next.experience;
        this.collected(gem.value);
        this.gems.release(gem);
        index -= 1;
      }
    }
    return levelUps;
  }
}
