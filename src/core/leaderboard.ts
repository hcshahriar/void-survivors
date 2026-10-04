export interface LeaderboardEntry {
  name: string;
  score: number;
  durationSeconds: number;
  achievedAt: number;
}

export function sortLeaderboard(
  entries: readonly LeaderboardEntry[],
): LeaderboardEntry[] {
  return [...entries].sort(
    (left, right) =>
      right.score - left.score ||
      right.durationSeconds - left.durationSeconds ||
      left.achievedAt - right.achievedAt,
  );
}

export function addLeaderboardEntry(
  entries: readonly LeaderboardEntry[],
  entry: LeaderboardEntry,
  maximumEntries: number,
): LeaderboardEntry[] {
  return sortLeaderboard([...entries, { ...entry }]).slice(
    0,
    Math.max(0, maximumEntries),
  );
}
