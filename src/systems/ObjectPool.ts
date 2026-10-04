import Phaser from 'phaser';

export class ObjectPool<T extends Phaser.GameObjects.Sprite> {
  readonly active: T[] = [];
  private readonly available: T[] = [];

  constructor(
    private readonly createObject: () => T,
    private readonly maximum: number,
  ) {}

  acquire(): T | null {
    let item = this.available.pop();
    if (!item && this.active.length + this.available.length < this.maximum)
      item = this.createObject();
    if (!item) return null;
    item.setActive(true).setVisible(true);
    this.active.push(item);
    return item;
  }

  release(item: T): void {
    const index = this.active.indexOf(item);
    if (index < 0) return;
    this.active[index] = this.active[this.active.length - 1]!;
    this.active.pop();
    item.setActive(false).setVisible(false);
    this.available.push(item);
  }

  releaseAll(): void {
    while (this.active.length > 0) this.release(this.active[this.active.length - 1]!);
  }

  destroy(): void {
    this.releaseAll();
    this.available.forEach((item) => item.destroy());
    this.available.length = 0;
  }
}
