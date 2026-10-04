import Phaser from 'phaser';

export interface RunResult {
  elapsedSeconds: number;
  score: number;
  kills: number;
  victory: boolean;
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOver');
  }

  create(result: RunResult): void {
    this.add.tileSprite(0, 0, 1_200, 720, 'starfield').setOrigin(0).setAlpha(0.5);
    const title = result.victory ? 'THE VOID YIELDS.' : 'THE VOID WINS.';
    this.add
      .text(600, 175, title, {
        fontFamily: 'Barlow Condensed, sans-serif',
        fontSize: '66px',
        color: result.victory ? '#8fffd4' : '#ff8a7d',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    const minutes = Math.floor(result.elapsedSeconds / 60);
    const seconds = Math.floor(result.elapsedSeconds % 60);
    this.add
      .text(
        600,
        270,
        `SURVIVED  ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}\nKILLS  ${String(result.kills).padStart(4, '0')}\nVOID ENERGY  ${String(result.score).padStart(6, '0')}`,
        {
          fontFamily: 'DM Mono, monospace',
          fontSize: '18px',
          color: '#d9e8e0',
          align: 'center',
          lineSpacing: 16,
        },
      )
      .setOrigin(0.5);
    const retry = this.add
      .text(600, 445, 'DEPLOY AGAIN    ↗', {
        fontFamily: 'DM Mono, monospace',
        fontSize: '15px',
        color: '#081116',
        backgroundColor: '#8fffd4',
        padding: { left: 22, right: 22, top: 14, bottom: 14 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    retry.on('pointerdown', () => {
      this.game.events.emit('audio:sfx', 'ui');
      this.scene.start('Game');
    });
    const menu = this.add
      .text(600, 515, 'RETURN TO FLIGHT DECK', {
        fontFamily: 'DM Mono, monospace',
        fontSize: '12px',
        color: '#9db0a9',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    menu.on('pointerdown', () => {
      this.game.events.emit('audio:sfx', 'ui');
      this.scene.start('Menu');
    });
    this.input.keyboard?.once('keydown-ENTER', () => this.scene.start('Game'));
    this.input.keyboard?.once('keydown-SPACE', () => this.scene.start('Game'));
  }
}
