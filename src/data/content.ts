export type WeaponId =
  'pulse' | 'drones' | 'lightning' | 'missiles' | 'shockwave' | 'laser';
export type EnemyId =
  | 'swarmer'
  | 'dasher'
  | 'shooter'
  | 'tank'
  | 'splitter'
  | 'exploder'
  | 'healer'
  | 'shielded';
export type PassiveId =
  | 'hull'
  | 'reactor'
  | 'magnet'
  | 'coolant'
  | 'targeting'
  | 'thrusters'
  | 'capacitor'
  | 'armor'
  | 'salvage'
  | 'phase'
  | 'scavenger'
  | 'stabilizer';

export interface WeaponDefinition {
  id: WeaponId;
  name: string;
  description: string;
  baseDamage: number;
  cooldownMs: number;
  range: number;
  maxLevel: number;
  evolutionPassive: PassiveId;
}

export const WEAPONS: readonly WeaponDefinition[] = [
  {
    id: 'pulse',
    name: 'Pulse Blaster',
    description: 'Nearest target, hard and fast.',
    baseDamage: 18,
    cooldownMs: 470,
    range: 480,
    maxLevel: 5,
    evolutionPassive: 'targeting',
  },
  {
    id: 'drones',
    name: 'Orbiting Drones',
    description: 'Two sentries sweep nearby threats.',
    baseDamage: 8,
    cooldownMs: 720,
    range: 100,
    maxLevel: 5,
    evolutionPassive: 'stabilizer',
  },
  {
    id: 'lightning',
    name: 'Chain Lightning',
    description: 'Arcs through a cluster of targets.',
    baseDamage: 14,
    cooldownMs: 1_050,
    range: 270,
    maxLevel: 5,
    evolutionPassive: 'capacitor',
  },
  {
    id: 'missiles',
    name: 'Homing Missiles',
    description: 'A slow lock-on with a wide blast.',
    baseDamage: 28,
    cooldownMs: 1_450,
    range: 600,
    maxLevel: 5,
    evolutionPassive: 'reactor',
  },
  {
    id: 'shockwave',
    name: 'Shockwave',
    description: 'Pulse outward when enemies close in.',
    baseDamage: 20,
    cooldownMs: 1_750,
    range: 165,
    maxLevel: 5,
    evolutionPassive: 'armor',
  },
  {
    id: 'laser',
    name: 'Laser Beam',
    description: 'Carve a straight line through the void.',
    baseDamage: 11,
    cooldownMs: 1_200,
    range: 620,
    maxLevel: 5,
    evolutionPassive: 'coolant',
  },
];

export interface EnemyDefinition {
  id: EnemyId;
  name: string;
  health: number;
  speed: number;
  damage: number;
  radius: number;
  score: number;
  experience: number;
  spawnWeight: number;
  unlockSecond: number;
}

export const ENEMIES: readonly EnemyDefinition[] = [
  {
    id: 'swarmer',
    name: 'Swarmer',
    health: 24,
    speed: 76,
    damage: 9,
    radius: 10,
    score: 10,
    experience: 1,
    spawnWeight: 48,
    unlockSecond: 0,
  },
  {
    id: 'dasher',
    name: 'Dasher',
    health: 28,
    speed: 55,
    damage: 13,
    radius: 12,
    score: 16,
    experience: 1,
    spawnWeight: 15,
    unlockSecond: 75,
  },
  {
    id: 'shooter',
    name: 'Shooter',
    health: 38,
    speed: 32,
    damage: 12,
    radius: 14,
    score: 22,
    experience: 2,
    spawnWeight: 12,
    unlockSecond: 145,
  },
  {
    id: 'tank',
    name: 'Tank',
    health: 150,
    speed: 22,
    damage: 23,
    radius: 22,
    score: 35,
    experience: 3,
    spawnWeight: 8,
    unlockSecond: 210,
  },
  {
    id: 'splitter',
    name: 'Splitter',
    health: 62,
    speed: 42,
    damage: 15,
    radius: 16,
    score: 25,
    experience: 2,
    spawnWeight: 7,
    unlockSecond: 300,
  },
  {
    id: 'exploder',
    name: 'Exploder',
    health: 30,
    speed: 66,
    damage: 24,
    radius: 13,
    score: 20,
    experience: 2,
    spawnWeight: 5,
    unlockSecond: 390,
  },
  {
    id: 'healer',
    name: 'Healer',
    health: 55,
    speed: 30,
    damage: 8,
    radius: 15,
    score: 32,
    experience: 3,
    spawnWeight: 3,
    unlockSecond: 510,
  },
  {
    id: 'shielded',
    name: 'Shielded',
    health: 95,
    speed: 34,
    damage: 18,
    radius: 18,
    score: 34,
    experience: 3,
    spawnWeight: 4,
    unlockSecond: 630,
  },
];

export interface PassiveDefinition {
  id: PassiveId;
  name: string;
  description: string;
  maxLevel: number;
}

export const PASSIVES: readonly PassiveDefinition[] = [
  {
    id: 'hull',
    name: 'Reinforced Hull',
    description: 'Increase maximum hull integrity.',
    maxLevel: 5,
  },
  {
    id: 'reactor',
    name: 'Hot Reactor',
    description: 'Increase weapon damage.',
    maxLevel: 5,
  },
  {
    id: 'magnet',
    name: 'Tractor Field',
    description: 'Collect shards from farther away.',
    maxLevel: 5,
  },
  {
    id: 'coolant',
    name: 'Coolant Loop',
    description: 'Shorten weapon cooldowns.',
    maxLevel: 5,
  },
  {
    id: 'targeting',
    name: 'Targeting Array',
    description: 'Extend weapon range and critical chance.',
    maxLevel: 5,
  },
  {
    id: 'thrusters',
    name: 'Vector Thrusters',
    description: 'Move faster through the swarm.',
    maxLevel: 5,
  },
  {
    id: 'capacitor',
    name: 'Capacitor Bank',
    description: 'Chain attacks jump farther.',
    maxLevel: 5,
  },
  {
    id: 'armor',
    name: 'Reactive Plating',
    description: 'Reduce incoming damage.',
    maxLevel: 5,
  },
  {
    id: 'salvage',
    name: 'Salvage Protocol',
    description: 'Increase shard and score value.',
    maxLevel: 5,
  },
  {
    id: 'phase',
    name: 'Phase Matrix',
    description: 'Recover from damage sooner.',
    maxLevel: 5,
  },
  {
    id: 'scavenger',
    name: 'Scavenger Rig',
    description: 'Earn more experience from shards.',
    maxLevel: 5,
  },
  {
    id: 'stabilizer',
    name: 'Gyro Stabilizer',
    description: 'Improve drone orbit speed and damage.',
    maxLevel: 5,
  },
];

export interface BossDefinition {
  id: string;
  name: string;
  spawnSecond: number;
  health: number;
  phases: readonly number[];
}

export const BOSSES: readonly BossDefinition[] = [
  {
    id: 'warden',
    name: 'THE WARDEN',
    spawnSecond: 300,
    health: 1_800,
    phases: [0.66, 0.33],
  },
  {
    id: 'devourer',
    name: 'THE DEVOURER',
    spawnSecond: 600,
    health: 3_600,
    phases: [0.72, 0.4, 0.18],
  },
  {
    id: 'singularity',
    name: 'SINGULARITY',
    spawnSecond: 900,
    health: 6_800,
    phases: [0.8, 0.58, 0.32, 0.12],
  },
];

export const EVOLUTIONS = [
  {
    weapon: 'pulse',
    passive: 'targeting',
    name: 'Nova Lance',
    description: 'A piercing star-forged beam.',
  },
  {
    weapon: 'drones',
    passive: 'stabilizer',
    name: 'Aegis Array',
    description: 'Orbiting sentries strike in a wider formation.',
  },
  {
    weapon: 'lightning',
    passive: 'capacitor',
    name: 'Storm Circuit',
    description: 'Chain arcs jump through a whole formation.',
  },
  {
    weapon: 'missiles',
    passive: 'reactor',
    name: 'Comet Swarm',
    description: 'A salvo of volatile seeker missiles.',
  },
  {
    weapon: 'shockwave',
    passive: 'armor',
    name: 'Event Horizon',
    description: 'A crushing pulse with a wider radius.',
  },
  {
    weapon: 'laser',
    passive: 'coolant',
    name: 'Eclipse Beam',
    description: 'A sustained beam cleaves the arena.',
  },
] as const;

export interface ShipDefinition {
  id: string;
  name: string;
  health: number;
  speed: number;
  startingWeapon: WeaponId;
  unlockCost: number;
}

export const SHIPS: readonly ShipDefinition[] = [
  {
    id: 'scout',
    name: 'The Scout',
    health: 100,
    speed: 230,
    startingWeapon: 'pulse',
    unlockCost: 0,
  },
  {
    id: 'bulwark',
    name: 'The Bulwark',
    health: 145,
    speed: 190,
    startingWeapon: 'shockwave',
    unlockCost: 180,
  },
  {
    id: 'phantom',
    name: 'The Phantom',
    health: 80,
    speed: 275,
    startingWeapon: 'drones',
    unlockCost: 300,
  },
];

export const SHOP_UPGRADES = [
  { id: 'max-health', name: 'Hull Plating', baseCost: 100, maxLevel: 5 },
  { id: 'starting-shards', name: 'Salvage Cache', baseCost: 125, maxLevel: 5 },
  { id: 'rerolls', name: 'Tactical Data', baseCost: 150, maxLevel: 3 },
] as const;

export type AchievementId =
  | 'first-kill'
  | 'first-level'
  | 'first-boss'
  | 'five-minutes'
  | 'ten-minutes'
  | 'fifteen-minutes'
  | 'hundred-kills'
  | 'five-hundred-kills'
  | 'ten-levels'
  | 'max-weapon'
  | 'evolution'
  | 'first-purchase';

export const ACHIEVEMENTS: readonly {
  id: AchievementId;
  name: string;
  description: string;
}[] = [
  { id: 'first-kill', name: 'First Contact', description: 'Destroy one enemy.' },
  { id: 'first-level', name: 'Adapt', description: 'Reach level two.' },
  { id: 'first-boss', name: 'Big Game', description: 'Defeat a boss.' },
  { id: 'five-minutes', name: 'Still Here', description: 'Survive five minutes.' },
  { id: 'ten-minutes', name: 'Long Haul', description: 'Survive ten minutes.' },
  { id: 'fifteen-minutes', name: 'Last Light', description: 'Complete a full run.' },
  { id: 'hundred-kills', name: 'Clear the Lane', description: 'Destroy 100 enemies.' },
  { id: 'five-hundred-kills', name: 'No Survivors', description: 'Destroy 500 enemies.' },
  { id: 'ten-levels', name: 'Overclocked', description: 'Reach level ten.' },
  { id: 'max-weapon', name: 'Masterwork', description: 'Max out a weapon.' },
  { id: 'evolution', name: 'Beyond Form', description: 'Evolve a weapon.' },
  { id: 'first-purchase', name: 'Invested', description: 'Buy a permanent upgrade.' },
];
