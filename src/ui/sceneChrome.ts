import Phaser from 'phaser';

export function addSceneChrome(
  scene: Phaser.Scene,
  title: string,
  subtitle: string,
): void {
  scene.add.tileSprite(0, 0, 1_200, 720, 'starfield').setOrigin(0).setAlpha(0.45);
  scene.add.text(52, 42, 'VOID SURVIVORS  /  FLIGHT DECK', {
    fontFamily: 'DM Mono, monospace',
    fontSize: '10px',
    color: '#8fffd4',
  });
  scene.add.text(52, 84, title.toUpperCase(), {
    fontFamily: 'Barlow Condensed, sans-serif',
    fontSize: '54px',
    color: '#e9f4ee',
    fontStyle: 'bold',
  });
  scene.add.text(55, 142, subtitle.toUpperCase(), {
    fontFamily: 'DM Mono, monospace',
    fontSize: '10px',
    color: '#829990',
  });
  const back = scene.add
    .text(1_145, 48, '← MENU', {
      fontFamily: 'DM Mono, monospace',
      fontSize: '11px',
      color: '#dce8e2',
      backgroundColor: '#10232b',
      padding: { left: 12, right: 12, top: 9, bottom: 9 },
    })
    .setOrigin(1, 0)
    .setInteractive({ useHandCursor: true });
  back.on('pointerdown', () => scene.scene.start('Menu'));
}

export function addSceneButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  action: () => void,
): Phaser.GameObjects.Text {
  const button = scene.add
    .text(x, y, label, {
      fontFamily: 'DM Mono, monospace',
      fontSize: '12px',
      color: '#081116',
      backgroundColor: '#8fffd4',
      padding: { left: 15, right: 15, top: 11, bottom: 11 },
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true });
  button.on('pointerover', () => button.setStyle({ backgroundColor: '#c4ffe9' }));
  button.on('pointerout', () => button.setStyle({ backgroundColor: '#8fffd4' }));
  button.on('pointerdown', () => {
    scene.game.events.emit('audio:sfx', 'ui');
    action();
  });
  return button;
}
