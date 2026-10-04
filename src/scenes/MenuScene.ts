import Phaser from 'phaser';
import { loadSave } from '../core/save';
import { SHIPS } from '../data/content';
import { browserStorage } from '../utils/browserStorage';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('Menu');
  }

  create(): void {
    this.add.tileSprite(0, 0, 1_200, 720, 'starfield').setOrigin(0).setAlpha(0.55);
    this.add.circle(600, 350, 185, 0x45d6dc, 0.025).setStrokeStyle(1, 0x45d6dc, 0.16);
    const save = loadSave(browserStorage);
    const ship = SHIPS.find((item) => item.id === save.selectedShip) ?? SHIPS[0]!;
    const shipTexture =
      ship.id === 'bulwark'
        ? 'ship-bulwark'
        : ship.id === 'phantom'
          ? 'ship-phantom'
          : 'ship-scout';
    this.add.image(600, 334, shipTexture).setScale(2.8).setAlpha(0.88);
    this.add
      .text(600, 108, 'VOID SURVIVORS', {
        fontFamily: 'Barlow Condensed, sans-serif',
        fontSize: '76px',
        color: '#e9f4ee',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.add
      .text(600, 164, 'THE VOID IS HUNGRY. KEEP MOVING.', {
        fontFamily: 'DM Mono, monospace',
        fontSize: '13px',
        color: '#8fffd4',
      })
      .setOrigin(0.5);

    this.add
      .text(600, 495, `PERSONAL BEST  ${String(save.stats.bestScore).padStart(6, '0')}`, {
        fontFamily: 'DM Mono, monospace',
        fontSize: '12px',
        color: '#ffc76b',
      })
      .setOrigin(0.5);

    this.add
      .text(600, 526, `VOID SHARDS  ${String(save.shards).padStart(4, '0')}`, {
        fontFamily: 'DM Mono, monospace',
        fontSize: '10px',
        color: '#8fffd4',
      })
      .setOrigin(0.5);

    const launch = this.add
      .text(600, 580, 'DEPLOY SHIP     ↗', {
        fontFamily: 'DM Mono, monospace',
        fontSize: '16px',
        color: '#081116',
        backgroundColor: '#8fffd4',
        padding: { left: 26, right: 26, top: 16, bottom: 16 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    launch.on('pointerover', () => launch.setStyle({ backgroundColor: '#b9ffe6' }));
    launch.on('pointerout', () => launch.setStyle({ backgroundColor: '#8fffd4' }));
    launch.on('pointerdown', () => {
      this.game.events.emit('audio:sfx', 'ui');
      this.startRun();
    });
    this.input.keyboard?.once('keydown-ENTER', () => this.startRun());
    this.input.keyboard?.once('keydown-SPACE', () => this.startRun());

    const navigation = [
      { label: 'ARMORY', scene: 'Shop' },
      { label: 'SHIP SELECT', scene: 'ShipSelect' },
      { label: 'FLIGHT LOG', scene: 'Stats' },
      { label: 'SETTINGS', scene: 'Settings' },
    ];
    for (let index = 0; index < navigation.length; index += 1) {
      const item = navigation[index]!;
      const button = this.add
        .text(240 + index * 240, 650, item.label, {
          fontFamily: 'DM Mono, monospace',
          fontSize: '11px',
          color: '#b9cbc3',
          backgroundColor: '#10232b',
          padding: { left: 13, right: 13, top: 10, bottom: 10 },
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      button.on('pointerdown', () => {
        this.game.events.emit('audio:sfx', 'ui');
        this.scene.start(item.scene);
      });
    }

    this.add
      .text(600, 697, 'WASD / ARROWS / GAMEPAD / TOUCH JOYSTICK     •     AUTO-FIRE', {
        fontFamily: 'DM Mono, monospace',
        fontSize: '10px',
        color: '#8aa39b',
      })
      .setOrigin(0.5);
  }

  private startRun(): void {
    this.scene.start('Game');
  }
}
