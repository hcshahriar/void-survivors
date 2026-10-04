import Phaser from 'phaser';
import { loadSave } from '../core/save';
import { ACHIEVEMENTS } from '../data/content';
import { sortLeaderboard } from '../core/leaderboard';
import { browserStorage } from '../utils/browserStorage';
import { addSceneChrome, addSceneButton } from '../ui/sceneChrome';

export class StatsScene extends Phaser.Scene {
  constructor() {
    super('Stats');
  }

  create(): void {
    addSceneChrome(this, 'Flight Log', 'Run history // pilot commendations');
    const save = loadSave(browserStorage);
    const minutes = Math.floor(save.stats.bestSeconds / 60);
    const seconds = Math.floor(save.stats.bestSeconds % 60);
    this.add.text(
      80,
      200,
      `RUNS  ${save.stats.runs}\nKILLS  ${save.stats.totalKills}\nBEST TIME  ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}\nBEST SCORE  ${String(save.stats.bestScore).padStart(6, '0')}\nVOID SHARDS  ${save.shards}`,
      {
        fontFamily: 'DM Mono, monospace',
        fontSize: '13px',
        color: '#dce8e2',
        lineSpacing: 16,
      },
    );

    this.add.text(650, 202, 'LOCAL LEADERBOARD', {
      fontFamily: 'Barlow Condensed, sans-serif',
      fontSize: '28px',
      color: '#8fffd4',
      fontStyle: 'bold',
    });
    const leaderboard = sortLeaderboard(save.leaderboard).slice(0, 10);
    for (let index = 0; index < 10; index += 1) {
      const entry = leaderboard[index];
      const row = `${String(index + 1).padStart(2, '0')}  ${entry?.name ?? '---'}  ${String(entry?.score ?? 0).padStart(6, '0')}`;
      this.add.text(650, 246 + index * 25, row, {
        fontFamily: 'DM Mono, monospace',
        fontSize: '11px',
        color: index === 0 && entry ? '#ffc76b' : '#a9bbb4',
      });
    }

    this.add.text(
      80,
      438,
      `COMMENDATIONS  ${save.achievements.length} / ${ACHIEVEMENTS.length}`,
      {
        fontFamily: 'Barlow Condensed, sans-serif',
        fontSize: '28px',
        color: '#8fffd4',
        fontStyle: 'bold',
      },
    );
    const achievementColumnWidth = 520;
    for (let index = 0; index < ACHIEVEMENTS.length; index += 1) {
      const achievement = ACHIEVEMENTS[index]!;
      const column = index < 6 ? 0 : 1;
      const row = index % 6;
      const unlocked = save.achievements.includes(achievement.id);
      this.add.text(
        80 + column * achievementColumnWidth,
        480 + row * 28,
        `${unlocked ? '◆' : '◇'}  ${achievement.name.toUpperCase()}`,
        {
          fontFamily: 'DM Mono, monospace',
          fontSize: '10px',
          color: unlocked ? '#ffc76b' : '#627771',
        },
      );
    }
    addSceneButton(this, 600, 675, 'BACK TO FLIGHT DECK', () => this.scene.start('Menu'));
  }
}
