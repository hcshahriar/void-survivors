import Phaser from 'phaser';
import { EnemyEntity } from '../entities/EnemyEntity';
import { PlayerEntity } from '../entities/PlayerEntity';
import { ProjectileEntity } from '../entities/ProjectileEntity';
import { ObjectPool } from './ObjectPool';

export type PlayerDamage = (damage: number, sourceX: number, sourceY: number) => void;
export type EnemyFired = (enemy: EnemyEntity) => void;
export type EnemyDestroyed = (enemy: EnemyEntity) => void;

export class EnemySystem {
  constructor(
    private readonly enemies: ObjectPool<EnemyEntity>,
    private readonly projectiles: ObjectPool<ProjectileEntity>,
    private readonly damagePlayer: PlayerDamage,
    private readonly fired: EnemyFired,
    private readonly destroyEnemy: EnemyDestroyed,
  ) {}

  update(deltaMs: number, player: PlayerEntity, width: number, height: number): void {
    const deltaSeconds = deltaMs / 1_000;
    for (let index = 0; index < this.enemies.active.length; index += 1) {
      const enemy = this.enemies.active[index]!;
      if (enemy.isBoss) continue;
      enemy.attackCooldown = Math.max(0, enemy.attackCooldown - deltaMs);
      const deltaX = player.x - enemy.x;
      const deltaY = player.y - enemy.y;
      const distance = Math.hypot(deltaX, deltaY) || 1;
      let velocityScale = 1;

      if (enemy.definition.id === 'dasher') {
        if (enemy.phase === 2) {
          velocityScale = 3.2;
          enemy.telegraphMs -= deltaMs;
          if (enemy.telegraphMs <= 0) {
            enemy.phase = 0;
            enemy.attackCooldown = 1_100;
          }
        } else if (enemy.phase === 1) {
          enemy.telegraphMs -= deltaMs;
          if (enemy.telegraphMs <= 0) {
            enemy.phase = 2;
            enemy.telegraphMs = 260;
            velocityScale = 3.2;
          }
        } else if (distance < 360 && enemy.attackCooldown <= 0) {
          enemy.phase = 1;
          enemy.telegraphMs = 460;
        }
        enemy.setTint(enemy.phase === 1 ? 0xffe584 : enemy.elite ? 0xffd580 : 0xffffff);
      }

      if (enemy.definition.id === 'shooter') {
        const desired = 235;
        if (distance > desired + 18) velocityScale = 0.68;
        else if (distance < desired - 18) velocityScale = -0.45;
        else velocityScale = 0;
        if (enemy.attackCooldown <= 0 && distance < 500) {
          const projectile = this.projectiles.acquire();
          if (projectile) {
            projectile.launch({
              x: enemy.x,
              y: enemy.y,
              angle: Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y),
              speed: 230,
              damage: enemy.damage * 0.55,
              weaponId: 'pulse',
              lifeMs: 2_600,
              hostile: true,
            });
            this.fired(enemy);
            enemy.attackCooldown = 2_100;
          }
        }
      } else if (enemy.definition.id === 'healer') {
        velocityScale = distance > 290 ? 0.6 : -0.25;
        if (enemy.attackCooldown <= 0) {
          for (
            let allyIndex = 0;
            allyIndex < this.enemies.active.length;
            allyIndex += 1
          ) {
            const ally = this.enemies.active[allyIndex]!;
            if (ally === enemy || ally.isBoss) continue;
            if (
              Phaser.Math.Distance.Squared(enemy.x, enemy.y, ally.x, ally.y) <
              170 * 170
            ) {
              ally.health = Math.min(ally.maxHealth, ally.health + ally.maxHealth * 0.08);
              ally.setTint(0x79e7b0);
            }
          }
          enemy.attackCooldown = 1_700;
        }
      } else if (enemy.definition.id === 'exploder') {
        if (enemy.telegraphMs <= 0 && distance < 155) {
          enemy.telegraphMs = 620;
          enemy.setTint(0xffd580);
        }
        if (enemy.telegraphMs > 0) {
          enemy.telegraphMs -= deltaMs;
          velocityScale = 0;
          if (enemy.telegraphMs <= 0) {
            if (distance < 112) this.damagePlayer(enemy.damage * 1.5, enemy.x, enemy.y);
            this.destroyEnemy(enemy);
            continue;
          }
        }
      }

      if (enemy.definition.id === 'tank') velocityScale *= 0.78;
      if (velocityScale !== 0) {
        enemy.x += (deltaX / distance) * enemy.speed * velocityScale * deltaSeconds;
        enemy.y += (deltaY / distance) * enemy.speed * velocityScale * deltaSeconds;
      }
      enemy.x = Phaser.Math.Clamp(enemy.x, -40, width + 40);
      enemy.y = Phaser.Math.Clamp(enemy.y, -40, height + 40);
      enemy.setPosition(enemy.x, enemy.y);
      if (distance < enemy.radius + 14) this.damagePlayer(enemy.damage, enemy.x, enemy.y);
    }
  }
}
