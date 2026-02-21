# CLAUDE.md — ShapeBrawl

## Project Summary
A 2D auto-battler game where geometric shapes fight each other. MVP is Triangle vs Square.
Built for a developer learning TypeScript coming from a C# background.

---

## Stack (Intentionally Minimal)
- **Vite** — build and dev server
- **PixiJS** — 2D rendering, canvas, all visuals
- **TypeScript** — strict mode, vanilla (no React)

No React. No UI frameworks. No state management libraries. Add nothing unless hitting a hard wall.

---

## Folder Structure
```
src/
├── main.ts                          ← Entry point, creates GameRenderer
├── game/
│   ├── types/index.ts               ← All shared types (KEEP AS-IS)
│   ├── rules/formulas.ts            ← Pure math functions (KEEP AS-IS)
│   ├── engine/
│   │   ├── simulator.ts             ← Battle loop
│   │   └── rng.ts                   ← Seeded RNG (Mulberry32)
│   └── entities/
│       └── shapes_dictionary.ts     ← Balance sheet / base stats
└── renderer/
    ├── GameRenderer.ts              ← Owns PixiJS app, canvas, starts battle
    ├── ShapeSprite.ts               ← Draws a shape, updates position
    └── HUD.ts                       ← HP text, status text
```

---

## Architecture Rules
- **`game/`** is pure logic — no PixiJS imports, no browser APIs
- **`renderer/`** is pure visuals — reads from simulator output, never mutates game state
- The simulator IS the state. No Zustand, no external store.
- `GameRenderer` owns the ticker loop. It calls `simulator.update()` each tick and passes results to sprites and HUD.

---

## Key Design Decisions
- **Seeded RNG** (`rng.ts`) — every battle is reproducible with a seed. Uses Mulberry32 algorithm.
- **Tick-based simulation** — 100 ticks = 1 second. `attackSpeed` stat determines attack interval.
- **Negative HP at death is OK** — simulator stops when HP drops below 0, renderer clamps display with `Math.max(0, hp)`.
- **`Date.now()` as seed** — gives different battle each run, intentional.

---

## Types Reference
```ts
ShapeType = 'triangle' | 'square'

Stats {
  hp, attack, defense,
  attackSpeed,  // 100 = 1 attack/sec
  critChance,   // 0-100
  evasion       // 0-100
}

ShapeState {
  id, type, stats, currentHp,
  position: { x, y },
  isStunned
}

BattleState {
  tick, shapes: [ShapeState, ShapeState],
  events: BattleEvent[],
  status: 'running' | 'victory' | 'defeat' | 'draw'
}
```

---

## Simulator Behavior
- Both shapes attack each other every tick if interval is met
- `tick > 0` guard prevents attack on tick 0
- Evasion checked first — if evaded, no damage event fired
- Crit doubles damage
- Minimum 1 damage always dealt

---

## Canvas Setup
- Width: 800, Height: 600, Background: `0x1a1a2e`
- Triangle position: x:200, y:300 (left side)
- Square position: x:600, y:300 (right side)
- HUD text anchored top of screen

---

## UI Communication Protocol
- Prefer reading **renderer code files** over screenshots for diagnosing layout issues
- Screenshots used only when code looks correct but visual is still wrong
- One file change at a time — confirm it worked before moving on
- Console errors are highest priority signal when something breaks

---

## What's Next (Do Not Build Until Battle Renders Cleanly)
1. Hit flash — tint sprite red briefly on damage (`sprite.tint = 0xff0000`)
2. HP bars — `PIXI.Graphics` rectangle that shrinks with HP
3. Shape select screen — plain HTML buttons, no framework
4. More shapes — add entries to `shapes_dictionary.ts`

---

## Developer Notes
- Braden comes from C# — use class-based patterns, avoid functional/hooks style explanations
- `.ts` = `.cs`, `package.json` = `.csproj`, `npm` = NuGet, `import` = `using`
- Paste files one at a time, confirm each works before the next
- Test logic in terminal with `npx tsx src/test.ts` before touching the renderer
