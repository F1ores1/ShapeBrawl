// src/renderer/ShapeSprite.ts
import * as PIXI from 'pixi.js';
import type { ShapeState } from '../game/types';

export class ShapeSprite {
  public container: PIXI.Container;
  private graphic: PIXI.Graphics;

  constructor(state: ShapeState) {
    this.container = new PIXI.Container();
    this.graphic = new PIXI.Graphics();
    this.draw(state.type);
    this.container.addChild(this.graphic);
    this.container.x = state.position.x;
    this.container.y = state.position.y;
  }

  private draw(type: 'triangle' | 'square') {
    this.graphic.clear();
    if (type === 'triangle') {
      this.graphic.poly([0, -30, 30, 30, -30, 30]).fill(0xff4455);
    } else {
      this.graphic.rect(-30, -30, 60, 60).fill(0x4488ff);
    }
  }

  // Called each tick — position updates, later shake/flash animations go here
  public update(x: number, y: number) {
    this.container.x = x;
    this.container.y = y;
  }
}

