import Phaser from 'phaser';

export class PlayerEntity extends Phaser.GameObjects.Sprite {
  health = 100;
  maxHealth = 100;
  speed = 230;
  invulnerabilityMs = 0;
  weaponLevels: Record<string, number> = { pulse: 1 };
  passiveLevels: Record<string, number> = {};
  evolvedWeapons: string[] = [];
  experience = 0;
  level = 1;
  kills = 0;
  damageMultiplier = 1;
  criticalChance = 0.05;
  pickupRadius = 110;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, 'ship-scout');
    scene.add.existing(this);
    this.setDepth(20).setBlendMode(Phaser.BlendModes.ADD);
  }

  resetRun(texture: string, health: number, speed: number): void {
    this.setTexture(texture)
      .setPosition(0, 0)
      .setRotation(0)
      .setAlpha(1)
      .setVisible(true)
      .setActive(true);
    this.health = health;
    this.maxHealth = health;
    this.speed = speed;
    this.invulnerabilityMs = 0;
    this.weaponLevels = { pulse: 1 };
    this.passiveLevels = {};
    this.evolvedWeapons = [];
    this.experience = 0;
    this.level = 1;
    this.kills = 0;
    this.damageMultiplier = 1;
    this.criticalChance = 0.05;
    this.pickupRadius = 110;
  }
}
