import Phaser from 'phaser';
import { loadSave, writeSave } from '../core/save';
import { metaUpgradeCost, purchaseMetaUpgrade, type ShopUpgradeId } from '../core/meta';
import { SHOP_UPGRADES } from '../data/content';
import { browserStorage } from '../utils/browserStorage';
import { addSceneButton, addSceneChrome } from '../ui/sceneChrome';

export class ShopScene extends Phaser.Scene {
  private message!: Phaser.GameObjects.Text;

  constructor() {
    super('Shop');
  }

  create(): void {
    addSceneChrome(this, 'Salvage Exchange', 'Permanent systems // paid in Void Shards');
    this.message = this.add
      .text(600, 190, '', {
        fontFamily: 'DM Mono, monospace',
        fontSize: '11px',
        color: '#ff8a7d',
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

    for (let index = 0; index < SHOP_UPGRADES.length; index += 1) {
      const upgrade = SHOP_UPGRADES[index]!;
      const level = save.permanentLevels[upgrade.id] ?? 0;
      const y = 260 + index * 125;
      this.add
        .rectangle(600, y, 650, 94, 0x10232b, 0.88)
        .setStrokeStyle(1, 0x8fffd4, 0.18);
      this.add
        .text(305, y - 23, upgrade.name.toUpperCase(), {
          fontFamily: 'Barlow Condensed, sans-serif',
          fontSize: '27px',
          color: '#e9f4ee',
          fontStyle: 'bold',
        })
        .setOrigin(0, 0.5);
      this.add
        .text(306, y + 15, `LEVEL ${level} / ${upgrade.maxLevel}`, {
          fontFamily: 'DM Mono, monospace',
          fontSize: '10px',
          color: '#829990',
        })
        .setOrigin(0, 0.5);
      const cost = metaUpgradeCost(upgrade.id, level);
      addSceneButton(
        this,
        850,
        y,
        Number.isFinite(cost) ? `UPGRADE  ${cost} SHARDS` : 'MAXED',
        () => {
          this.buy(upgrade.id);
        },
      );
    }
    addSceneButton(this, 600, 660, 'BACK TO FLIGHT DECK', () => this.scene.start('Menu'));
  }

  private buy(upgradeId: ShopUpgradeId): void {
    const save = loadSave(browserStorage);
    const result = purchaseMetaUpgrade(save.shards, save.permanentLevels, upgradeId);
    if (!result.purchased) {
      this.message.setText('NOT ENOUGH SHARDS');
      return;
    }
    save.shards = result.shards;
    save.permanentLevels = result.levels;
    save.stats.totalPurchases += 1;
    writeSave(browserStorage, save);
    this.game.events.emit('audio:sfx', 'purchase');
    this.scene.restart();
  }
}
