import Phaser from 'phaser';
import type { UpgradeCard } from '../core/upgrades';

export interface HudState {
  health: number;
  maxHealth: number;
  level: number;
  experience: number;
  experienceToNext: number;
  elapsedSeconds: number;
  kills: number;
  score: number;
  wave: number;
  bossHealth?: number;
  bossMaxHealth?: number;
  bossName?: string;
}

export class UIOverlayScene extends Phaser.Scene {
  private hudItems: Array<Phaser.GameObjects.GameObject & { visible: boolean }> = [];
  private pauseItems: Array<Phaser.GameObjects.GameObject & { visible: boolean }> = [];
  private upgradeItems: Array<Phaser.GameObjects.GameObject & { visible: boolean }> = [];
  private healthText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private killsText!: Phaser.GameObjects.Text;
  private scoreText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private xpBar!: Phaser.GameObjects.Rectangle;
  private xpBarWidth = 200;
  private bossBar!: Phaser.GameObjects.Rectangle;
  private bossText!: Phaser.GameObjects.Text;
  private upgradeButtons: Phaser.GameObjects.Text[] = [];
  private upgradeCards: UpgradeCard[] = [];
  private rerollButton!: Phaser.GameObjects.Text;
  private toastText!: Phaser.GameObjects.Text;
  private toastRemainingMs = 0;
  private mode: 'hud' | 'pause' | 'upgrade' = 'hud';
  private readonly handleKeyboardResume = (): void => {
    this.resumeGame();
  };

  constructor() {
    super('UIOverlay');
  }

  create(): void {
    this.hudItems = [];
    this.pauseItems = [];
    this.upgradeItems = [];
    this.upgradeButtons = [];
    this.upgradeCards = [];
    this.toastRemainingMs = 0;
    this.mode = 'hud';
    this.input.setTopOnly(false);
    this.createHud();
    this.createPausePanel();
    this.createUpgradePanel();
    this.toastText = this.add
      .text(600, 156, '', {
        fontFamily: 'DM Mono, monospace',
        fontSize: '14px',
        color: '#ffc76b',
        backgroundColor: '#10232b',
        padding: { left: 16, right: 16, top: 10, bottom: 10 },
      })
      .setOrigin(0.5)
      .setDepth(125)
      .setScrollFactor(0)
      .setVisible(false);
    this.game.events.on('hud:update', this.updateHud, this);
    this.game.events.on('overlay:pause', this.showPause, this);
    this.game.events.on('overlay:auto-pause', this.showPause, this);
    this.game.events.on('overlay:keyboard-resume', this.handleKeyboardResume);
    this.game.events.on('overlay:upgrade', this.showUpgrade, this);
    this.game.events.on('overlay:complete', this.completeUpgrade, this);
    this.game.events.on('toast:show', this.showToast, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.removeListeners, this);
  }

  update(_time: number, delta: number): void {
    if (this.toastRemainingMs <= 0) return;
    this.toastRemainingMs -= delta;
    this.toastText.setAlpha(Math.min(1, this.toastRemainingMs / 350));
    if (this.toastRemainingMs <= 0) this.toastText.setVisible(false);
  }

  private createHud(): void {
    const panel = this.add
      .rectangle(600, 38, 1_140, 58, 0x071116, 0.8)
      .setStrokeStyle(1, 0x8fffd4, 0.18)
      .setScrollFactor(0)
      .setDepth(60);
    this.hudItems.push(panel);
    this.healthText = this.hudText(42, 20, 'HULL  100 / 100', '#ff8a7d');
    this.levelText = this.hudText(285, 20, 'LV 01', '#45d6dc');
    this.timerText = this.hudText(445, 20, '00:00', '#e9f4ee');
    this.killsText = this.hudText(650, 20, 'KILLS 0000', '#e9f4ee');
    this.scoreText = this.hudText(865, 20, 'ENERGY 000000', '#ffc76b');
    this.waveText = this.hudText(1_075, 20, 'WAVE 01', '#8fffd4');
    this.hudItems.push(
      this.healthText,
      this.levelText,
      this.timerText,
      this.killsText,
      this.scoreText,
      this.waveText,
    );
    this.add
      .rectangle(285, 55, this.xpBarWidth, 4, 0x183b42)
      .setOrigin(0, 0.5)
      .setDepth(61)
      .setScrollFactor(0);
    this.xpBar = this.add
      .rectangle(285, 55, 0, 4, 0x45d6dc)
      .setOrigin(0, 0.5)
      .setDepth(62)
      .setScrollFactor(0);
    this.hudItems.push(this.xpBar);
    this.bossText = this.add
      .text(600, 94, '', {
        fontFamily: 'DM Mono, monospace',
        fontSize: '12px',
        color: '#ff8a7d',
      })
      .setOrigin(0.5)
      .setDepth(61)
      .setScrollFactor(0)
      .setVisible(false);
    this.bossBar = this.add
      .rectangle(600, 118, 0, 7, 0xff6e67)
      .setOrigin(0.5)
      .setDepth(61)
      .setScrollFactor(0);
    this.hudItems.push(this.bossText, this.bossBar);

    const pause = this.add
      .text(1_156, 26, 'Ⅱ', {
        fontFamily: 'DM Mono, monospace',
        fontSize: '22px',
        color: '#e9f4ee',
        backgroundColor: '#173039',
        padding: { left: 10, right: 10, top: 4, bottom: 4 },
      })
      .setDepth(80)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });
    pause.on('pointerdown', () => this.showPause());
    this.hudItems.push(pause);
  }

  private createPausePanel(): void {
    const shade = this.add
      .rectangle(600, 360, 1_200, 720, 0x050b0f, 0.82)
      .setDepth(100)
      .setVisible(false);
    const title = this.add
      .text(600, 265, 'RUN PAUSED', {
        fontFamily: 'Barlow Condensed, sans-serif',
        fontSize: '64px',
        color: '#e9f4ee',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(101)
      .setVisible(false);
    const resume = this.add
      .text(600, 370, 'RESUME RUN', {
        fontFamily: 'DM Mono, monospace',
        fontSize: '16px',
        color: '#081116',
        backgroundColor: '#8fffd4',
        padding: { left: 24, right: 24, top: 14, bottom: 14 },
      })
      .setOrigin(0.5)
      .setDepth(101)
      .setInteractive({ useHandCursor: true })
      .setVisible(false);
    resume.on('pointerdown', () => this.resumeGame());
    const restart = this.add
      .text(600, 445, 'RESTART RUN', {
        fontFamily: 'DM Mono, monospace',
        fontSize: '13px',
        color: '#a9bbb4',
      })
      .setOrigin(0.5)
      .setDepth(101)
      .setInteractive({ useHandCursor: true })
      .setVisible(false);
    restart.on('pointerdown', () => {
      this.game.events.emit('audio:sfx', 'ui');
      this.game.events.emit('run:restart');
    });
    this.pauseItems.push(shade, title, resume, restart);
  }

  private createUpgradePanel(): void {
    const shade = this.add
      .rectangle(600, 360, 1_200, 720, 0x050b0f, 0.86)
      .setDepth(110)
      .setVisible(false);
    const title = this.add
      .text(600, 235, 'SYSTEM UPGRADE', {
        fontFamily: 'Barlow Condensed, sans-serif',
        fontSize: '56px',
        color: '#e9f4ee',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(111)
      .setVisible(false);
    const subtitle = this.add
      .text(600, 287, 'CHOOSE ONE MODULE', {
        fontFamily: 'DM Mono, monospace',
        fontSize: '11px',
        color: '#8fffd4',
      })
      .setOrigin(0.5)
      .setDepth(111)
      .setVisible(false);
    this.upgradeItems.push(shade, title, subtitle);
    for (let index = 0; index < 3; index += 1) {
      const card = this.add
        .text(600, 355 + index * 76, '', {
          fontFamily: 'DM Mono, monospace',
          fontSize: '13px',
          color: '#e9f4ee',
          backgroundColor: '#10232b',
          padding: { left: 20, right: 20, top: 14, bottom: 14 },
          align: 'center',
          fixedWidth: 540,
        })
        .setOrigin(0.5)
        .setDepth(112)
        .setInteractive({ useHandCursor: true })
        .setVisible(false);
      const choiceIndex = index;
      card.on('pointerdown', () => this.chooseUpgrade(choiceIndex));
      this.upgradeButtons.push(card);
      this.upgradeItems.push(card);
    }
    this.rerollButton = this.add
      .text(600, 604, '', {
        fontFamily: 'DM Mono, monospace',
        fontSize: '11px',
        color: '#ffc76b',
        backgroundColor: '#10232b',
        padding: { left: 16, right: 16, top: 10, bottom: 10 },
      })
      .setOrigin(0.5)
      .setDepth(112)
      .setInteractive({ useHandCursor: true })
      .setVisible(false);
    this.rerollButton.on('pointerdown', () => {
      this.game.events.emit('audio:sfx', 'ui');
      this.game.events.emit('upgrade:reroll');
    });
    this.upgradeItems.push(this.rerollButton);
  }

  private hudText(
    x: number,
    y: number,
    text: string,
    color: string,
  ): Phaser.GameObjects.Text {
    return this.add
      .text(x, y, text, {
        fontFamily: 'DM Mono, monospace',
        fontSize: '12px',
        color,
      })
      .setDepth(61)
      .setScrollFactor(0);
  }

  private updateHud(state: HudState): void {
    this.healthText.setText(`HULL  ${Math.ceil(state.health)} / ${state.maxHealth}`);
    this.levelText.setText(`LV ${String(state.level).padStart(2, '0')}`);
    this.timerText.setText(this.formatTime(state.elapsedSeconds));
    this.killsText.setText(`KILLS ${String(state.kills).padStart(4, '0')}`);
    this.scoreText.setText(`ENERGY ${String(state.score).padStart(6, '0')}`);
    this.waveText.setText(`WAVE ${String(state.wave).padStart(2, '0')}`);
    this.xpBar.width =
      this.xpBarWidth * Math.min(1, state.experience / state.experienceToNext);
    const bossVisible =
      state.bossHealth !== undefined && state.bossMaxHealth !== undefined;
    this.bossText.setVisible(bossVisible);
    this.bossBar.setVisible(bossVisible);
    if (bossVisible) {
      this.bossText.setText(state.bossName ?? 'HOSTILE SIGNATURE');
      this.bossBar.width = 420 * Math.max(0, state.bossHealth! / state.bossMaxHealth!);
    }
  }

  private showPause(): void {
    if (this.mode !== 'hud') return;
    this.game.events.emit('audio:sfx', 'ui');
    this.game.events.emit('run:pause-state', true);
    this.mode = 'pause';
    this.setVisible(this.hudItems, false);
    this.setVisible(this.pauseItems, true);
    this.scene.pause('Game');
  }

  private showUpgrade(cards: UpgradeCard[], rerollsRemaining = 0): void {
    this.mode = 'upgrade';
    this.upgradeCards = cards;
    this.setVisible(this.hudItems, false);
    this.setVisible(this.upgradeItems, true);
    this.rerollButton
      .setText(`REROLL  ${rerollsRemaining} LEFT`)
      .setVisible(rerollsRemaining > 0);
    for (let index = 0; index < this.upgradeButtons.length; index += 1) {
      const card = cards[index];
      const button = this.upgradeButtons[index]!;
      button.setVisible(card !== undefined);
      if (card) button.setText(`${card.name.toUpperCase()}\n${card.description}`);
    }
    this.scene.pause('Game');
  }

  private chooseUpgrade(index: number): void {
    const card = this.upgradeCards[index];
    if (!card) return;
    this.game.events.emit('upgrade:selected', card);
  }

  private resumeGame(): void {
    if (this.mode !== 'pause') return;
    this.game.events.emit('audio:sfx', 'ui');
    this.mode = 'hud';
    this.game.events.emit('run:pause-state', false);
    this.setVisible(this.pauseItems, false);
    this.setVisible(this.hudItems, true);
    this.scene.resume('Game');
  }

  private completeUpgrade(): void {
    if (this.mode !== 'upgrade') return;
    this.mode = 'hud';
    this.setVisible(this.upgradeItems, false);
    this.setVisible(this.hudItems, true);
    this.scene.resume('Game');
  }

  private showToast(message: string): void {
    this.toastText.setText(message).setAlpha(1).setVisible(true);
    this.toastRemainingMs = 2_800;
  }

  private setVisible(
    items: Array<Phaser.GameObjects.GameObject & { visible: boolean }>,
    visible: boolean,
  ): void {
    for (const item of items) item.visible = visible;
  }

  private formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainder = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  }

  private removeListeners(): void {
    this.game.events.off('hud:update', this.updateHud, this);
    this.game.events.off('overlay:pause', this.showPause, this);
    this.game.events.off('overlay:auto-pause', this.showPause, this);
    this.game.events.off('overlay:keyboard-resume', this.handleKeyboardResume);
    this.game.events.off('overlay:upgrade', this.showUpgrade, this);
    this.game.events.off('overlay:complete', this.completeUpgrade, this);
    this.game.events.off('toast:show', this.showToast, this);
  }
}
