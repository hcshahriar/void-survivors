import { BALANCE } from '../data/balance';

export function experienceForLevel(level: number): number {
  const safeLevel = Math.max(1, Math.floor(level));
  return Math.floor(
    BALANCE.progression.firstExperience +
      BALANCE.progression.linearExperience * (safeLevel - 1) +
      BALANCE.progression.quadraticExperience * (safeLevel - 1) ** 2,
  );
}

export interface ExperienceState {
  level: number;
  experience: number;
}

export function awardExperience(state: ExperienceState, amount: number): ExperienceState {
  let level = Math.max(1, state.level);
  let experience = Math.max(0, state.experience) + Math.max(0, amount);
  while (experience >= experienceForLevel(level)) {
    experience -= experienceForLevel(level);
    level += 1;
  }
  return { level, experience };
}
