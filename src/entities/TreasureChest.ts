import Phaser from 'phaser';

export class TreasureChest extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, 'chest');
    scene.add.existing(this);
    this.setActive(false).setVisible(false);
  }

  activate(x: number, y: number): void {
    this.setPosition(x, y).setActive(true).setVisible(true).setDepth(9);
  }

  deactivate(): void {
    this.setActive(false).setVisible(false);
  }
}
