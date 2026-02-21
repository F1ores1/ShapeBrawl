# ShapeBrawl — Migration Plan
## From: Overengineered React Stack → To: Vite + PixiJS + TypeScript

---

## What We're Keeping (It's Good)

| File | Why It's Worth Saving |
|---|---|
| `types/index.ts` | Clean type definitions — `ShapeType`, `Stats`, `ShapeState`, `BattleState`, `BattleEvent` are all solid |
| `rules/formulas.ts` | Pure math functions, no dependencies, well-structured |
| `engine/rng.ts` | Seeded RNG is a smart choice — keep it exactly |
| `engine/simulator.ts` | Core loop logic is sound, just needs minor cleanup |
| `entities/shapes_dictionary.ts` | Clean balance sheet — easy to expand later |

**Bottom line:** The game brain is good. The problem was always the rendering layer and the framework bloat around it.

---

## What We're Throwing Out

| File | Why |
|---|---|
| `GameStage.tsx` | React component — we're going Vanilla. PixiJS doesn't need React. |
| `shape_sprite.ts` | Too thin to bother with, will rewrite as part of renderer |
| Everything React/shadcn/Zustand/Tailwind | Never needed it |

---

## The New Folder Structure

```
shapebrawl/
├── index.html              ← Entry point (Vite serves this)
├── vite.config.ts          ← Vite config (minimal)
├── tsconfig.json           ← TypeScript config
├── package.json
└── src/
    ├── main.ts             ← App entry — creates PixiJS app, kicks off game
    ├── game/
    │   ├── types/
    │   │   └── index.ts    ← KEEP AS-IS
    │   ├── rules/
    │   │   └── formulas.ts ← KEEP AS-IS
    │   ├── engine/
    │   │   ├── simulator.ts ← KEEP, minor cleanup
    │   │   └── rng.ts       ← KEEP AS-IS
    │   └── entities/
    │       └── shapes_dictionary.ts ← KEEP AS-IS
    └── renderer/
        ├── GameRenderer.ts  ← NEW: owns the PixiJS app and canvas
        ├── ShapeSprite.ts   ← NEW: draws a shape, updates position/HP
        └── HUD.ts           ← NEW: HP text, status text
```

The key insight: **`renderer/` is the only new code we write.** Everything in `game/` is already done.

---

## Migration Steps

### Step 1 — Fresh Vite Project
```bash
npm create vite@latest .
# Choose: Vanilla → TypeScript
npm install
npm install pixi.js
npm run dev
```
Confirm you see the Vite default page. Then delete the boilerplate (`counter.ts`, `style.css` content, etc.).

### Step 2 — Copy Game Logic Over
Copy `src/game/` wholesale from the old project. Don't change anything yet. The types, formulas, RNG, simulator, and dictionary all move over untouched.

### Step 3 — Fix the One Simulator Bug
In `simulator.ts`, the `checkAttack` function fires on tick multiples — but at tick 0 that means both shapes attack instantly before the player sees anything. Small fix:

```ts
// Change this:
if (this.state.tick % interval === 0)

// To this:
if (this.state.tick > 0 && this.state.tick % interval === 0)
```

### Step 4 — Write `GameRenderer.ts`
This replaces `GameStage.tsx`. It creates the PixiJS Application, owns the canvas, and runs the ticker. No React, no hooks — just a class.

```ts
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
```

### Step 5 — Write `ShapeSprite.ts`
Draws the shape on screen and exposes an update method for future animations.

```ts
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
```

### Step 6 — Write `HUD.ts`
Keeps all text/UI in one place, off the game objects.

```ts
// src/renderer/HUD.ts
import * as PIXI from 'pixi.js';
import type { BattleState } from '../game/types';

export class HUD {
  public container: PIXI.Container;
  private triHpText: PIXI.Text;
  private sqHpText: PIXI.Text;
  private statusText: PIXI.Text;

  constructor() {
    this.container = new PIXI.Container();
    const style = { fontFamily: 'Arial', fontSize: 20, fill: 0xffffff };

    this.triHpText = new PIXI.Text({ text: '', style });
    this.sqHpText = new PIXI.Text({ text: '', style });
    this.statusText = new PIXI.Text({ text: 'FIGHT', style: { ...style, fontSize: 32, fill: 0xffd700 } });

    this.triHpText.x = 50;   this.triHpText.y = 20;
    this.sqHpText.x = 550;   this.sqHpText.y = 20;
    this.statusText.x = 400; this.statusText.y = 550;
    this.statusText.anchor.set(0.5, 0);

    this.container.addChild(this.triHpText, this.sqHpText, this.statusText);
  }

  update(triHp: number, triMax: number, sqHp: number, sqMax: number, status: BattleState['status']) {
    this.triHpText.text = `Triangle\n${Math.max(0, Math.ceil(triHp))} / ${triMax}`;
    this.sqHpText.text = `Square\n${Math.max(0, Math.ceil(sqHp))} / ${sqMax}`;

    if (status === 'victory') this.statusText.text = 'TRIANGLE WINS!';
    if (status === 'defeat')  this.statusText.text = 'SQUARE WINS!';
    if (status === 'draw')    this.statusText.text = 'DRAW!';
  }
}
```

### Step 7 — Wire Up `main.ts`
```ts
// src/main.ts
import { GameRenderer } from './renderer/GameRenderer';

const container = document.getElementById('app')!;
const renderer = new GameRenderer();
renderer.init(container);
```

And `index.html` should just have:
```html
<div id="app"></div>
<script type="module" src="/src/main.ts"></script>
```

---

## What You've Gained

| Old Stack | New Stack |
|---|---|
| 15+ packages | 2 packages (pixi.js, vite) |
| React hooks, JSX, `.tsx` files | Plain TypeScript classes |
| Zustand for state | The simulator IS the state |
| Tailwind + shadcn for UI | PixiJS Text objects |
| Framer Motion + GSAP | Not needed yet |
| Confusing file structure | 8 files total |

---

## What Comes Next (After This Works)

Don't touch these until the battle runs cleanly on screen:

1. **Hit flash** — briefly tint the sprite red when hit (`sprite.tint = 0xff0000`)
2. **HP bar** — a `PIXI.Graphics` rectangle that shrinks as HP drops
3. **More shapes** — just add entries to `shapes_dictionary.ts`
4. **Shape select screen** — plain HTML buttons above the canvas, no framework needed
