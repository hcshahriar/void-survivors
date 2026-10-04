import Phaser from 'phaser';
import type { WeaponId } from '../data/content';

export class ProjectileEntity extends Phaser.GameObjects.Sprite {
  velocityX = 0;
  velocityY = 0;
  lifeMs = 0;
  damage = 0;
  homing = false;
  splashRadius = 0;
  chainCount = 0;
  weaponId: WeaponId = 'pulse';
  hostile = false;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, 'projectile-pulse');
    scene.add.existing(this);
    this.setActive(false).setVisible(false);
  }

  launch(options: {
    x: number;
    y: number;
    angle: number;
    speed: number;
    damage: number;
    weaponId: WeaponId;
    lifeMs?: number;
    homing?: boolean;
    splashRadius?: number;
    chainCount?: number;
    hostile?: boolean;
  }): void {
    this.setTexture(options.hostile ? 'enemy-shot' : `projectile-${options.weaponId}`)
      .setPosition(options.x, options.y)
      .setRotation(options.angle)
      .setActive(true)
      .setVisible(true)
      .setDepth(15);
    this.velocityX = Math.cos(options.angle) * options.speed;
    this.velocityY = Math.sin(options.angle) * options.speed;
    this.damage = options.damage;
    this.weaponId = options.weaponId;
    this.lifeMs = options.lifeMs ?? 1_500;
    this.homing = options.homing ?? false;
    this.splashRadius = options.splashRadius ?? 0;
    this.chainCount = options.chainCount ?? 0;
    this.hostile = options.hostile ?? false;
  }

  deactivate(): void {
    this.setActive(false).setVisible(false);
    this.homing = false;
    this.splashRadius = 0;
    this.chainCount = 0;
    this.hostile = false;
  }
}
