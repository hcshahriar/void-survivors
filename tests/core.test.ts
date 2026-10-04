import { describe, expect, it } from 'vitest';
import {
  ACHIEVEMENTS,
  BOSSES,
  ENEMIES,
  EVOLUTIONS,
  PASSIVES,
  WEAPONS,
} from '../src/data/content';
import { completedAchievements } from '../src/core/achievements';
import { applyDamage, calculateDamage } from '../src/core/combat';
import {
  addLeaderboardEntry,
  sortLeaderboard,
  type LeaderboardEntry,
} from '../src/core/leaderboard';
import {
  metaUpgradeCost,
  purchaseMetaUpgrade,
  purchaseShip,
  shardsEarned,
} from '../src/core/meta';
import { awardExperience, experienceForLevel } from '../src/core/progression';
import { SeededRandom } from '../src/core/rng';
import {
  DEFAULT_SAVE,
  loadSave,
  SAVE_KEY,
  SAVE_VERSION,
  writeSave,
  type StorageLike,
} from '../src/core/save';
import {
  applyUpgrade,
  availableEvolutions,
  chooseUpgradeCards,
  evolveWeapon,
  type UpgradeCard,
  type UpgradeLevels,
} from '../src/core/upgrades';
import {
  activeEnemyPool,
  canSpawnEnemy,
  dueBosses,
  getWaveState,
  spawnBatchSizeAt,
  spawnIntervalAt,
} from '../src/core/waveDirector';

const emptyLevels: UpgradeLevels = { weapons: {}, passives: {}, evolved: [] };
const upgradePool: UpgradeCard[] = [
  { id: 'pulse', kind: 'weapon', name: 'Pulse', description: 'Fire.', maxLevel: 5 },
  { id: 'drones', kind: 'weapon', name: 'Drones', description: 'Orbit.', maxLevel: 5 },
  { id: 'hull', kind: 'passive', name: 'Hull', description: 'Health.', maxLevel: 5 },
  {
    id: 'reactor',
    kind: 'passive',
    name: 'Reactor',
    description: 'Damage.',
    maxLevel: 5,
  },
];

class MemoryStorage implements StorageLike {
  values = new Map<string, string>();
  failReads = false;
  failWrites = false;

  getItem(key: string): string | null {
    if (this.failReads) throw new Error('Storage unavailable');
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (this.failWrites) throw new Error('Storage full');
    this.values.set(key, value);
  }
}

const entry = (
  name: string,
  score: number,
  durationSeconds: number,
): LeaderboardEntry => ({
  name,
  score,
  durationSeconds,
  achievedAt: 1,
});

describe('seeded random', () => {
  it('produces the same sequence for the same seed', () => {
    const first = new SeededRandom(42);
    const second = new SeededRandom(42);
    expect(Array.from({ length: 8 }, () => first.next())).toEqual(
      Array.from({ length: 8 }, () => second.next()),
    );
  });

  it('produces different sequences for different seeds', () => {
    expect(new SeededRandom(1).next()).not.toBe(new SeededRandom(2).next());
  });

  it('chooses and shuffles only the supplied values', () => {
    const random = new SeededRandom(17);
    expect(['a', 'b', 'c']).toContain(random.pick(['a', 'b', 'c']));
    expect(random.shuffle([1, 2, 3]).sort()).toEqual([1, 2, 3]);
    expect(random.pick([])).toBeUndefined();
  });
});

describe('damage and critical math', () => {
  it('applies the base damage multiplier', () => {
    expect(calculateDamage({ baseDamage: 20, damageMultiplier: 1.5, roll: 0.9 })).toEqual(
      {
        damage: 30,
        critical: false,
      },
    );
  });

  it('uses critical chance and multiplier when the roll succeeds', () => {
    expect(calculateDamage({ baseDamage: 20, criticalChance: 0.2, roll: 0.1 })).toEqual({
      damage: 35,
      critical: true,
    });
  });

  it('clamps reductions so damage cannot go below zero', () => {
    expect(calculateDamage({ baseDamage: 8, flatReduction: 12, roll: 1 }).damage).toBe(0);
    expect(applyDamage(40, 12.8)).toBe(28);
    expect(applyDamage(4, 100)).toBe(0);
  });
});

describe('experience curve', () => {
  it('starts with the configured threshold and grows by level', () => {
    expect(experienceForLevel(1)).toBe(8);
    expect(experienceForLevel(5)).toBeGreaterThan(experienceForLevel(4));
    expect(experienceForLevel(0)).toBe(8);
  });

  it('converts overflow experience into multiple levels', () => {
    expect(awardExperience({ level: 1, experience: 0 }, 40)).toEqual({
      level: 3,
      experience: 18,
    });
  });

  it('ignores negative experience grants', () => {
    expect(awardExperience({ level: 2, experience: 3 }, -5)).toEqual({
      level: 2,
      experience: 3,
    });
  });
});

describe('wave director', () => {
  it('starts at wave one and reaches victory at fifteen minutes', () => {
    expect(getWaveState(0).wave).toBe(1);
    expect(getWaveState(900).atVictory).toBe(true);
    expect(getWaveState(900).wave).toBe(16);
  });

  it('increases pressure with time while respecting interval and batch bounds', () => {
    const early = getWaveState(0);
    const late = getWaveState(840);
    expect(late.spawnIntervalMs).toBeLessThan(early.spawnIntervalMs);
    expect(late.spawnIntervalMs).toBeGreaterThanOrEqual(240);
    expect(late.batchSize).toBeLessThanOrEqual(5);
    expect(late.difficulty).toBe(1 + 840 / 900);
  });

  it('keeps the active enemy count at or below the configured cap', () => {
    expect(canSpawnEnemy(299)).toBe(true);
    expect(canSpawnEnemy(300)).toBe(false);
  });

  it('unlocks enemy types according to their configured time', () => {
    expect(activeEnemyPool(0, ENEMIES).map((enemy) => enemy.id)).toEqual(['swarmer']);
    expect(activeEnemyPool(900, ENEMIES)).toHaveLength(8);
  });

  it('schedules each boss once after its boundary', () => {
    expect(dueBosses(299, new Set(), BOSSES)).toHaveLength(0);
    expect(dueBosses(300, new Set(), BOSSES).map((boss) => boss.id)).toEqual(['warden']);
    expect(dueBosses(900, new Set(['warden', 'devourer']), BOSSES)).toHaveLength(1);
  });

  it('keeps final-wave spawning inside configured interval and batch limits', () => {
    expect(spawnIntervalAt(900)).toBe(398);
    expect(spawnIntervalAt(900)).toBeGreaterThanOrEqual(240);
    expect(spawnBatchSizeAt(900)).toBe(5);
    expect(BOSSES.map((boss) => boss.spawnSecond)).toEqual([300, 600, 900]);
  });
});

describe('upgrade selection and evolution', () => {
  it('returns unique upgrade cards from a seeded selection', () => {
    const selected = chooseUpgradeCards(upgradePool, emptyLevels, 3, 81);
    expect(selected).toHaveLength(3);
    expect(new Set(selected.map((card) => card.id)).size).toBe(3);
  });

  it('excludes upgrades at their maximum level', () => {
    const levels: UpgradeLevels = {
      ...emptyLevels,
      weapons: { pulse: 5 },
    };
    const selected = chooseUpgradeCards(upgradePool, levels, 4, 1);
    expect(selected.some((card) => card.id === 'pulse')).toBe(false);
  });

  it('increments the selected upgrade without mutating its input', () => {
    const result = applyUpgrade(emptyLevels, upgradePool[0]!);
    expect(result.weapons.pulse).toBe(1);
    expect(emptyLevels.weapons.pulse).toBeUndefined();
  });

  it('offers an evolution only when both recipe levels are maxed', () => {
    const levels: UpgradeLevels = {
      weapons: { pulse: 5 },
      passives: { targeting: 5 },
      evolved: [],
    };
    expect(
      availableEvolutions(levels, [{ weapon: 'pulse', passive: 'targeting' }]),
    ).toHaveLength(1);
    expect(
      availableEvolutions(emptyLevels, [{ weapon: 'pulse', passive: 'targeting' }]),
    ).toHaveLength(0);
  });

  it('does not evolve the same weapon twice', () => {
    const evolved = evolveWeapon(emptyLevels, 'pulse');
    expect(evolveWeapon(evolved, 'pulse').evolved).toEqual(['pulse']);
  });

  it('contains the required weapon, enemy, and passive catalog sizes', () => {
    expect(WEAPONS).toHaveLength(6);
    expect(ENEMIES).toHaveLength(8);
    expect(PASSIVES.length).toBeGreaterThanOrEqual(12);
  });

  it('defines chest evolutions for each weapon with a matching passive', () => {
    expect(EVOLUTIONS).toHaveLength(6);
    for (const evolution of EVOLUTIONS) {
      expect(WEAPONS.some((weapon) => weapon.id === evolution.weapon)).toBe(true);
      expect(PASSIVES.some((passive) => passive.id === evolution.passive)).toBe(true);
    }
  });
});

describe('save and load', () => {
  it('returns defaults for an empty save slot', () => {
    expect(loadSave(new MemoryStorage())).toEqual(DEFAULT_SAVE);
    expect(DEFAULT_SAVE.settings.aimMode).toBe('auto');
  });

  it('round-trips a current versioned save', () => {
    const storage = new MemoryStorage();
    expect(
      writeSave(storage, {
        ...DEFAULT_SAVE,
        shards: 55,
        settings: { ...DEFAULT_SAVE.settings, aimMode: 'manual' },
      }),
    ).toBe(true);
    expect(loadSave(storage).shards).toBe(55);
    expect(loadSave(storage).settings.aimMode).toBe('manual');
    expect(JSON.parse(storage.values.get(SAVE_KEY)!).version).toBe(SAVE_VERSION);
  });

  it('migrates version one saves and supplies new defaults', () => {
    const storage = new MemoryStorage();
    storage.values.set(
      SAVE_KEY,
      JSON.stringify({ version: 1, shards: 21, stats: { runs: 2 } }),
    );
    const save = loadSave(storage);
    expect(save.shards).toBe(21);
    expect(save.version).toBe(SAVE_VERSION);
    expect(save.stats.bestScore).toBe(0);
  });

  it('recovers from corrupt JSON and storage read failures', () => {
    const corrupt = new MemoryStorage();
    corrupt.values.set(SAVE_KEY, '{bad');
    expect(loadSave(corrupt)).toEqual(DEFAULT_SAVE);
    corrupt.failReads = true;
    expect(loadSave(corrupt)).toEqual(DEFAULT_SAVE);
  });

  it('reports write failures instead of throwing', () => {
    const storage = new MemoryStorage();
    storage.failWrites = true;
    expect(writeSave(storage, DEFAULT_SAVE)).toBe(false);
  });

  it('merges nested defaults into an older current-version save', () => {
    const storage = new MemoryStorage();
    storage.values.set(
      SAVE_KEY,
      JSON.stringify({ version: SAVE_VERSION, stats: { runs: 4 } }),
    );
    const save = loadSave(storage);
    expect(save.stats.totalPurchases).toBe(0);
    expect(save.settings.screenShake).toBe(true);
  });

  it('recovers invalid aim modes to Auto', () => {
    const storage = new MemoryStorage();
    storage.values.set(
      SAVE_KEY,
      JSON.stringify({ version: SAVE_VERSION, settings: { aimMode: 'turbo' } }),
    );
    expect(loadSave(storage).settings.aimMode).toBe('auto');
  });
});

describe('meta shop', () => {
  it('raises costs by upgrade level', () => {
    expect(metaUpgradeCost('max-health', 1)).toBeGreaterThan(
      metaUpgradeCost('max-health', 0),
    );
  });

  it('charges shards and increments the purchased level', () => {
    const result = purchaseMetaUpgrade(500, {}, 'max-health');
    expect(result.purchased).toBe(true);
    expect(result.shards).toBe(400);
    expect(result.levels['max-health']).toBe(1);
  });

  it('rejects insufficient funds and maxed upgrades', () => {
    expect(purchaseMetaUpgrade(1, {}, 'max-health').purchased).toBe(false);
    expect(purchaseMetaUpgrade(1_000, { 'max-health': 5 }, 'max-health').purchased).toBe(
      false,
    );
  });

  it('awards shards for time and bosses', () => {
    expect(shardsEarned(120, 1)).toBe(12);
  });

  it('unlocks ships only when the pilot has enough shards', () => {
    expect(purchaseShip(400, ['scout'], 'bulwark')).toEqual({
      shards: 220,
      unlockedShips: ['scout', 'bulwark'],
      purchased: true,
    });
    expect(purchaseShip(20, ['scout'], 'phantom').purchased).toBe(false);
  });
});

describe('leaderboard', () => {
  it('sorts by score, then duration, then earlier record time', () => {
    expect(
      sortLeaderboard([entry('A', 100, 10), entry('B', 100, 20)]).map(
        (item) => item.name,
      ),
    ).toEqual(['B', 'A']);
  });

  it('adds entries and trims to the top N', () => {
    const entries = [entry('A', 3, 3), entry('B', 2, 2)];
    expect(
      addLeaderboardEntry(entries, entry('C', 1, 1), 2).map((item) => item.name),
    ).toEqual(['A', 'B']);
  });
});

describe('achievements', () => {
  it('unlocks achievements at their configured milestones', () => {
    const completed = completedAchievements({
      elapsedSeconds: 900,
      kills: 500,
      level: 10,
      bossesDefeated: 3,
      maxWeapon: true,
      evolvedWeapon: true,
      purchases: 1,
    });
    expect(completed).toHaveLength(ACHIEVEMENTS.length);
  });

  it('returns no achievements for a fresh pilot', () => {
    expect(
      completedAchievements({
        elapsedSeconds: 0,
        kills: 0,
        level: 1,
        bossesDefeated: 0,
        maxWeapon: false,
        evolvedWeapon: false,
        purchases: 0,
      }),
    ).toEqual([]);
  });
});
