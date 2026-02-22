import * as PIXI from 'pixi.js';
import { BattleSimulator } from '../game/engine/simulator';
import { BASE_STATS } from '../game/entities/shapes_dictionary';
import { ShapeSprite } from './ShapeSprite';
import { HUD } from './HUD';

export class GameRenderer {
  private app: PIXI.Application;
  private battleTicker: PIXI.Ticker | null = null;

  constructor() {
    this.app = new PIXI.Application();
  }

  async init(container: HTMLElement) {
    await this.app.init({ resizeTo: window, backgroundColor: 0x0d0d1a });
    container.appendChild(this.app.canvas);

    this.startBattle();
  }

  private startBattle() {
    const cx = this.app.screen.width;
    const cy = this.app.screen.height;

    const arenaW = Math.min(cx * 0.8, 900);
    const arenaH = arenaW * 0.625;
    const arenaX = (cx - arenaW) / 2;
    const arenaY = (cy - arenaH) / 2;

    const triX = arenaX + arenaW * 0.25;
    const sqX  = arenaX + arenaW * 0.75;
    const midY = arenaY + arenaH * 0.5;

    const border = new PIXI.Graphics();
    border.rect(arenaX, arenaY, arenaW, arenaH).stroke({ width: 2, color: 0x334466 });

    const triangleState = {
      id: 'tri', type: 'triangle' as const,
      stats: BASE_STATS.triangle,
      currentHp: BASE_STATS.triangle.hp,
      position: { x: triX, y: midY },
      isStunned: false,
    };
    const squareState = {
      id: 'sq', type: 'square' as const,
      stats: BASE_STATS.square,
      currentHp: BASE_STATS.square.hp,
      position: { x: sqX, y: midY },
      isStunned: false,
    };

    const simulator = new BattleSimulator(triangleState, squareState, Date.now());
    const triSprite = new ShapeSprite(triangleState);
    const sqSprite  = new ShapeSprite(squareState);

    // Wire up opponent positions for lunge direction
    triSprite.setOpponentX(sqX);
    sqSprite.setOpponentX(triX);

    const hud = new HUD(arenaX, arenaY, arenaW, arenaH, () => {
      this.runBattle(simulator, triSprite, sqSprite, hud);
    });

    this.app.stage.addChild(border, triSprite.container, sqSprite.container, hud.container);

    const state = simulator.getState();
    const tri = state.shapes.find(s => s.id === 'tri')!;
    const sq  = state.shapes.find(s => s.id === 'sq')!;
    hud.update(tri.currentHp, tri.stats.hp, sq.currentHp, sq.stats.hp, state.status);
  }

  private runBattle(
    simulator: BattleSimulator,
    triSprite: ShapeSprite,
    sqSprite: ShapeSprite,
    hud: HUD
  ) {
    if (this.battleTicker) {
      this.battleTicker.destroy();
      this.battleTicker = null;
    }

    this.battleTicker = new PIXI.Ticker();

    this.battleTicker.add((ticker) => {
      const state = simulator.update();
      const tri = state.shapes.find(s => s.id === 'tri')!;
      const sq  = state.shapes.find(s => s.id === 'sq')!;
      hud.update(tri.currentHp, tri.stats.hp, sq.currentHp, sq.stats.hp, state.status);

      // Consume events → trigger sprite animations
      for (const event of state.events) {
        if (event.type === 'attack') {
          const sprite = event.attackerId === 'tri' ? triSprite : sqSprite;
          sprite.triggerAttack();
        }
        if (event.type === 'damage') {
          const sprite = event.targetId === 'tri' ? triSprite : sqSprite;
          sprite.triggerHit(event.isCrit);
        }
      }

      // Advance animation timers every frame
      triSprite.tick(ticker.deltaTime);
      sqSprite.tick(ticker.deltaTime);

      if (state.status !== 'running') {
        this.battleTicker!.stop();
      }
    });

    this.battleTicker.start();
  }
}