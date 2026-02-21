// src/renderer/GameRenderer.ts
import * as PIXI from 'pixi.js';
import { BattleSimulator } from '../game/engine/simulator';
import { BASE_STATS } from '../game/entities/shapes_dictionary';
import { ShapeSprite } from './ShapeSprite';
import { HUD } from './HUD';

export class GameRenderer {
  private app: PIXI.Application;

  constructor() {
    this.app = new PIXI.Application();
  }

  async init(container: HTMLElement) {
    await this.app.init({ width: 800, height: 600, backgroundColor: 0x1a1a2e });
    container.appendChild(this.app.canvas);
    this.startBattle();
  }

  private startBattle() {
    const triangleState = {
      id: 'tri', type: 'triangle' as const,
      stats: BASE_STATS.triangle,
      currentHp: BASE_STATS.triangle.hp,
      position: { x: 200, y: 300 },
      isStunned: false,
    };
    const squareState = {
      id: 'sq', type: 'square' as const,
      stats: BASE_STATS.square,
      currentHp: BASE_STATS.square.hp,
      position: { x: 600, y: 300 },
      isStunned: false,
    };

    const simulator = new BattleSimulator(triangleState, squareState, Date.now());
    const triSprite = new ShapeSprite(triangleState);
    const sqSprite = new ShapeSprite(squareState);
    const hud = new HUD();

    this.app.stage.addChild(triSprite.container, sqSprite.container, hud.container);

    this.app.ticker.add(() => {
      const state = simulator.update();
      const tri = state.shapes.find(s => s.id === 'tri')!;
      const sq = state.shapes.find(s => s.id === 'sq')!;

      hud.update(tri.currentHp, tri.stats.hp, sq.currentHp, sq.stats.hp, state.status);

      if (state.status !== 'running') {
        this.app.ticker.stop();
      }
    });
  }
}
