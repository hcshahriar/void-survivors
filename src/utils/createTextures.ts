import Phaser from 'phaser';
import { ENEMIES, WEAPONS } from '../data/content';

function drawTexture(
  scene: Phaser.Scene,
  key: string,
  size: number,
  draw: (graphics: Phaser.GameObjects.Graphics) => void,
): void {
  if (scene.textures.exists(key)) return;
  const graphics = scene.add.graphics({ x: 0, y: 0 });
  draw(graphics);
  graphics.generateTexture(key, size, size);
  graphics.destroy();
}

export function createGameTextures(scene: Phaser.Scene): void {
  drawTexture(scene, 'ship-scout', 48, (graphics) => {
    graphics.fillStyle(0x8fffd4, 1).fillTriangle(24, 2, 4, 43, 24, 35);
    graphics.fillTriangle(24, 2, 24, 35, 44, 43);
    graphics.fillStyle(0xe4fff3, 1).fillTriangle(24, 10, 19, 29, 29, 29);
  });
  drawTexture(scene, 'ship-bulwark', 48, (graphics) => {
    graphics.fillStyle(0x45d6dc, 1).fillPoints(
      [
        { x: 24, y: 2 },
        { x: 44, y: 18 },
        { x: 39, y: 41 },
        { x: 9, y: 41 },
        { x: 4, y: 18 },
      ],
      true,
    );
    graphics.fillStyle(0xe4fff3, 1).fillCircle(24, 23, 6);
  });
  drawTexture(scene, 'ship-phantom', 48, (graphics) => {
    graphics.fillStyle(0xc0a2ff, 1).fillTriangle(24, 2, 5, 42, 24, 32);
    graphics.fillTriangle(24, 2, 24, 32, 43, 42);
    graphics.fillStyle(0xf5e9ff, 1).fillCircle(24, 24, 5);
  });

  const enemyColors = [
    0xff6e67, 0xff925f, 0xf4c35c, 0xb37cff, 0xff7caa, 0xffbd66, 0x79e7b0, 0x76c5ff,
  ];
  ENEMIES.forEach((enemy, index) => {
    const color = enemyColors[index] ?? 0xff6e67;
    const size = enemy.radius * 3;
    drawTexture(scene, `enemy-${enemy.id}`, size, (graphics) => {
      graphics.fillStyle(color, 1);
      if (enemy.id === 'tank') graphics.fillRoundedRect(4, 4, size - 8, size - 8, 7);
      else if (enemy.id === 'dasher')
        graphics.fillTriangle(size / 2, 2, size - 3, size - 3, 3, size - 3);
      else if (enemy.id === 'shielded')
        graphics.fillPoints(
          [
            { x: size / 2, y: 2 },
            { x: size - 2, y: size / 3 },
            { x: size - 6, y: size - 3 },
            { x: 6, y: size - 3 },
            { x: 2, y: size / 3 },
          ],
          true,
        );
      else graphics.fillCircle(size / 2, size / 2, size / 2 - 2);
      graphics
        .fillStyle(0x202932, 0.9)
        .fillCircle(size * 0.38, size * 0.43, Math.max(2, size * 0.07));
      graphics.fillCircle(size * 0.62, size * 0.43, Math.max(2, size * 0.07));
    });
  });

  WEAPONS.forEach((weapon, index) => {
    const colors = [0x8fffd4, 0x45d6dc, 0xc0a2ff, 0xffbd66, 0xff6e67, 0xf5fff4];
    drawTexture(scene, `projectile-${weapon.id}`, 18, (graphics) => {
      graphics.fillStyle(colors[index] ?? 0x8fffd4, 1).fillCircle(9, 9, 6);
      graphics.fillStyle(0xffffff, 0.75).fillCircle(9, 9, 2);
    });
  });
  drawTexture(scene, 'gem', 24, (graphics) => {
    graphics.fillStyle(0xffc76b, 1).fillPoints(
      [
        { x: 12, y: 1 },
        { x: 22, y: 12 },
        { x: 12, y: 23 },
        { x: 2, y: 12 },
      ],
      true,
    );
    graphics.fillStyle(0xfff0c4, 0.85).fillCircle(12, 12, 3);
  });
  drawTexture(scene, 'chest', 36, (graphics) => {
    graphics.fillStyle(0xffc76b, 1).fillRoundedRect(3, 10, 30, 22, 4);
    graphics.fillStyle(0xffe7a7, 1).fillRoundedRect(3, 5, 30, 10, 4);
    graphics.fillStyle(0x15242a, 1).fillRect(16, 13, 5, 10);
  });
  drawTexture(scene, 'particle', 12, (graphics) => {
    graphics.fillStyle(0xffffff, 1).fillCircle(6, 6, 5);
  });
  drawTexture(scene, 'boss', 96, (graphics) => {
    graphics.fillStyle(0xff6e67, 1).fillPoints(
      [
        { x: 48, y: 2 },
        { x: 87, y: 22 },
        { x: 94, y: 58 },
        { x: 68, y: 90 },
        { x: 28, y: 90 },
        { x: 2, y: 58 },
        { x: 9, y: 22 },
      ],
      true,
    );
    graphics.lineStyle(3, 0xffc76b, 0.9).strokeCircle(48, 48, 25);
    graphics.fillStyle(0x081116, 1).fillCircle(48, 48, 12);
  });
  drawTexture(scene, 'enemy-shot', 16, (graphics) => {
    graphics.fillStyle(0xff6e67, 1).fillCircle(8, 8, 6);
    graphics.lineStyle(2, 0xffdfce, 0.85).strokeCircle(8, 8, 5);
  });
  drawTexture(scene, 'joystick-ring', 96, (graphics) => {
    graphics.lineStyle(3, 0x8fffd4, 0.48).strokeCircle(48, 48, 42);
    graphics.fillStyle(0x8fffd4, 0.07).fillCircle(48, 48, 40);
  });
  drawTexture(scene, 'joystick-knob', 44, (graphics) => {
    graphics.fillStyle(0x8fffd4, 0.65).fillCircle(22, 22, 17);
    graphics.lineStyle(2, 0xd9fff0, 0.9).strokeCircle(22, 22, 17);
  });
  drawTexture(scene, 'starfield', 256, (graphics) => {
    graphics.fillStyle(0x8fffd4, 0.6);
    for (let index = 0; index < 32; index += 1) {
      const x = (index * 73 + 19) % 256;
      const y = (index * 127 + 41) % 256;
      graphics.fillCircle(x, y, index % 7 === 0 ? 2 : 1);
    }
  });
}
