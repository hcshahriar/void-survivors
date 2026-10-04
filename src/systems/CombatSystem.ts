import Phaser from 'phaser';
import { BALANCE } from '../data/balance';
import { calculateDamage } from '../core/combat';
import type { RandomSource } from '../core/rng';
import { EnemyEntity } from '../entities/EnemyEntity';
import { PlayerEntity } from '../entities/PlayerEntity';
import { ProjectileEntity } from '../entities/ProjectileEntity';
import { ObjectPool } from './ObjectPool';

export type EnemyDefeated = (enemy: EnemyEntity) => void;
export type PlayerHit = (damage: number) => void;

export class CombatSystem {
  constructor(
    private readonly enemies: ObjectPool<EnemyEntity>,
    private readonly projectiles: ObjectPool<ProjectileEntity>,
    private readonly random: RandomSource,
    private readonly enemyDefeated: EnemyDefeated,
    private readonly playerHit: PlayerHit,
    private readonly damageFeedback: (
      enemy: EnemyEntity,
      damage: number,
      critical: boolean,
    ) => void,
  ) {}

  hitEnemy(enemy: EnemyEntity, baseDamage: number, player: PlayerEntity): void {
    if (!enemy.active) return;
    const result = calculateDamage({
      baseDamage,
      damageMultiplier: 1,
      flatReduction: enemy.shielded ? baseDamage * 0.38 : 0,
      criticalChance: player.criticalChance,
      roll: this.random.next(),
    });
    enemy.health = Math.max(0, enemy.health - result.damage);
    this.damageFeedback(enemy, result.damage, result.critical);
    enemy.setTintFill(result.critical ? 0xfff1a8 : 0xffffff);
    if (enemy.health <= 0) {
      this.enemyDefeated(enemy);
      this.enemies.release(enemy);
    }
  }

  update(deltaMs: number, player: PlayerEntity, width: number, height: number): void {
    const deltaSeconds = deltaMs / 1_000;
    for (let index = 0; index < this.projectiles.active.length; index += 1) {
      const projectile = this.projectiles.active[index]!;
      projectile.lifeMs -= deltaMs;
      if (projectile.homing && !projectile.hostile) this.steerHoming(projectile);
      projectile.x += projectile.velocityX * deltaSeconds;
      projectile.y += projectile.velocityY * deltaSeconds;
      if (
        projectile.lifeMs <= 0 ||
        projectile.x < -80 ||
        projectile.x > width + 80 ||
        projectile.y < -80 ||
        projectile.y > height + 80
      ) {
        this.projectiles.release(projectile);
        index -= 1;
        continue;
      }

      if (projectile.hostile) {
        const hitRadius = BALANCE.combat.playerRadius + 7;
        if (
          Phaser.Math.Distance.Squared(projectile.x, projectile.y, player.x, player.y) <
          hitRadius * hitRadius
        ) {
          this.playerHit(projectile.damage);
          this.projectiles.release(projectile);
          index -= 1;
        }
        continue;
      }

      for (let enemyIndex = 0; enemyIndex < this.enemies.active.length; enemyIndex += 1) {
        const enemy = this.enemies.active[enemyIndex]!;
        const radius = enemy.radius + 7;
        if (
          Phaser.Math.Distance.Squared(projectile.x, projectile.y, enemy.x, enemy.y) >=
          radius * radius
        )
          continue;
        if (projectile.splashRadius > 0) this.applySplash(projectile, player);
        else this.hitEnemy(enemy, projectile.damage, player);
        this.projectiles.release(projectile);
        index -= 1;
        break;
      }
    }
  }

  private applySplash(projectile: ProjectileEntity, player: PlayerEntity): void {
    const radiusSquared = projectile.splashRadius * projectile.splashRadius;
    let index = 0;
    while (index < this.enemies.active.length) {
      const enemy = this.enemies.active[index]!;
      if (
        Phaser.Math.Distance.Squared(projectile.x, projectile.y, enemy.x, enemy.y) <=
        radiusSquared
      ) {
        this.hitEnemy(enemy, projectile.damage, player);
        if (enemy.active) index += 1;
      } else {
        index += 1;
      }
    }
  }

  private steerHoming(projectile: ProjectileEntity): void {
    let nearest: EnemyEntity | null = null;
    let nearestDistance = 700 * 700;
    for (const enemy of this.enemies.active) {
      const distance = Phaser.Math.Distance.Squared(
        projectile.x,
        projectile.y,
        enemy.x,
        enemy.y,
      );
      if (distance < nearestDistance) {
        nearest = enemy;
        nearestDistance = distance;
      }
    }
    if (!nearest) return;
    const speed = Math.hypot(projectile.velocityX, projectile.velocityY);
    const angle = Phaser.Math.Angle.Between(
      projectile.x,
      projectile.y,
      nearest.x,
      nearest.y,
    );
    projectile.velocityX = Math.cos(angle) * speed;
    projectile.velocityY = Math.sin(angle) * speed;
    projectile.rotation = angle;
  }
}
