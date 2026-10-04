import Phaser from 'phaser';
import { BOSSES } from '../data/content';
import type { RandomSource } from '../core/rng';
import { EnemyEntity } from '../entities/EnemyEntity';
import { PlayerEntity } from '../entities/PlayerEntity';
import { ProjectileEntity } from '../entities/ProjectileEntity';
import { ObjectPool } from './ObjectPool';

export class BossSystem {
  private readonly definitions = new Map(BOSSES.map((boss) => [boss.id, boss]));
  private attackAngle = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly projectiles: ObjectPool<ProjectileEntity>,
    private readonly random: RandomSource,
    private readonly summonMinions: (boss: EnemyEntity) => void,
  ) {}

  update(deltaMs: number, boss: EnemyEntity, player: PlayerEntity): void {
    const definition = this.definitions.get(boss.bossId ?? '');
    if (!definition) return;
    const ratio = boss.health / boss.maxHealth;
    let phase = 0;
    for (const threshold of definition.phases) {
      if (ratio <= threshold) phase += 1;
    }
    boss.phase = phase;

    const distance =
      Phaser.Math.Distance.Between(boss.x, boss.y, player.x, player.y) || 1;
    const desiredDistance = definition.id === 'warden' ? 185 : 230;
    if (distance > desiredDistance) {
      const movement = boss.speed * (1 + phase * 0.18) * (deltaMs / 1_000);
      boss.x += ((player.x - boss.x) / distance) * movement;
      boss.y += ((player.y - boss.y) / distance) * movement;
      boss.setPosition(boss.x, boss.y);
    }
    boss.rotation += deltaMs * (0.0002 + phase * 0.00009);

    if (boss.bossChargeMs > 0) {
      boss.bossChargeMs = Math.max(0, boss.bossChargeMs - deltaMs);
      const flash = Math.floor(boss.bossChargeMs / 90) % 2 === 0;
      boss.setTint(flash ? 0xfff1a8 : 0xff6e67);
      if (boss.bossChargeMs === 0) {
        boss.setTint(0xff7a73);
        this.firePattern(definition.id, boss, player, phase);
        boss.attackCooldown = Math.max(850, 2_650 - phase * 280);
        if (definition.id === 'devourer' && phase > 0) this.summonMinions(boss);
      }
      return;
    }

    boss.attackCooldown = Math.max(0, boss.attackCooldown - deltaMs);
    if (boss.attackCooldown > 0) return;
    boss.bossChargeMs = definition.id === 'singularity' ? 730 : 590;
    const warning = this.scene.add
      .circle(boss.x, boss.y, 48 + phase * 8, 0xff6e67, 0.08)
      .setStrokeStyle(3, 0xffc76b, 0.85)
      .setDepth(13);
    this.scene.tweens.add({
      targets: warning,
      scale: 2.8,
      alpha: 0,
      duration: boss.bossChargeMs,
      onComplete: () => warning.destroy(),
    });
  }

  private firePattern(
    bossId: string,
    boss: EnemyEntity,
    player: PlayerEntity,
    phase: number,
  ): void {
    const aim = Phaser.Math.Angle.Between(boss.x, boss.y, player.x, player.y);
    if (bossId === 'warden') {
      const count = 3 + phase * 2;
      const spread = 0.19 + phase * 0.025;
      for (let index = 0; index < count; index += 1) {
        const offset = index - (count - 1) / 2;
        this.launch(boss, aim + offset * spread, 230 + phase * 28, 17 + phase * 4);
      }
    } else if (bossId === 'devourer') {
      const count = 9 + phase * 3;
      this.attackAngle += 0.37;
      for (let index = 0; index < count; index += 1) {
        this.launch(
          boss,
          this.attackAngle + (index / count) * Math.PI * 2,
          175 + phase * 25,
          13 + phase * 3,
        );
      }
    } else {
      const count = 12 + phase * 4;
      this.attackAngle += this.random.next() * 0.36 + 0.17;
      for (let index = 0; index < count; index += 1) {
        const angle = this.attackAngle + (index / count) * Math.PI * 2;
        this.launch(boss, angle, 190 + phase * 35, 16 + phase * 3);
      }
      this.launch(boss, aim, 300 + phase * 35, 23 + phase * 4);
    }
  }

  private launch(boss: EnemyEntity, angle: number, speed: number, damage: number): void {
    const projectile = this.projectiles.acquire();
    projectile?.launch({
      x: boss.x,
      y: boss.y,
      angle,
      speed,
      damage,
      weaponId: 'pulse',
      lifeMs: 4_500,
      hostile: true,
    });
  }
}
