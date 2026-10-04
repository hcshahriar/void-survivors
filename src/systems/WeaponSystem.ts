import Phaser from 'phaser';
import { BALANCE } from '../data/balance';
import type { AimMode } from '../core/save';
import { WEAPONS, type WeaponDefinition, type WeaponId } from '../data/content';
import { PlayerEntity } from '../entities/PlayerEntity';
import { EnemyEntity } from '../entities/EnemyEntity';
import { ProjectileEntity } from '../entities/ProjectileEntity';
import { ObjectPool } from './ObjectPool';

export type DamageEnemy = (enemy: EnemyEntity, damage: number, source: WeaponId) => void;

export interface WeaponControl {
  aimMode: AimMode;
  aimAngle: number;
  fireHeld: boolean;
}

export class WeaponSystem {
  private readonly cooldowns = [0, 0, 0, 0, 0, 0];
  private chainStamp = 0;
  private droneAngle = 0;
  private droneCooldownMs = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly enemies: ObjectPool<EnemyEntity>,
    private readonly projectiles: ObjectPool<ProjectileEntity>,
    private readonly damageEnemy: DamageEnemy,
    private readonly droneSprites: readonly Phaser.GameObjects.Arc[],
    private readonly weaponFired: (weapon: WeaponId) => void,
  ) {}

  reset(): void {
    this.cooldowns.fill(0);
    this.droneAngle = 0;
    this.chainStamp = 0;
    this.droneCooldownMs = 0;
  }

  update(deltaMs: number, player: PlayerEntity, control: WeaponControl): void {
    this.droneAngle += deltaMs * 0.0018;
    this.droneCooldownMs = Math.max(0, this.droneCooldownMs - deltaMs);
    const manual = control.aimMode === 'manual';
    const canFire = !manual || control.fireHeld;
    this.updateDrones(player, canFire);
    for (let index = 0; index < WEAPONS.length; index += 1) {
      const definition = WEAPONS[index]!;
      if (definition.id === 'drones') continue;
      const level = player.weaponLevels[definition.id] ?? 0;
      if (level < 1) continue;
      this.cooldowns[index] = Math.max(0, this.cooldowns[index]! - deltaMs);
      if (this.cooldowns[index]! > 0 || !canFire) continue;
      if (this.fire(definition, level, player, manual ? control.aimAngle : null)) {
        this.weaponFired(definition.id);
        const coolant = player.passiveLevels.coolant ?? 0;
        const evolved = player.evolvedWeapons.includes(definition.id);
        this.cooldowns[index] =
          definition.cooldownMs *
          (1 - Math.min(0.3, coolant * 0.045)) *
          (evolved ? 0.72 : 1);
      }
    }
  }

  private fire(
    definition: WeaponDefinition,
    level: number,
    player: PlayerEntity,
    manualAimAngle: number | null,
  ): boolean {
    const evolved = player.evolvedWeapons.includes(definition.id);
    const damage =
      definition.baseDamage *
      (1 + (level - 1) * 0.18) *
      player.damageMultiplier *
      (evolved ? 1.9 : 1);
    if (definition.id === 'pulse' || definition.id === 'missiles') {
      const target =
        manualAimAngle === null
          ? this.nearest(player.x, player.y, definition.range + (evolved ? 100 : 0))
          : null;
      if (manualAimAngle === null && !target) return false;
      const angle =
        manualAimAngle ??
        Phaser.Math.Angle.Between(player.x, player.y, target!.x, target!.y);
      const projectile = this.projectiles.acquire();
      projectile?.launch({
        x: player.x,
        y: player.y,
        angle,
        speed: definition.id === 'missiles' ? 265 : BALANCE.combat.projectileSpeed,
        damage,
        weaponId: definition.id,
        lifeMs: definition.id === 'missiles' ? 2_800 : 1_250,
        homing: definition.id === 'missiles',
        splashRadius:
          definition.id === 'missiles' ? 52 + level * 5 + (evolved ? 40 : 0) : 0,
      });
      return projectile !== null;
    }

    if (definition.id === 'lightning') {
      let target =
        manualAimAngle === null
          ? this.nearest(player.x, player.y, definition.range)
          : this.nearestAlongAim(player, definition.range, manualAimAngle);
      if (!target) return false;
      this.chainStamp += 1;
      for (
        let jump = 0;
        target && jump < Math.min(2 + level + (evolved ? 4 : 0), 10);
        jump += 1
      ) {
        const next = this.nearest(target.x, target.y, 150 + level * 16, this.chainStamp);
        this.damageEnemy(target, damage * (1 - jump * 0.12), 'lightning');
        target.chainStamp = this.chainStamp;
        if (next) {
          const line = this.scene.add
            .line(0, 0, target.x, target.y, next.x, next.y, 0x9fefff, 0.9)
            .setOrigin(0)
            .setDepth(16)
            .setBlendMode(Phaser.BlendModes.ADD);
          this.scene.tweens.add({
            targets: line,
            alpha: 0,
            duration: 130,
            onComplete: () => line.destroy(),
          });
        }
        target = next;
      }
      return true;
    }

    if (definition.id === 'shockwave') {
      let hit = false;
      const range = definition.range + level * 14 + (evolved ? 70 : 0);
      let enemyIndex = 0;
      while (enemyIndex < this.enemies.active.length) {
        const enemy = this.enemies.active[enemyIndex]!;
        const radius = range + enemy.radius;
        if (
          Phaser.Math.Distance.Squared(player.x, player.y, enemy.x, enemy.y) <=
          radius * radius
        ) {
          this.damageEnemy(enemy, damage, 'shockwave');
          hit = true;
          if (enemy.active) enemyIndex += 1;
        } else enemyIndex += 1;
      }
      if (hit) {
        const wave = this.scene.add
          .circle(player.x, player.y, 12, 0x45d6dc, 0.1)
          .setStrokeStyle(3, 0x8fffd4, 0.8)
          .setDepth(14);
        this.scene.tweens.add({
          targets: wave,
          radius: range,
          alpha: 0,
          duration: 260,
          onComplete: () => wave.destroy(),
        });
      }
      return hit;
    }

    const effectiveRange = definition.range + (evolved ? 110 : 0);
    const target =
      manualAimAngle === null
        ? this.nearest(player.x, player.y, effectiveRange)
        : this.nearestAlongAim(player, effectiveRange, manualAimAngle);
    if (manualAimAngle === null && !target) return false;
    const angle =
      manualAimAngle ??
      Phaser.Math.Angle.Between(player.x, player.y, target!.x, target!.y);
    if (definition.id === 'laser') {
      const directionX = Math.cos(angle);
      const directionY = Math.sin(angle);
      let enemyIndex = 0;
      while (enemyIndex < this.enemies.active.length) {
        const enemy = this.enemies.active[enemyIndex]!;
        const relativeX = enemy.x - player.x;
        const relativeY = enemy.y - player.y;
        const along = relativeX * directionX + relativeY * directionY;
        const across = Math.abs(relativeX * directionY - relativeY * directionX);
        if (along >= 0 && along <= effectiveRange && across <= enemy.radius + 7) {
          this.damageEnemy(enemy, damage, 'laser');
          if (enemy.active) enemyIndex += 1;
        } else enemyIndex += 1;
      }
      const beam = this.scene.add
        .line(
          0,
          0,
          player.x,
          player.y,
          player.x + directionX * effectiveRange,
          player.y + directionY * effectiveRange,
          0xcafff1,
          0.95,
        )
        .setOrigin(0)
        .setLineWidth(4, 1)
        .setDepth(16)
        .setBlendMode(Phaser.BlendModes.ADD);
      this.scene.tweens.add({
        targets: beam,
        alpha: 0,
        duration: 140,
        onComplete: () => beam.destroy(),
      });
      return true;
    }
    return false;
  }

  private updateDrones(player: PlayerEntity, canFire: boolean): void {
    const level = player.weaponLevels.drones ?? 0;
    const evolved = player.evolvedWeapons.includes('drones');
    const count = Math.min(
      this.droneSprites.length,
      2 + Math.floor(level / 2) + (evolved ? 2 : 0),
    );
    for (let index = 0; index < this.droneSprites.length; index += 1) {
      const drone = this.droneSprites[index]!;
      drone.setVisible(level > 0 && index < count);
      if (level < 1 || index >= count) continue;
      const angle = this.droneAngle + (index * Math.PI * 2) / count;
      const orbit = 58 + (evolved ? 18 : 0);
      drone.setPosition(
        player.x + Math.cos(angle) * orbit,
        player.y + Math.sin(angle) * orbit,
      );
      if (canFire && this.droneCooldownMs <= 0) {
        const target = this.nearest(drone.x, drone.y, 18);
        if (target) {
          this.damageEnemy(target, (1.2 + level * 0.35) * (evolved ? 2 : 1), 'drones');
          this.weaponFired('drones');
          this.droneCooldownMs = 350;
        }
      }
    }
  }

  private nearest(
    x: number,
    y: number,
    range: number,
    excludedStamp = -1,
  ): EnemyEntity | null {
    let result: EnemyEntity | null = null;
    let bestDistance = range * range;
    for (const enemy of this.enemies.active) {
      if (!enemy.active || enemy.chainStamp === excludedStamp) continue;
      const distance = Phaser.Math.Distance.Squared(x, y, enemy.x, enemy.y);
      if (distance <= bestDistance) {
        bestDistance = distance;
        result = enemy;
      }
    }
    return result;
  }

  private nearestAlongAim(
    player: PlayerEntity,
    range: number,
    angle: number,
  ): EnemyEntity | null {
    let result: EnemyEntity | null = null;
    let nearestDistance = range * range;
    const directionX = Math.cos(angle);
    const directionY = Math.sin(angle);
    for (const enemy of this.enemies.active) {
      const deltaX = enemy.x - player.x;
      const deltaY = enemy.y - player.y;
      const along = deltaX * directionX + deltaY * directionY;
      const across = Math.abs(deltaX * directionY - deltaY * directionX);
      if (along < 0 || along > range || across > enemy.radius + 36) continue;
      const distance = deltaX * deltaX + deltaY * deltaY;
      if (distance < nearestDistance) {
        nearestDistance = distance;
        result = enemy;
      }
    }
    return result;
  }
}
