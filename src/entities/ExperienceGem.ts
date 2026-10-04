import Phaser from 'phaser';

export class ExperienceGem extends Phaser.GameObjects.Sprite {
  value = 1;
  magnetized = false;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, 'gem');
    scene.add.existing(this);
    this.setActive(false).setVisible(false);
  }

  activate(x: number, y: number, value: number): void {
    this.setPosition(x, y)
      .setScale(0.8 + Math.min(value, 5) * 0.08)
      .setActive(true)
      .setVisible(true)
      .setDepth(8);
    this.value = value;
    this.magnetized = false;
  }

  deactivate(): void {
    this.setActive(false).setVisible(false).setScale(1);
    this.magnetized = false;
  }
}
