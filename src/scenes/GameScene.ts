import Phaser from 'phaser';
import { addLeaderboardEntry } from '../core/leaderboard';
import { completedAchievements } from '../core/achievements';
import { experienceForLevel } from '../core/progression';
import { availableEvolutions, evolveWeapon } from '../core/upgrades';
import { loadSave, writeSave, type AimMode } from '../core/save';
import {
  applyUpgrade,
  chooseUpgradeCards,
  type UpgradeCard,
  type UpgradeLevels,
} from '../core/upgrades';
import { shardsEarned } from '../core/meta';
import { BALANCE } from '../data/balance';
import {
  ACHIEVEMENTS,
  BOSSES,
  ENEMIES,
  EVOLUTIONS,
  PASSIVES,
  SHIPS,
  WEAPONS,
  type PassiveId,
} from '../data/content';
import { EnemyEntity } from '../entities/EnemyEntity';
import { ExperienceGem } from '../entities/ExperienceGem';
import { TreasureChest } from '../entities/TreasureChest';
import { PlayerEntity } from '../entities/PlayerEntity';
import { ProjectileEntity } from '../entities/ProjectileEntity';
import { CombatSystem } from '../systems/CombatSystem';
import { BossSystem } from '../systems/BossSystem';
import { EnemySystem } from '../systems/EnemySystem';
import { FeedbackSystem } from '../systems/FeedbackSystem';
import { InputSystem } from '../systems/InputSystem';
import { ObjectPool } from '../systems/ObjectPool';
import { ProgressionSystem } from '../systems/ProgressionSystem';
import { WaveSystem } from '../systems/WaveSystem';
import { WeaponSystem } from '../systems/WeaponSystem';
import type { RunResult } from './GameOverScene';
import type { HudState } from './UIOverlayScene';
import { browserStorage } from '../utils/browserStorage';

const SHIP_TEXTURES: Record<string, string> = {
  scout: 'ship-scout',
  bulwark: 'ship-bulwark',
  phantom: 'ship-phantom',
};

export class GameScene extends Phaser.Scene {
  private player!: PlayerEntity;
  private background!: Phaser.GameObjects.TileSprite;
  private farBackground!: Phaser.GameObjects.TileSprite;
  private inputSystem!: InputSystem;
  private enemies!: ObjectPool<EnemyEntity>;
  private projectiles!: ObjectPool<ProjectileEntity>;
  private gems!: ObjectPool<ExperienceGem>;
  private chests!: ObjectPool<TreasureChest>;
  private wave!: WaveSystem;
  private combat!: CombatSystem;
  private enemySystem!: EnemySystem;
  private weapons!: WeaponSystem;
  private progression!: ProgressionSystem;
  private bossSystem!: BossSystem;
  private feedback!: FeedbackSystem;
  private droneSprites!: Phaser.GameObjects.Arc[];
  private hudElapsed = 0;
  private score = 0;
  private aimMode: AimMode = 'auto';
  private queuedLevelUps = 0;
  private rerollsRemaining = 0;
  private hitElapsed = 10_000;
  private defeatedBosses = 0;
  private activeBoss: EnemyEntity | null = null;
  private fpsText!: Phaser.GameObjects.Text;
  private screenShake = true;
  private showFps = false;
  private achievementElapsed = 0;
  private fpsElapsed = 0;
  private lastMusicWave = 0;
  private lifetimePurchases = 0;
  private readonly achievementIds = new Set<string>();
  private readonly upgradePool: UpgradeCard[] = [
    ...WEAPONS.map((weapon) => ({
      id: weapon.id,
      kind: 'weapon' as const,
      name: weapon.name,
      description: weapon.description,
      maxLevel: weapon.maxLevel,
    })),
    ...PASSIVES.map((passive) => ({
      id: passive.id,
      kind: 'passive' as const,
      name: passive.name,
      description: passive.description,
      maxLevel: passive.maxLevel,
    })),
  ];

  constructor() {
    super('Game');
  }

  create(): void {
    this.score = 0;
    this.queuedLevelUps = 0;
    this.hudElapsed = 0;
    this.hitElapsed = 10_000;
    this.defeatedBosses = 0;
    this.activeBoss = null;
    this.farBackground = this.add
      .tileSprite(0, 0, this.scale.width, this.scale.height, 'starfield')
      .setOrigin(0)
      .setAlpha(0.12)
      .setDepth(-21)
      .setScrollFactor(0);
    this.background = this.add
      .tileSprite(0, 0, this.scale.width, this.scale.height, 'starfield')
      .setOrigin(0)
      .setAlpha(0.5)
      .setDepth(-20)
      .setScrollFactor(0);
    this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, 0x081116, 0.48)
      .setOrigin(0)
      .setDepth(-19)
      .setScrollFactor(0);
    this.player = new PlayerEntity(this);
    this.enemies = new ObjectPool(() => new EnemyEntity(this), BALANCE.run.enemyCap);
    this.projectiles = new ObjectPool(
      () => new ProjectileEntity(this),
      BALANCE.limits.projectilePool,
    );
    this.gems = new ObjectPool(() => new ExperienceGem(this), 450);
    this.chests = new ObjectPool(() => new TreasureChest(this), 8);
    this.inputSystem = new InputSystem(this);
    this.wave = new WaveSystem(
      this,
      Date.now() ^ Math.floor(Math.random() * 0xffff),
      this.enemies,
    );
    this.feedback = new FeedbackSystem(this, this.wave.random);
    this.bossSystem = new BossSystem(this, this.projectiles, this.wave.random, (boss) =>
      this.spawnBossMinions(boss),
    );
    this.droneSprites = Array.from({ length: 4 }, () =>
      this.add
        .circle(0, 0, 7, 0x45d6dc)
        .setStrokeStyle(2, 0xcafff1)
        .setDepth(18)
        .setVisible(false),
    );
    this.combat = new CombatSystem(
      this.enemies,
      this.projectiles,
      this.wave.random,
      (enemy) => this.onEnemyDefeated(enemy),
      (damage) => this.damagePlayer(damage),
      (enemy, damage, critical) =>
        this.feedback.damageNumber(enemy.x, enemy.y, damage, critical),
    );
    this.enemySystem = new EnemySystem(
      this.enemies,
      this.projectiles,
      (damage) => this.damagePlayer(damage),
      () => this.game.events.emit('audio:sfx', 'weapon'),
      (enemy) => this.onEnemyDefeated(enemy),
    );
    this.weapons = new WeaponSystem(
      this,
      this.enemies,
      this.projectiles,
      (enemy, damage) => this.combat.hitEnemy(enemy, damage, this.player),
      this.droneSprites,
      () => this.game.events.emit('audio:sfx', 'weapon'),
    );
    this.progression = new ProgressionSystem(this.gems, (value) => {
      this.score += 25 * value;
      this.publishHud();
    });

    const save = loadSave(browserStorage);
    this.aimMode = save.settings.aimMode;
    this.inputSystem.setAimMode(this.aimMode);
    this.screenShake = save.settings.screenShake;
    this.showFps = save.settings.showFps;
    this.lifetimePurchases = save.stats.totalPurchases;
    this.rerollsRemaining = save.permanentLevels.rerolls ?? 0;
    this.score =
      (save.permanentLevels['starting-shards'] ?? 0) *
      BALANCE.meta.startingRunScorePerLevel;
    this.wave.colorblind = save.settings.colorblind;
    this.achievementIds.clear();
    for (const id of save.achievements) this.achievementIds.add(id);
    const ship = SHIPS.find((item) => item.id === save.selectedShip) ?? SHIPS[0]!;
    this.player.resetRun(SHIP_TEXTURES[ship.id] ?? 'ship-scout', ship.health, ship.speed);
    const permanentHealth = (save.permanentLevels['max-health'] ?? 0) * 8;
    this.player.maxHealth += permanentHealth;
    this.player.health = this.player.maxHealth;
    this.player.setPosition(this.scale.width / 2, this.scale.height / 2);
    this.fpsText = this.add
      .text(1_155, 150, '', {
        fontFamily: 'DM Mono, monospace',
        fontSize: '10px',
        color: '#8fffd4',
      })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(90)
      .setVisible(this.showFps);

    this.game.events.on('upgrade:selected', this.applyUpgrade, this);
    this.game.events.on('upgrade:reroll', this.rerollUpgrades, this);
    this.game.events.on('run:restart', this.restartRun, this);
    this.scale.on(Phaser.Scale.Events.RESIZE, this.resizeWorld, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
    this.scene.launch('UIOverlay');
    this.game.events.emit('run:pause-state', false);
    this.game.events.emit('audio:wave', 1);
    this.publishHud();
  }

  update(_time: number, delta: number): void {
    const deltaMs = Math.min(delta, 40);
    const deltaSeconds = deltaMs / 1_000;
    this.hitElapsed += deltaMs;
    this.player.invulnerabilityMs = Math.max(0, this.player.invulnerabilityMs - deltaMs);
    this.background.tilePositionY -= deltaMs * 0.008;
    this.farBackground.tilePositionY -= deltaMs * 0.002;

    const input = this.inputSystem.update(this.player.x, this.player.y);
    if (input.pause) {
      this.inputSystem.clearPause();
      this.game.events.emit('overlay:pause');
      return;
    }
    const length = Math.hypot(input.x, input.y) || 1;
    const speed = this.player.speed;
    this.player.x = Phaser.Math.Clamp(
      this.player.x + (input.x / length) * speed * deltaSeconds,
      20,
      this.scale.width - 20,
    );
    this.player.y = Phaser.Math.Clamp(
      this.player.y + (input.y / length) * speed * deltaSeconds,
      20,
      this.scale.height - 20,
    );
    if (this.aimMode === 'manual') {
      this.player.rotation = input.aimAngle + Math.PI / 2;
    } else if (input.x !== 0 || input.y !== 0) {
      this.player.rotation = Math.atan2(input.y, input.x) + Math.PI / 2;
    }
    this.player.setAlpha(
      this.player.invulnerabilityMs > 0 && Math.floor(this.hitElapsed / 80) % 2 === 0
        ? 0.45
        : 1,
    );

    this.wave.update(deltaMs);
    this.enemySystem.update(deltaMs, this.player, this.scale.width, this.scale.height);
    this.combat.update(deltaMs, this.player, this.scale.width, this.scale.height);
    this.weapons.update(deltaMs, this.player, {
      aimMode: this.aimMode,
      aimAngle: input.aimAngle,
      fireHeld: input.fire,
    });
    if (this.activeBoss?.active)
      this.bossSystem.update(deltaMs, this.activeBoss, this.player);
    this.updateChests(deltaSeconds);
    this.feedback.update(deltaMs);
    this.queuedLevelUps += this.progression.update(deltaMs, this.player);
    if (this.queuedLevelUps > 0) {
      this.showNextUpgrade();
      return;
    }

    this.hudElapsed += deltaMs;
    this.achievementElapsed += deltaMs;
    this.fpsElapsed += deltaMs;
    if (this.achievementElapsed >= 1_000) {
      this.achievementElapsed = 0;
      this.checkAchievements();
    }
    if (this.showFps && this.fpsElapsed >= 450) {
      this.fpsElapsed = 0;
      this.fpsText.setText(`${Math.round(this.game.loop.actualFps)} FPS`);
    }
    if (this.hudElapsed >= BALANCE.run.hudRefreshMs) {
      this.hudElapsed = 0;
      const wave = Math.floor(this.wave.elapsedSeconds / 60) + 1;
      if (wave !== this.lastMusicWave) {
        this.lastMusicWave = wave;
        this.game.events.emit('audio:wave', wave);
      }
      this.publishHud();
    }
    if (this.player.health <= 0) {
      this.finishRun(false);
      return;
    }
    this.checkBosses();
    if (
      this.wave.elapsedSeconds >= BALANCE.run.durationSeconds &&
      this.wave.spawnedBosses.has('singularity') &&
      !this.activeBoss
    ) {
      this.finishRun(true);
      return;
    }
  }

  private showNextUpgrade(): void {
    this.scene.pause();
    const levels: UpgradeLevels = {
      weapons: this.player.weaponLevels as UpgradeLevels['weapons'],
      passives: this.player.passiveLevels as UpgradeLevels['passives'],
      evolved: this.player.evolvedWeapons as UpgradeLevels['evolved'],
    };
    const seed = Math.floor(this.wave.random.next() * 0xffff_ffff);
    const cards = chooseUpgradeCards(this.upgradePool, levels, 3, seed);
    this.game.events.emit('overlay:upgrade', cards, this.rerollsRemaining);
  }

  private rerollUpgrades(): void {
    if (this.rerollsRemaining <= 0 || this.queuedLevelUps <= 0) return;
    this.rerollsRemaining -= 1;
    const levels: UpgradeLevels = {
      weapons: this.player.weaponLevels as UpgradeLevels['weapons'],
      passives: this.player.passiveLevels as UpgradeLevels['passives'],
      evolved: this.player.evolvedWeapons as UpgradeLevels['evolved'],
    };
    const seed = Math.floor(this.wave.random.next() * 0xffff_ffff);
    const cards = chooseUpgradeCards(this.upgradePool, levels, 3, seed);
    this.game.events.emit('overlay:upgrade', cards, this.rerollsRemaining);
  }

  private applyUpgrade(card: UpgradeCard): void {
    const levels: UpgradeLevels = {
      weapons: this.player.weaponLevels as UpgradeLevels['weapons'],
      passives: this.player.passiveLevels as UpgradeLevels['passives'],
      evolved: this.player.evolvedWeapons as UpgradeLevels['evolved'],
    };
    const next = applyUpgrade(levels, card);
    this.player.weaponLevels = next.weapons;
    this.player.passiveLevels = next.passives;
    if (card.kind === 'passive') this.applyPassive(card.id as PassiveId);
    this.game.events.emit('audio:sfx', 'level-up');
    this.queuedLevelUps = Math.max(0, this.queuedLevelUps - 1);
    this.publishHud();
    if (this.queuedLevelUps > 0) this.showNextUpgrade();
    else this.game.events.emit('overlay:complete');
  }

  private applyPassive(id: PassiveId): void {
    if (id === 'hull') {
      this.player.maxHealth += 10;
      this.player.health = Math.min(this.player.maxHealth, this.player.health + 10);
    } else if (id === 'reactor') this.player.damageMultiplier += 0.1;
    else if (id === 'magnet') this.player.pickupRadius += 28;
    else if (id === 'targeting') this.player.criticalChance += 0.025;
    else if (id === 'thrusters') this.player.speed += 12;
    else if (id === 'armor')
      this.player.damageMultiplier = Math.max(0.55, this.player.damageMultiplier - 0.04);
  }

  private onEnemyDefeated(enemy: EnemyEntity): void {
    if (!enemy.active) return;
    const x = enemy.x;
    const y = enemy.y;
    const definition = enemy.definition;
    const reward = enemy.reward;
    const elite = enemy.elite;
    const boss = enemy.isBoss;
    this.player.kills += 1;
    this.game.events.emit('audio:sfx', 'enemy-down');
    this.score += definition.score * (elite ? 3 : 1);
    if (boss) this.defeatedBosses += 1;
    if (definition.id === 'splitter' && !boss) this.spawnSplitters(x, y);
    this.feedback.burst(
      x,
      y,
      boss ? 0xffc76b : elite ? 0xffd580 : 0xff6e67,
      boss ? 34 : elite ? 20 : 10,
    );
    if (boss) {
      this.chests.acquire()?.activate(x, y);
    } else if (elite || this.wave.random.next() < 0.72) {
      const gem = this.gems.acquire();
      gem?.activate(x, y, Math.max(1, reward));
    }
    if (boss) this.activeBoss = null;
    this.publishHud();
    this.enemies.release(enemy);
  }

  private updateChests(deltaSeconds: number): void {
    for (let index = 0; index < this.chests.active.length; index += 1) {
      const chest = this.chests.active[index]!;
      const distance = Phaser.Math.Distance.Between(
        chest.x,
        chest.y,
        this.player.x,
        this.player.y,
      );
      if (distance < this.player.pickupRadius + 45) {
        const angle = Phaser.Math.Angle.Between(
          chest.x,
          chest.y,
          this.player.x,
          this.player.y,
        );
        const speed = 125 + Math.max(0, 160 - distance) * 1.5;
        chest.x += Math.cos(angle) * speed * deltaSeconds;
        chest.y += Math.sin(angle) * speed * deltaSeconds;
      }
      if (distance >= 23) continue;
      this.openChest(chest.x, chest.y);
      this.chests.release(chest);
      index -= 1;
    }
  }

  private openChest(x: number, y: number): void {
    this.game.events.emit('audio:sfx', 'chest');
    const levels: UpgradeLevels = {
      weapons: this.player.weaponLevels as UpgradeLevels['weapons'],
      passives: this.player.passiveLevels as UpgradeLevels['passives'],
      evolved: this.player.evolvedWeapons as UpgradeLevels['evolved'],
    };
    const evolution = availableEvolutions(levels, EVOLUTIONS)[0];
    if (evolution) {
      this.player.evolvedWeapons = evolveWeapon(levels, evolution.weapon).evolved;
      this.score += 500;
      const content = EVOLUTIONS.find((item) => item.weapon === evolution.weapon);
      this.game.events.emit('toast:show', content?.name ?? 'WEAPON EVOLVED');
      this.feedback.burst(x, y, 0xffc76b, 28);
    } else {
      this.queuedLevelUps += 1;
      this.game.events.emit('toast:show', 'TREASURE CACHE // UPGRADE READY');
    }
    this.publishHud();
  }

  private spawnBossMinions(boss: EnemyEntity): void {
    const swarmer = ENEMIES.find((enemy) => enemy.id === 'swarmer');
    if (!swarmer) return;
    for (let index = 0; index < 5; index += 1) {
      const enemy = this.enemies.acquire();
      if (!enemy) break;
      const angle = (index / 5) * Math.PI * 2;
      enemy.activate(
        swarmer,
        boss.x + Math.cos(angle) * 68,
        boss.y + Math.sin(angle) * 68,
        1.2,
      );
    }
  }

  private spawnSplitters(x: number, y: number): void {
    const swarmer = ENEMIES.find((enemy) => enemy.id === 'swarmer');
    if (!swarmer) return;
    for (let index = 0; index < 3; index += 1) {
      const child = this.enemies.acquire();
      if (!child) break;
      const angle = (index / 3) * Math.PI * 2;
      child.activate(swarmer, x + Math.cos(angle) * 18, y + Math.sin(angle) * 18, 1);
      child.health *= 0.45;
      child.maxHealth = child.health;
      child.speed *= 1.18;
    }
  }

  private damagePlayer(damage: number): void {
    if (this.player.invulnerabilityMs > 0 || this.player.health <= 0) return;
    const armor = this.player.passiveLevels.armor ?? 0;
    this.player.health = Math.max(
      0,
      this.player.health - Math.max(1, damage * (1 - armor * 0.06)),
    );
    this.player.invulnerabilityMs = BALANCE.player.damageCooldownMs;
    this.hitElapsed = 0;
    this.player.setTintFill(0xff6e67);
    this.game.events.emit('audio:sfx', 'player-hit');
    if (this.screenShake) this.cameras.main.shake(120, 0.0035);
    this.feedback.burst(this.player.x, this.player.y, 0xff6e67, 8);
    this.time.delayedCall(100, () => this.player.clearTint());
    this.publishHud();
  }

  private checkBosses(): void {
    if (this.activeBoss) return;
    for (const boss of BOSSES) {
      if (
        this.wave.elapsedSeconds < boss.spawnSecond ||
        this.wave.spawnedBosses.has(boss.id)
      )
        continue;
      if (!this.spawnBoss(boss)) return;
      this.wave.markBossSpawned(boss.id);
      return;
    }
  }

  private spawnBoss(definition: (typeof BOSSES)[number]): boolean {
    if (this.enemies.active.length >= BALANCE.run.enemyCap) {
      const expendable = this.enemies.active.find((enemy) => !enemy.isBoss);
      if (expendable) this.enemies.release(expendable);
    }
    const boss = this.enemies.acquire();
    if (!boss) return false;
    const enemyDefinition = ENEMIES.find((enemy) => enemy.id === 'tank')!;
    boss.activate(enemyDefinition, this.scale.width / 2, -64, 1);
    boss.setTexture('boss').setScale(1.4).setTint(0xff7a73);
    boss.health = definition.health;
    boss.maxHealth = definition.health;
    boss.speed = 36;
    boss.damage = 30;
    boss.radius = 54;
    boss.isBoss = true;
    boss.bossId = definition.id;
    this.activeBoss = boss;
    this.game.events.emit('boss:spawn', definition.name);
    this.game.events.emit('audio:sfx', 'boss');
    this.publishHud();
    return true;
  }

  private publishHud(): void {
    const bossDefinition = this.activeBoss?.bossId
      ? BOSSES.find((boss) => boss.id === this.activeBoss?.bossId)
      : undefined;
    const state: HudState = {
      health: this.player?.health ?? 100,
      maxHealth: this.player?.maxHealth ?? 100,
      level: this.player?.level ?? 1,
      experience: this.player?.experience ?? 0,
      experienceToNext: experienceForLevel(this.player?.level ?? 1),
      elapsedSeconds: this.wave?.elapsedSeconds ?? 0,
      kills: this.player?.kills ?? 0,
      score: this.score,
      wave: this.wave ? Math.floor(this.wave.elapsedSeconds / 60) + 1 : 1,
      bossHealth: this.activeBoss?.health,
      bossMaxHealth: this.activeBoss?.maxHealth,
      bossName: bossDefinition?.name,
    };
    this.game.events.emit('hud:update', state);
  }

  private finishRun(victory: boolean): void {
    this.scene.stop('UIOverlay');
    const result: RunResult = {
      elapsedSeconds: this.wave.elapsedSeconds,
      score: this.score,
      kills: this.player.kills,
      victory,
    };
    const save = loadSave(browserStorage);
    save.stats.runs += 1;
    save.stats.totalKills += result.kills;
    save.stats.bestSeconds = Math.max(save.stats.bestSeconds, result.elapsedSeconds);
    save.stats.bestScore = Math.max(save.stats.bestScore, result.score);
    save.shards += shardsEarned(result.elapsedSeconds, this.defeatedBosses);
    const newAchievements = completedAchievements({
      elapsedSeconds: result.elapsedSeconds,
      kills: result.kills,
      level: this.player.level,
      bossesDefeated: this.defeatedBosses,
      maxWeapon: Object.values(this.player.weaponLevels).some((level) => level >= 5),
      evolvedWeapon: this.player.evolvedWeapons.length > 0,
      purchases: save.stats.totalPurchases,
    });
    save.achievements = [...new Set([...save.achievements, ...newAchievements])];
    save.leaderboard = addLeaderboardEntry(
      save.leaderboard,
      {
        name: 'PILOT',
        score: result.score,
        durationSeconds: result.elapsedSeconds,
        achievedAt: Date.now(),
      },
      BALANCE.limits.leaderboardEntries,
    );
    writeSave(browserStorage, save);
    this.scene.start('GameOver', result);
  }

  private restartRun(): void {
    this.game.events.emit('run:pause-state', false);
    this.scene.stop('UIOverlay');
    this.scene.start('Game');
  }

  private checkAchievements(): void {
    const completed = completedAchievements({
      elapsedSeconds: this.wave.elapsedSeconds,
      kills: this.player.kills,
      level: this.player.level,
      bossesDefeated: this.defeatedBosses,
      maxWeapon: Object.values(this.player.weaponLevels).some((level) => level >= 5),
      evolvedWeapon: this.player.evolvedWeapons.length > 0,
      purchases: this.lifetimePurchases,
    });
    for (const id of completed) {
      if (this.achievementIds.has(id)) continue;
      this.achievementIds.add(id);
      const achievement = ACHIEVEMENTS.find((item) => item.id === id);
      this.game.events.emit('toast:show', `COMMENDATION // ${achievement?.name ?? id}`);
    }
  }

  private resizeWorld(): void {
    this.background.setSize(this.scale.width, this.scale.height);
    this.farBackground.setSize(this.scale.width, this.scale.height);
  }

  private shutdown(): void {
    this.game.events.off('upgrade:selected', this.applyUpgrade, this);
    this.game.events.off('upgrade:reroll', this.rerollUpgrades, this);
    this.game.events.off('run:restart', this.restartRun, this);
    this.scale.off(Phaser.Scale.Events.RESIZE, this.resizeWorld, this);
    this.inputSystem.destroy();
    this.enemies.destroy();
    this.projectiles.destroy();
    this.gems.destroy();
    this.chests.destroy();
    this.feedback.destroy();
    this.droneSprites.forEach((sprite) => sprite.destroy());
  }
}
