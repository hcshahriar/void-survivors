import { ACHIEVEMENTS, type AchievementId } from '../data/content';

export interface AchievementProgress {
  elapsedSeconds: number;
  kills: number;
  level: number;
  bossesDefeated: number;
  maxWeapon: boolean;
  evolvedWeapon: boolean;
  purchases: number;
}

export function completedAchievements(progress: AchievementProgress): AchievementId[] {
  const completed = new Set<AchievementId>();
  if (progress.kills >= 1) completed.add('first-kill');
  if (progress.level >= 2) completed.add('first-level');
  if (progress.bossesDefeated >= 1) completed.add('first-boss');
  if (progress.elapsedSeconds >= 300) completed.add('five-minutes');
  if (progress.elapsedSeconds >= 600) completed.add('ten-minutes');
  if (progress.elapsedSeconds >= 900) completed.add('fifteen-minutes');
  if (progress.kills >= 100) completed.add('hundred-kills');
  if (progress.kills >= 500) completed.add('five-hundred-kills');
  if (progress.level >= 10) completed.add('ten-levels');
  if (progress.maxWeapon) completed.add('max-weapon');
  if (progress.evolvedWeapon) completed.add('evolution');
  if (progress.purchases > 0) completed.add('first-purchase');
  return ACHIEVEMENTS.filter((achievement) => completed.has(achievement.id)).map(
    (achievement) => achievement.id,
  );
}
