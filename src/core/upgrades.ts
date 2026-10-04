import type { PassiveId, WeaponId } from '../data/content';
import { SeededRandom } from './rng';

export type UpgradeKind = 'weapon' | 'passive';

export interface UpgradeCard {
  id: WeaponId | PassiveId;
  kind: UpgradeKind;
  name: string;
  description: string;
  maxLevel: number;
}

export interface UpgradeLevels {
  weapons: Partial<Record<WeaponId, number>>;
  passives: Partial<Record<PassiveId, number>>;
  evolved: WeaponId[];
}

export interface EvolutionRecipe {
  weapon: WeaponId;
  passive: PassiveId;
}

export function chooseUpgradeCards(
  pool: readonly UpgradeCard[],
  levels: UpgradeLevels,
  count: number,
  seed: number,
): UpgradeCard[] {
  const available = pool.filter((card) => {
    const currentLevel =
      card.kind === 'weapon'
        ? levels.weapons[card.id as WeaponId]
        : levels.passives[card.id as PassiveId];
    return (currentLevel ?? 0) < card.maxLevel;
  });
  return new SeededRandom(seed).shuffle(available).slice(0, Math.max(0, count));
}

export function applyUpgrade(levels: UpgradeLevels, card: UpgradeCard): UpgradeLevels {
  if (card.kind === 'weapon') {
    const current = levels.weapons[card.id as WeaponId] ?? 0;
    return {
      ...levels,
      weapons: { ...levels.weapons, [card.id]: Math.min(card.maxLevel, current + 1) },
    };
  }
  const current = levels.passives[card.id as PassiveId] ?? 0;
  return {
    ...levels,
    passives: { ...levels.passives, [card.id]: Math.min(card.maxLevel, current + 1) },
  };
}

export function availableEvolutions(
  levels: UpgradeLevels,
  recipes: readonly EvolutionRecipe[],
): EvolutionRecipe[] {
  return recipes.filter(
    (recipe) =>
      (levels.weapons[recipe.weapon] ?? 0) >= 5 &&
      (levels.passives[recipe.passive] ?? 0) >= 5 &&
      !levels.evolved.includes(recipe.weapon),
  );
}

export function evolveWeapon(levels: UpgradeLevels, weapon: WeaponId): UpgradeLevels {
  return levels.evolved.includes(weapon)
    ? levels
    : { ...levels, evolved: [...levels.evolved, weapon] };
}
