import type { LeaderboardEntry } from './leaderboard';
import type { PermanentLevels } from './meta';

export const SAVE_VERSION = 2;
export const SAVE_KEY = 'void-survivors-save';
export type AimMode = 'auto' | 'manual';

export interface GameSave {
  version: typeof SAVE_VERSION;
  shards: number;
  permanentLevels: PermanentLevels;
  selectedShip: string;
  unlockedShips: string[];
  stats: {
    runs: number;
    totalKills: number;
    totalPurchases: number;
    bestSeconds: number;
    bestScore: number;
  };
  leaderboard: LeaderboardEntry[];
  achievements: string[];
  settings: {
    masterVolume: number;
    musicVolume: number;
    sfxVolume: number;
    muted: boolean;
    screenShake: boolean;
    colorblind: boolean;
    showFps: boolean;
    aimMode: AimMode;
  };
}

export const DEFAULT_SAVE: GameSave = {
  version: SAVE_VERSION,
  shards: 0,
  permanentLevels: {},
  selectedShip: 'scout',
  unlockedShips: ['scout'],
  stats: { runs: 0, totalKills: 0, totalPurchases: 0, bestSeconds: 0, bestScore: 0 },
  leaderboard: [],
  achievements: [],
  settings: {
    masterVolume: 0.7,
    musicVolume: 0.35,
    sfxVolume: 0.65,
    muted: false,
    screenShake: true,
    colorblind: false,
    showFps: false,
    aimMode: 'auto',
  },
};

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function migrate(value: unknown): GameSave {
  if (typeof value !== 'object' || value === null) return structuredClone(DEFAULT_SAVE);
  const candidate = value as Partial<GameSave> & { version?: number };
  if (candidate.version === SAVE_VERSION) {
    return {
      ...structuredClone(DEFAULT_SAVE),
      ...candidate,
      stats: { ...DEFAULT_SAVE.stats, ...candidate.stats },
      settings: {
        ...DEFAULT_SAVE.settings,
        ...candidate.settings,
        aimMode: candidate.settings?.aimMode === 'manual' ? 'manual' : 'auto',
      },
      version: SAVE_VERSION,
    };
  }
  if (candidate.version === 1) {
    return {
      ...structuredClone(DEFAULT_SAVE),
      shards: typeof candidate.shards === 'number' ? Math.max(0, candidate.shards) : 0,
      stats: { ...DEFAULT_SAVE.stats, ...candidate.stats },
      settings: {
        ...DEFAULT_SAVE.settings,
        ...candidate.settings,
        aimMode: candidate.settings?.aimMode === 'manual' ? 'manual' : 'auto',
      },
    };
  }
  return structuredClone(DEFAULT_SAVE);
}

export function loadSave(storage: StorageLike, key = SAVE_KEY): GameSave {
  try {
    const serialized = storage.getItem(key);
    return serialized === null
      ? structuredClone(DEFAULT_SAVE)
      : migrate(JSON.parse(serialized) as unknown);
  } catch {
    return structuredClone(DEFAULT_SAVE);
  }
}

export function writeSave(storage: StorageLike, save: GameSave, key = SAVE_KEY): boolean {
  try {
    storage.setItem(key, JSON.stringify({ ...save, version: SAVE_VERSION }));
    return true;
  } catch {
    return false;
  }
}
