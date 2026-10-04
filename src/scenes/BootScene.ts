import Phaser from 'phaser';
import { createGameTextures } from '../utils/createTextures';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    createGameTextures(this);
    this.scene.start('Menu');
  }
}
