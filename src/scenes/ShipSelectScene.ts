import Phaser from 'phaser';
import { loadSave, writeSave } from '../core/save';
import { purchaseShip } from '../core/meta';
import { SHIPS } from '../data/content';
import { browserStorage } from '../utils/browserStorage';
import { addSceneButton, addSceneChrome } from '../ui/sceneChrome';

const SHIP_TEXTURES: Record<string, string> = {
  scout: 'ship-scout',
  bulwark: 'ship-bulwark',
  phantom: 'ship-phantom',
};

export class ShipSelectScene extends Phaser.Scene {
  private message!: Phaser.GameObjects.Text;

  constructor() {
    super('ShipSelect');
  }

  create(): void {
    addSceneChrome(
      this,
      'Choose Your Vessel',
      'Three hulls // different ways to hold the line',
    );
    this.message = this.add
      .text(600, 188, '', {
        fontFamily: 'DM Mono, monospace',
        fontSize: '11px',
        color: '#ffc76b',
      })
      .setOrigin(0.5);
    const save = loadSave(browserStorage);
    this.add
      .text(1_145, 122, `VOID SHARDS  ${String(save.shards).padStart(4, '0')}`, {
        fontFamily: 'DM Mono, monospace',
        fontSize: '12px',
        color: '#ffc76b',
      })
      .setOrigin(1, 0);

    for (let index = 0; index < SHIPS.length; index += 1) {
      const ship = SHIPS[index]!;
      const centerX = 250 + index * 350;
      const unlocked = save.unlockedShips.includes(ship.id);
      const selected = save.selectedShip === ship.id;
      this.add
        .rectangle(centerX, 390, 290, 340, 0x10232b, 0.88)
        .setStrokeStyle(1, selected ? 0x8fffd4 : 0x42605c, selected ? 0.65 : 0.32);
      this.add.image(centerX, 275, SHIP_TEXTURES[ship.id] ?? 'ship-scout').setScale(1.8);
      this.add
        .text(centerX, 332, ship.name.toUpperCase(), {
          fontFamily: 'Barlow Condensed, sans-serif',
          fontSize: '29px',
          color: '#e9f4ee',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      this.add
        .text(
          centerX,
          382,
          `HULL ${ship.health}   /   SPEED ${ship.speed}\nSTARTS WITH ${ship.startingWeapon.toUpperCase()}`,
          {
            fontFamily: 'DM Mono, monospace',
            fontSize: '9px',
            color: '#91a69e',
            align: 'center',
            lineSpacing: 11,
          },
        )
        .setOrigin(0.5);
      const label = unlocked
        ? selected
          ? 'SELECTED'
          : 'SELECT SHIP'
        : `UNLOCK  ${ship.unlockCost}`;
      addSceneButton(this, centerX, 480, label, () => this.choose(ship.id));
    }
    addSceneButton(this, 600, 660, 'BACK TO FLIGHT DECK', () => this.scene.start('Menu'));
  }

  private choose(shipId: string): void {
    const save = loadSave(browserStorage);
    if (!save.unlockedShips.includes(shipId)) {
      const purchase = purchaseShip(save.shards, save.unlockedShips, shipId);
      if (!purchase.purchased) {
        this.message.setText('NOT ENOUGH SHARDS TO UNLOCK THAT HULL');
        return;
      }
      save.shards = purchase.shards;
      save.unlockedShips = purchase.unlockedShips;
    }
    save.selectedShip = shipId;
    writeSave(browserStorage, save);
    this.game.events.emit('audio:sfx', 'select');
    this.scene.restart();
  }
}
