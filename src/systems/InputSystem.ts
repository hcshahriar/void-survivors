import Phaser from 'phaser';
import type { AimMode } from '../core/save';

export interface PlayerInput {
  x: number;
  y: number;
  pause: boolean;
  aimAngle: number;
  fire: boolean;
}

export class InputSystem {
  readonly frame: PlayerInput = { x: 0, y: 0, pause: false, aimAngle: 0, fire: false };
  private readonly keys: Record<string, Phaser.Input.Keyboard.Key>;
  private readonly movementBase: Phaser.GameObjects.Image;
  private readonly movementKnob: Phaser.GameObjects.Image;
  private readonly aimBase: Phaser.GameObjects.Image;
  private readonly aimKnob: Phaser.GameObjects.Image;
  private pointerId: number | null = null;
  private aimPointerId: number | null = null;
  private originX = 0;
  private originY = 0;
  private aimOriginX = 0;
  private aimOriginY = 0;
  private touchX = 0;
  private touchY = 0;
  private touchAimX = 1;
  private touchAimY = 0;
  private aimMode: AimMode = 'auto';

  constructor(private readonly scene: Phaser.Scene) {
    const keyboard = scene.input.keyboard!;
    this.keys = keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      arrowUp: Phaser.Input.Keyboard.KeyCodes.UP,
      arrowLeft: Phaser.Input.Keyboard.KeyCodes.LEFT,
      arrowDown: Phaser.Input.Keyboard.KeyCodes.DOWN,
      arrowRight: Phaser.Input.Keyboard.KeyCodes.RIGHT,
    }) as Record<string, Phaser.Input.Keyboard.Key>;
    this.movementBase = scene.add
      .image(0, 0, 'joystick-ring')
      .setDepth(80)
      .setScrollFactor(0)
      .setVisible(false);
    this.movementKnob = scene.add
      .image(0, 0, 'joystick-knob')
      .setDepth(81)
      .setScrollFactor(0)
      .setVisible(false);
    this.aimBase = scene.add
      .image(0, 0, 'joystick-ring')
      .setDepth(80)
      .setScrollFactor(0)
      .setVisible(false);
    this.aimKnob = scene.add
      .image(0, 0, 'joystick-knob')
      .setDepth(81)
      .setScrollFactor(0)
      .setVisible(false);
    scene.input.on('pointerdown', this.onPointerDown, this);
    scene.input.on('pointermove', this.onPointerMove, this);
    scene.input.on('pointerup', this.onPointerUp, this);
    scene.input.on('pointerupoutside', this.onPointerUp, this);
  }

  setAimMode(mode: AimMode): void {
    this.aimMode = mode;
  }

  update(playerX: number, playerY: number): PlayerInput {
    let x =
      Number(this.keys.right.isDown || this.keys.arrowRight.isDown) -
      Number(this.keys.left.isDown || this.keys.arrowLeft.isDown);
    let y =
      Number(this.keys.down.isDown || this.keys.arrowDown.isDown) -
      Number(this.keys.up.isDown || this.keys.arrowUp.isDown);
    const pad = this.scene.input.gamepad?.getPad(0);
    if (pad) {
      x += Math.abs(pad.leftStick.x) > 0.18 ? pad.leftStick.x : 0;
      y += Math.abs(pad.leftStick.y) > 0.18 ? pad.leftStick.y : 0;
      const pauseDown = pad.buttons[9]?.pressed ?? false;
      this.frame.pause = pauseDown && !this.pauseWasDown;
      this.pauseWasDown = pauseDown;
    }
    x += this.touchX;
    y += this.touchY;
    const length = Math.hypot(x, y);
    const scale = length > 1 ? 1 / length : 1;
    this.frame.x = x * scale;
    this.frame.y = y * scale;
    if (this.aimMode === 'manual') {
      if (this.aimPointerId !== null) {
        this.frame.aimAngle = Math.atan2(this.touchAimY, this.touchAimX);
        this.frame.fire = true;
      } else {
        const pointer = this.scene.input.mousePointer;
        this.frame.aimAngle = Phaser.Math.Angle.Between(
          playerX,
          playerY,
          pointer.worldX,
          pointer.worldY,
        );
        this.frame.fire = !pointer.wasTouch && pointer.isDown;
      }
    } else {
      this.frame.fire = false;
    }
    return this.frame;
  }
  private pauseWasDown = false;

  clearPause(): void {
    this.frame.pause = false;
  }

  destroy(): void {
    this.scene.input.off('pointerdown', this.onPointerDown, this);
    this.scene.input.off('pointermove', this.onPointerMove, this);
    this.scene.input.off('pointerup', this.onPointerUp, this);
    this.scene.input.off('pointerupoutside', this.onPointerUp, this);
    this.movementBase.destroy();
    this.movementKnob.destroy();
    this.aimBase.destroy();
    this.aimKnob.destroy();
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (!pointer.wasTouch) return;
    if (pointer.x < this.scene.scale.width * 0.68 && this.pointerId === null) {
      this.pointerId = pointer.id;
      this.originX = pointer.x;
      this.originY = pointer.y;
      this.movementBase.setPosition(pointer.x, pointer.y).setVisible(true);
      this.movementKnob.setPosition(pointer.x, pointer.y).setVisible(true);
      this.updateTouch(pointer.x, pointer.y);
    } else if (
      this.aimMode === 'manual' &&
      pointer.x > this.scene.scale.width * 0.72 &&
      this.aimPointerId === null
    ) {
      this.aimPointerId = pointer.id;
      this.aimOriginX = pointer.x;
      this.aimOriginY = pointer.y;
      this.aimBase.setPosition(pointer.x, pointer.y).setVisible(true);
      this.aimKnob.setPosition(pointer.x, pointer.y).setVisible(true);
      this.updateTouchAim(pointer.x, pointer.y);
    }
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (pointer.id === this.pointerId) this.updateTouch(pointer.x, pointer.y);
    if (pointer.id === this.aimPointerId) this.updateTouchAim(pointer.x, pointer.y);
  }

  private onPointerUp(pointer: Phaser.Input.Pointer): void {
    if (pointer.id === this.pointerId) {
      this.pointerId = null;
      this.touchX = 0;
      this.touchY = 0;
      this.movementBase.setVisible(false);
      this.movementKnob.setVisible(false);
    }
    if (pointer.id === this.aimPointerId) {
      this.aimPointerId = null;
      this.aimBase.setVisible(false);
      this.aimKnob.setVisible(false);
    }
  }

  private updateTouch(x: number, y: number): void {
    const deltaX = x - this.originX;
    const deltaY = y - this.originY;
    const length = Math.hypot(deltaX, deltaY);
    const radius = 34;
    const scale = length > radius ? radius / length : 1;
    this.movementKnob.setPosition(
      this.originX + deltaX * scale,
      this.originY + deltaY * scale,
    );
    this.touchX = (deltaX * scale) / radius;
    this.touchY = (deltaY * scale) / radius;
  }

  private updateTouchAim(x: number, y: number): void {
    const deltaX = x - this.aimOriginX;
    const deltaY = y - this.aimOriginY;
    const length = Math.hypot(deltaX, deltaY);
    const radius = 34;
    const scale = length > radius ? radius / length : 1;
    this.aimKnob.setPosition(
      this.aimOriginX + deltaX * scale,
      this.aimOriginY + deltaY * scale,
    );
    if (length > 5) {
      this.touchAimX = deltaX / length;
      this.touchAimY = deltaY / length;
    }
  }
}
