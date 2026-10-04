import Phaser from 'phaser';
import { loadSave, writeSave, type GameSave } from '../core/save';
import { browserStorage } from '../utils/browserStorage';
import { addSceneButton, addSceneChrome } from '../ui/sceneChrome';

type VolumeSetting = 'masterVolume' | 'musicVolume' | 'sfxVolume';

export class SettingsScene extends Phaser.Scene {
  private settings!: GameSave['settings'];

  constructor() {
    super('Settings');
  }

  create(): void {
    addSceneChrome(this, 'Flight Systems', 'Audio // accessibility // display');
    this.settings = loadSave(browserStorage).settings;
    this.add.text(250, 208, 'MASTER VOLUME', this.labelStyle());
    this.add.text(250, 280, 'MUSIC VOLUME', this.labelStyle());
    this.add.text(250, 352, 'SFX VOLUME', this.labelStyle());
    this.addVolumeSlider('masterVolume', 520, 218);
    this.addVolumeSlider('musicVolume', 520, 290);
    this.addVolumeSlider('sfxVolume', 520, 362);
    this.add.text(250, 414, 'AIM MODE', this.labelStyle());
    this.addAimModeChoice('auto', 545, 414);
    this.addAimModeChoice('manual', 675, 414);

    this.add.text(250, 466, 'SYSTEM OPTIONS', {
      fontFamily: 'Barlow Condensed, sans-serif',
      fontSize: '28px',
      color: '#8fffd4',
      fontStyle: 'bold',
    });
    this.addToggle('MUTE ALL AUDIO', 'muted', 508);
    this.addToggle('SCREEN SHAKE', 'screenShake', 548);
    this.addToggle('COLORBLIND PALETTE', 'colorblind', 588);
    this.addToggle('FPS COUNTER', 'showFps', 628);
    addSceneButton(this, 600, 680, 'BACK TO FLIGHT DECK', () => this.scene.start('Menu'));
  }

  private labelStyle(): Phaser.Types.GameObjects.Text.TextStyle {
    return { fontFamily: 'DM Mono, monospace', fontSize: '11px', color: '#cad8d1' };
  }

  private addVolumeSlider(key: VolumeSetting, left: number, y: number): void {
    const width = 360;
    this.add.rectangle(left + width / 2, y, width, 6, 0x25444b).setOrigin(0.5);
    const fill = this.add
      .rectangle(left, y, width * this.settings[key], 6, 0x45d6dc)
      .setOrigin(0, 0.5);
    const value = this.add
      .text(left + width + 25, y, `${Math.round(this.settings[key] * 100)}%`, {
        fontFamily: 'DM Mono, monospace',
        fontSize: '10px',
        color: '#8fffd4',
      })
      .setOrigin(0, 0.5);
    const hitArea = this.add
      .rectangle(left + width / 2, y, width, 30, 0xffffff, 0.001)
      .setInteractive({ useHandCursor: true });
    const setVolume = (pointer: Phaser.Input.Pointer): void => {
      this.settings[key] = Phaser.Math.Clamp((pointer.x - left) / width, 0, 1);
      fill.width = width * this.settings[key];
      value.setText(`${Math.round(this.settings[key] * 100)}%`);
      this.persistSettings();
    };
    hitArea.on('pointerdown', setVolume);
    hitArea.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.isDown) setVolume(pointer);
    });
  }

  private addAimModeChoice(
    mode: GameSave['settings']['aimMode'],
    x: number,
    y: number,
  ): void {
    const choice = this.add
      .text(x, y, mode.toUpperCase(), {
        fontFamily: 'DM Mono, monospace',
        fontSize: '10px',
        color: '#dce8e2',
        backgroundColor: '#10232b',
        padding: { left: 17, right: 17, top: 9, bottom: 9 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    const render = (): void => {
      const selected = this.settings.aimMode === mode;
      choice.setStyle({
        color: selected ? '#081116' : '#dce8e2',
        backgroundColor: selected ? '#8fffd4' : '#10232b',
      });
    };
    render();
    choice.on('pointerdown', () => {
      this.settings.aimMode = mode;
      render();
      this.persistSettings();
    });
  }

  private addToggle(
    label: string,
    key: 'muted' | 'screenShake' | 'colorblind' | 'showFps',
    y: number,
  ): void {
    const toggle = this.add
      .text(850, y, '', {
        fontFamily: 'DM Mono, monospace',
        fontSize: '10px',
        color: '#dce8e2',
        backgroundColor: '#10232b',
        padding: { left: 12, right: 12, top: 8, bottom: 8 },
      })
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true });
    const render = (): void => {
      toggle.setText(`${label}   ${this.settings[key] ? 'ON' : 'OFF'}`);
    };
    render();
    toggle.on('pointerdown', () => {
      this.settings[key] = !this.settings[key];
      render();
      this.persistSettings();
    });
  }

  private persistSettings(): void {
    const save = loadSave(browserStorage);
    save.settings = { ...this.settings };
    writeSave(browserStorage, save);
    this.game.events.emit('audio:settings', this.settings);
  }
}
