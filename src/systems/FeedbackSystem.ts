import Phaser from 'phaser';
import { BALANCE } from '../data/balance';
import type { RandomSource } from '../core/rng';
import { ParticleEntity } from '../entities/ParticleEntity';
import { ObjectPool } from './ObjectPool';

interface FloatingNumber {
  text: Phaser.GameObjects.Text;
  lifeMs: number;
  maxLifeMs: number;
  velocityY: number;
}

export class FeedbackSystem {
  private readonly particles: ObjectPool<ParticleEntity>;
  private readonly activeNumbers: FloatingNumber[] = [];
  private readonly freeNumbers: Phaser.GameObjects.Text[] = [];
  private allocatedNumbers = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly random: RandomSource,
  ) {
    this.particles = new ObjectPool(
      () => new ParticleEntity(scene),
      BALANCE.limits.particlePool,
    );
  }

  damageNumber(x: number, y: number, damage: number, critical: boolean): void {
    let text = this.freeNumbers.pop();
    if (!text && this.allocatedNumbers < BALANCE.limits.damageNumberPool) {
      text = this.scene.add
        .text(0, 0, '', {
          fontFamily: 'DM Mono, monospace',
          fontSize: '15px',
          color: '#ffffff',
          stroke: '#081116',
          strokeThickness: 4,
        })
        .setOrigin(0.5)
        .setDepth(70);
      this.allocatedNumbers += 1;
    }
    if (!text) return;
    text
      .setText(`${critical ? '✦ ' : ''}${Math.round(damage)}`)
      .setPosition(x, y)
      .setScale(critical ? 1.3 : 1)
      .setAlpha(1)
      .setColor(critical ? '#ffe090' : '#f5f9f6')
      .setVisible(true);
    this.activeNumbers.push({ text, lifeMs: 700, maxLifeMs: 700, velocityY: -32 });
  }

  burst(x: number, y: number, color: number, count: number): void {
    for (let index = 0; index < count; index += 1) {
      const particle = this.particles.acquire();
      if (!particle) break;
      const angle = (index / count) * Math.PI * 2 + this.random.next() * 0.24;
      const speed = 40 + this.random.next() * 150;
      particle.launch(
        x,
        y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        280 + (index % 5) * 60,
        color,
      );
    }
  }

  update(deltaMs: number): void {
    const deltaSeconds = deltaMs / 1_000;
    for (let index = 0; index < this.activeNumbers.length; index += 1) {
      const number = this.activeNumbers[index]!;
      number.lifeMs -= deltaMs;
      number.text.y += number.velocityY * deltaSeconds;
      number.text.setAlpha(Math.max(0, number.lifeMs / number.maxLifeMs));
      if (number.lifeMs > 0) continue;
      number.text.setVisible(false);
      this.freeNumbers.push(number.text);
      this.activeNumbers[index] = this.activeNumbers[this.activeNumbers.length - 1]!;
      this.activeNumbers.pop();
      index -= 1;
    }
    for (let index = 0; index < this.particles.active.length; index += 1) {
      const particle = this.particles.active[index]!;
      particle.lifeMs -= deltaMs;
      particle.x += particle.velocityX * deltaSeconds;
      particle.y += particle.velocityY * deltaSeconds;
      particle.velocityX *= 0.965;
      particle.velocityY *= 0.965;
      particle.setAlpha(Math.max(0, particle.lifeMs / particle.maxLifeMs));
      if (particle.lifeMs > 0) continue;
      this.particles.release(particle);
      index -= 1;
    }
  }

  destroy(): void {
    this.particles.destroy();
    this.activeNumbers.forEach((number) => number.text.destroy());
    this.freeNumbers.forEach((text) => text.destroy());
    this.activeNumbers.length = 0;
    this.freeNumbers.length = 0;
  }
}
