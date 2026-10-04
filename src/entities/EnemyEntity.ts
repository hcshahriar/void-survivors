import Phaser from 'phaser';
import type { EnemyDefinition } from '../data/content';

export class EnemyEntity extends Phaser.GameObjects.Sprite {
  definition!: EnemyDefinition;
  health = 1;
  maxHealth = 1;
  speed = 1;
  damage = 1;
  radius = 8;
  attackCooldown = 0;
  telegraphMs = 0;
  phase = 0;
  shielded = false;
  elite = false;
  reward = 1;
  isBoss = false;
  chainStamp = 0;
  bossId: string | null = null;
  bossChargeMs = 0;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, 'enemy-swarmer');
    scene.add.existing(this);
    this.setActive(false).setVisible(false);
  }

  activate(
    definition: EnemyDefinition,
    x: number,
    y: number,
    difficulty: number,
    elite = false,
  ): void {
    this.definition = definition;
    this.health = definition.health * difficulty * (elite ? 2.2 : 1);
    this.maxHealth = this.health;
    this.speed = definition.speed * (elite ? 1.25 : 1);
    this.damage = definition.damage * difficulty * (elite ? 1.5 : 1);
    this.radius = definition.radius * (elite ? 1.2 : 1);
    this.attackCooldown = 0;
    this.telegraphMs = 0;
    this.phase = 0;
    this.shielded = definition.id === 'shielded';
    this.elite = elite;
    this.reward = definition.experience * (elite ? 4 : 1);
    this.isBoss = false;
    this.bossId = null;
    this.bossChargeMs = 0;
    this.setTexture(`enemy-${definition.id}`)
      .setPosition(x, y)
      .setScale(elite ? 1.2 : 1);
    this.setActive(true)
      .setVisible(true)
      .setDepth(elite ? 12 : 10);
    this.setTint(elite ? 0xffd580 : 0xffffff);
  }

  deactivate(): void {
    this.setActive(false).setVisible(false);
    this.setTint(0xffffff).setScale(1);
  }
}
