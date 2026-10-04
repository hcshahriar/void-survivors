import { BALANCE } from '../data/balance';
import { SHIPS, SHOP_UPGRADES } from '../data/content';

export type ShopUpgradeId = (typeof SHOP_UPGRADES)[number]['id'];
export type PermanentLevels = Partial<Record<ShopUpgradeId, number>>;

export function metaUpgradeCost(upgradeId: ShopUpgradeId, level: number): number {
  const upgrade = SHOP_UPGRADES.find((item) => item.id === upgradeId);
  if (!upgrade || level >= upgrade.maxLevel) return Number.POSITIVE_INFINITY;
  return Math.ceil(upgrade.baseCost * BALANCE.meta.costMultiplier ** Math.max(0, level));
}

export interface PurchaseResult {
  shards: number;
  levels: PermanentLevels;
  purchased: boolean;
}

export function purchaseMetaUpgrade(
  shards: number,
  levels: PermanentLevels,
  upgradeId: ShopUpgradeId,
): PurchaseResult {
  const currentLevel = levels[upgradeId] ?? 0;
  const cost = metaUpgradeCost(upgradeId, currentLevel);
  if (shards < cost || !Number.isFinite(cost))
    return { shards, levels, purchased: false };
  return {
    shards: shards - cost,
    levels: { ...levels, [upgradeId]: currentLevel + 1 },
    purchased: true,
  };
}

export function shardsEarned(elapsedSeconds: number, defeatedBosses: number): number {
  return Math.max(
    0,
    Math.floor(elapsedSeconds / 60) * BALANCE.meta.shardsPerMinute + defeatedBosses * 8,
  );
}

export interface ShipPurchaseResult {
  shards: number;
  unlockedShips: string[];
  purchased: boolean;
}

export function purchaseShip(
  shards: number,
  unlockedShips: readonly string[],
  shipId: string,
): ShipPurchaseResult {
  const ship = SHIPS.find((item) => item.id === shipId);
  if (!ship || unlockedShips.includes(shipId) || shards < ship.unlockCost) {
    return { shards, unlockedShips: [...unlockedShips], purchased: false };
  }
  return {
    shards: shards - ship.unlockCost,
    unlockedShips: [...unlockedShips, shipId],
    purchased: true,
  };
}
