import Phaser from 'phaser';

export class ParticleEntity extends Phaser.GameObjects.Sprite {
  velocityX = 0;
  velocityY = 0;
  lifeMs = 0;
  maxLifeMs = 1;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, 'particle');
    scene.add.existing(this);
    this.setActive(false).setVisible(false);
  }

  launch(
    x: number,
    y: number,
    velocityX: number,
    velocityY: number,
    lifeMs: number,
    color: number,
  ): void {
    this.setPosition(x, y)
      .setTint(color)
      .setScale(0.8)
      .setAlpha(1)
      .setActive(true)
      .setVisible(true)
      .setDepth(17);
    this.velocityX = velocityX;
    this.velocityY = velocityY;
    this.lifeMs = lifeMs;
    this.maxLifeMs = lifeMs;
  }

  deactivate(): void {
    this.setActive(false).setVisible(false).setTint(0xffffff).setScale(1);
  }
}
