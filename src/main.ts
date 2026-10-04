import Phaser from 'phaser';
import { AudioManager, type SfxId } from './audio/AudioManager';
import { loadSave, type GameSave } from './core/save';
import { browserStorage } from './utils/browserStorage';
import { BootScene } from './scenes/BootScene';
import { GameOverScene } from './scenes/GameOverScene';
import { GameScene } from './scenes/GameScene';
import { MenuScene } from './scenes/MenuScene';
import { SettingsScene } from './scenes/SettingsScene';
import { ShopScene } from './scenes/ShopScene';
import { ShipSelectScene } from './scenes/ShipSelectScene';
import { StatsScene } from './scenes/StatsScene';
import { UIOverlayScene } from './scenes/UIOverlayScene';
import './style.css';

const stage = document.querySelector<HTMLDivElement>('#arena-stage');
if (!stage) throw new Error('Missing game arena mount point.');

const audio = new AudioManager(loadSave(browserStorage).settings);
const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: stage,
  backgroundColor: '#081118',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1_200,
    height: 720,
    parent: stage,
  },
  render: {
    antialias: true,
    pixelArt: false,
    roundPixels: true,
  },
  input: {
    keyboard: true,
    gamepad: true,
    touch: true,
  },
  scene: [
    BootScene,
    MenuScene,
    ShopScene,
    ShipSelectScene,
    StatsScene,
    SettingsScene,
    GameScene,
    UIOverlayScene,
    GameOverScene,
  ],
});

let runPaused = false;
game.events.on('run:pause-state', (paused: boolean) => {
  runPaused = paused;
});
window.addEventListener(
  'keydown',
  (event) => {
    if (event.repeat || (event.code !== 'KeyP' && event.code !== 'Escape')) return;
    if (!runPaused && !game.scene.isActive('Game')) return;
    event.preventDefault();
    game.events.emit(runPaused ? 'overlay:keyboard-resume' : 'overlay:pause');
  },
  true,
);

game.events.on('audio:sfx', (sound: SfxId) => audio.play(sound));
game.events.on('audio:wave', (level: number) => audio.setWaveLevel(level));
game.events.on('audio:settings', (settings: GameSave['settings']) =>
  audio.updateSettings(settings),
);

const unlockAudio = (): void => {
  void audio.unlock();
};
window.addEventListener('pointerdown', unlockAudio, { once: true });
window.addEventListener('keydown', unlockAudio, { once: true });
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && game.scene.isActive('Game')) {
    game.events.emit('overlay:auto-pause');
  }
});
window.addEventListener('beforeunload', () => audio.destroy());
