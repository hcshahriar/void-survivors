export const BALANCE = {
  player: {
    health: 100,
    speed: 230,
    pickupRadius: 110,
    damageCooldownMs: 750,
  },
  combat: {
    criticalMultiplier: 1.75,
    projectileSpeed: 590,
    playerRadius: 13,
  },
  run: {
    durationSeconds: 900,
    enemyCap: 300,
    bossSeconds: [300, 600, 900],
    spawnMargin: 36,
    hudRefreshMs: 150,
  },
  waves: {
    firstIntervalMs: 1_100,
    minimumIntervalMs: 240,
    intervalReductionPerSecond: 0.78,
    firstEnemyCount: 1,
    maximumBatchSize: 5,
    batchIncreaseSeconds: 115,
  },
  progression: {
    firstExperience: 8,
    linearExperience: 5,
    quadraticExperience: 1.4,
    shardValue: 1,
    killScore: 10,
  },
  meta: {
    baseUpgradeCost: 100,
    costMultiplier: 1.65,
    maxUpgradeLevel: 5,
    shardsPerMinute: 2,
    startingRunScorePerLevel: 50,
  },
  limits: {
    leaderboardEntries: 10,
    damageNumberPool: 80,
    projectilePool: 480,
    particlePool: 700,
  },
} as const;
