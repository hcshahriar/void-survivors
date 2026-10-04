import { BALANCE } from '../data/balance';

export interface DamageInput {
  baseDamage: number;
  damageMultiplier?: number;
  flatReduction?: number;
  criticalChance?: number;
  criticalMultiplier?: number;
  roll: number;
}

export interface DamageResult {
  damage: number;
  critical: boolean;
}

export function calculateDamage(input: DamageInput): DamageResult {
  const critical = input.roll < Math.max(0, Math.min(1, input.criticalChance ?? 0));
  const multiplier = critical
    ? (input.criticalMultiplier ?? BALANCE.combat.criticalMultiplier)
    : 1;
  const rawDamage = input.baseDamage * (input.damageMultiplier ?? 1) * multiplier;
  return {
    damage: Math.max(0, Math.round(rawDamage - (input.flatReduction ?? 0))),
    critical,
  };
}

export function applyDamage(health: number, incomingDamage: number): number {
  return Math.max(0, health - Math.max(0, Math.floor(incomingDamage)));
}
