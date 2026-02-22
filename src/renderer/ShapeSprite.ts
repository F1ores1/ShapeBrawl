// src/renderer/ShapeSprite.ts
import * as PIXI from 'pixi.js';
import type { ShapeState } from '../game/types';

// ── Lunge phases (frames at 60fps) ──────────────────────────────────────────
const LUNGE_SNAP_FRAMES   = 7;   // fast forward snap  (power3.out feel)
const LUNGE_HANG_FRAMES   = 3;   // pause at impact
const LUNGE_RETURN_FRAMES = 11;  // slow drift back    (power2.inOut feel)
const LUNGE_DIST          = 55;  // px toward opponent at peak

// ── Hit reaction ─────────────────────────────────────────────────────────────
const SHAKE_DURATION = 8;  // frames of 2D random shake
const FLASH_FRAMES   = 12; // frames before tint fully fades back to white

// ── Easing helpers ───────────────────────────────────────────────────────────
function easeOutPower3(t: number): number { return 1 - Math.pow(1 - t, 3); }
function easeInOutPower2(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// ── Hex color lerp for tint fade ─────────────────────────────────────────────
function lerpColor(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
  const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
  const r  = Math.round(ar + (br - ar) * t);
  const g  = Math.round(ag + (bg - ag) * t);
  const b2 = Math.round(ab + (bb - ab) * t);
  return (r << 16) | (g << 8) | b2;
}

export class ShapeSprite {
  public container: PIXI.Container;
  private graphic: PIXI.Graphics;
  private shapeType: 'triangle' | 'square';

  private baseX: number;
  private baseY: number;
  private opponentBaseX: number = 0;

  // Lunge state machine
  private lungePhase: 'idle' | 'snap' | 'hang' | 'return' = 'idle';
  private lungePhaseT: number = 0;

  // Shake state
  private shakeFrames: number = 0;
  private shakeX: number = 0;
  private shakeY: number = 0;

  // Flash/tint state
  private flashT: number = 0;
  private flashColor: number = 0xffffff;

  constructor(state: ShapeState) {
    this.container = new PIXI.Container();
    this.graphic = new PIXI.Graphics();
    this.shapeType = state.type;
    this.draw(state.type);
    this.container.addChild(this.graphic);
    this.baseX = state.position.x;
    this.baseY = state.position.y;
    this.container.x = this.baseX;
    this.container.y = this.baseY;
  }

  private draw(type: 'triangle' | 'square') {
    this.graphic.clear();

    if (type === 'triangle') {
      // Probe/ship shape pointing RIGHT — wide swept wings, notched back, sharp nose
      const s = 60;
      this.graphic
        .poly([
           s * 0.7,  0,           // nose tip (right)
          -s * 0.5, -s * 0.55,   // top wing tip
          -s * 0.2,  0,           // center back notch
          -s * 0.5,  s * 0.55,   // bottom wing tip
        ])
        .fill({ color: 0xe63946 })
        .stroke({ width: 2.5, color: 0xffffff, alpha: 0.85 });

    } else {
      // Square with blue accent stroke for visual weight
      const half = 33;
      this.graphic
        .rect(-half, -half, half * 2, half * 2)
        .fill({ color: 0x1d3557 })
        .stroke({ width: 2.5, color: 0x4488ff, alpha: 0.9 });
    }
  }

  public setOpponentX(x: number): void {
    this.opponentBaseX = x;
    // Flip triangle so nose always faces opponent
    if (this.shapeType === 'triangle') {
      this.graphic.scale.x = x > this.baseX ? 1 : -1;
    }
  }

  // ── Triggers ────────────────────────────────────────────────────────────────

  public triggerAttack(): void {
    if (this.lungePhase === 'idle') {
      this.lungePhase = 'snap';
      this.lungePhaseT = 0;
    }
  }

  public triggerHit(isCrit: boolean): void {
    this.flashT = FLASH_FRAMES;
    this.flashColor = isCrit ? 0xff6600 : 0xffffff;
    this.shakeFrames = SHAKE_DURATION;
    this.rollShake();
  }

  // ── Per-frame tick ──────────────────────────────────────────────────────────

  public tick(delta: number): void {
    const direction = Math.sign(this.opponentBaseX - this.baseX);

    // Lunge state machine
    let lungeOffset = 0;
    if (this.lungePhase !== 'idle') {
      this.lungePhaseT += delta;

      if (this.lungePhase === 'snap') {
        const t = Math.min(this.lungePhaseT / LUNGE_SNAP_FRAMES, 1);
        lungeOffset = easeOutPower3(t) * LUNGE_DIST * direction;
        if (t >= 1) { this.lungePhase = 'hang'; this.lungePhaseT = 0; }

      } else if (this.lungePhase === 'hang') {
        lungeOffset = LUNGE_DIST * direction;
        if (this.lungePhaseT >= LUNGE_HANG_FRAMES) { this.lungePhase = 'return'; this.lungePhaseT = 0; }

      } else if (this.lungePhase === 'return') {
        const t = Math.min(this.lungePhaseT / LUNGE_RETURN_FRAMES, 1);
        lungeOffset = (1 - easeInOutPower2(t)) * LUNGE_DIST * direction;
        if (t >= 1) { this.lungePhase = 'idle'; this.lungePhaseT = 0; }
      }
    }

    // 2D random shake — re-rolls every ~2 frames so it rattles, not oscillates
    let shakeOffsetX = 0;
    let shakeOffsetY = 0;
    if (this.shakeFrames > 0) {
      this.shakeFrames = Math.max(0, this.shakeFrames - delta);
      shakeOffsetX = this.shakeX;
      shakeOffsetY = this.shakeY;
      if (Math.floor(this.shakeFrames) % 2 === 0) {
        this.rollShake();
      }
      if (this.shakeFrames <= 0) {
        this.shakeX = 0;
        this.shakeY = 0;
      }
    }

    // Flash tint — smoothly lerps from flashColor back to white
    if (this.flashT > 0) {
      this.flashT = Math.max(0, this.flashT - delta);
      const progress = this.flashT / FLASH_FRAMES; // 1 (full color) → 0 (white)
      this.container.tint = lerpColor(0xffffff, this.flashColor, progress);
    } else {
      this.container.tint = 0xffffff;
    }

    // Apply final position
    this.container.x = this.baseX + lungeOffset + shakeOffsetX;
    this.container.y = this.baseY + shakeOffsetY;
  }

  private rollShake(): void {
    const intensity = 11;
    this.shakeX = (Math.random() - 0.5) * intensity * 2;
    this.shakeY = (Math.random() - 0.5) * intensity * 2;
  }

  // Legacy — kept for compatibility
  public update(x: number, y: number) {
    this.container.x = x;
    this.container.y = y;
  }
}