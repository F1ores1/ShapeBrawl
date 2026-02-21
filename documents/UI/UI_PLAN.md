# UI_PLAN.md — ShapeBrawl Visual Design

## Feedback Protocol
- Primary: Screenshot + renderer code file evaluation
- Screenshots diagnose what code cannot explain
- One change at a time, confirm before next step

---

## ACTIVE: Option 1 — Arena Floor

### Philosophy
The canvas fills the full viewport. The battle arena is the world — nothing exists outside it.
A dark grid background gives infinite-space depth like agar.io. A radial glow in the center
draws the eye to where combat happens. HUD floats as minimal overlay. No borders, no frames.

### Colors
| Element | Color | Hex |
|---|---|---|
| Background | Deep navy | `0x0d0d1a` |
| Grid lines | Subtle blue-grey | `0x1a1a35` |
| Arena glow | Soft teal radial | `0x0d2233` |
| Triangle | Hot coral red | `0xff4455` |
| Square | Strong blue | `0x4488ff` |
| HUD text | White | `0xffffff` |
| Win text | Gold | `0xffd700` |
| Damage flash | Bright red | `0xff0000` |

### Shape Design
- Triangle: slightly larger than MVP, sharp aggressive silhouette
- Square: solid, slightly rounded feel via size (not actual rounding yet)
- Both shapes centered vertically in arena, spaced 400px apart

### Layout
```
┌─────────────────────────────────────────────────────┐
│  Triangle HP ████████░░        Square HP ░░████████ │  ← HP bars top
│                                                     │
│                   [radial glow]                     │
│        ▲                              ■             │  ← shapes centered
│                                                     │
│                  TRIANGLE WINS!                     │  ← status bottom-center
└─────────────────────────────────────────────────────┘
         ↑ canvas fills 100% viewport width/height
```

### Construction Steps

#### Step 1 — Fix Centering (CSS, index.html)
The canvas must fill the viewport. Fix body CSS:
```css
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #0d0d1a; display: flex; align-items: center; justify-content: center; width: 100vw; height: 100vh; overflow: hidden; }
#app { width: 100%; height: 100%; }
```
PixiJS app init should use `resizeTo: window` instead of fixed 800x600.
Confirm with screenshot before proceeding.

#### Step 2 — Grid Background
Draw a grid using `PIXI.Graphics` tiled across the full canvas.
Grid lines every 60px, color `0x1a1a35`, line width 1, alpha 0.5.
This lives in `GameRenderer.ts` as a private `drawGrid()` method called once on init.
Confirm with screenshot before proceeding.

#### Step 3 — Radial Arena Glow
A large soft circle in the center of the canvas using `PIXI.Graphics` with low alpha (~0.15).
Color `0x0d4466`, radius ~300px, centered at canvas midpoint.
Drawn once on init, sits above grid but below shapes.
Confirm with screenshot before proceeding.

#### Step 4 — HP Bars
Replace HP text numbers with visual bars in `HUD.ts`.
Each bar: 200px wide, 16px tall. Drawn with `PIXI.Graphics`.
Background bar: dark grey `0x333333`. Foreground bar: shape color, shrinks with HP.
Triangle bar: top-left. Square bar: top-right (right-aligned).
Keep text labels above bars (name only, no numbers).
Confirm with screenshot before proceeding.

#### Step 5 — Damage Flash
In `ShapeSprite.ts`, add a `flash()` method.
On damage event: set `this.container.tint = 0xff0000`, then restore after 100ms using a ticker countdown.
`GameRenderer` calls `flash()` when a damage event appears in `state.events`.
Confirm with screenshot before proceeding.

#### Step 6 — Polish Pass
- Status text font size bump to 48px, centered bottom third of screen
- Slight scale pulse on win (scale to 1.3 then back using ticker)
- Grid alpha reduced if it feels too busy after seeing it in context

---

<!--
!# NOT ACTIVE — Option 2: Card Duel

### Philosophy
Full dark background, canvas framed like a card game table. Deep green felt texture,
rounded corners, clear boundary. Gold accents for wins, red for damage.
Structured and readable — each battle feels like a match.

### Colors
- Background: Dark charcoal `0x1a1a1a`
- Table felt: Deep green `0x1a3a2a`
- Frame border: Gold `0xc8a84b`
- Triangle: Warm red `0xee3333`
- Square: Royal blue `0x3355cc`
- HUD: Cream white `0xf5f0e0`
- Win text: Gold `0xffd700`

### Layout
Canvas is fixed size centered on page with visible rounded border frame.
Game board inside the frame. HUD inside top of frame.
-->

<!--
!# NOT ACTIVE — Option 3: Void Fight

### Philosophy
Pure black fullscreen, no grid, no texture. Shapes glow with neon colors.
No visible canvas border — shapes exist in pure darkness.
Minimalist HUD, thin lines only. The shapes are everything.

### Colors
- Background: Pure black `0x000000`
- Triangle: Neon pink `0xff0088` with outer glow filter
- Square: Electric blue `0x00aaff` with outer glow filter
- HUD: Thin white lines, minimal text
- Win text: White `0xffffff`

### Layout
Fullscreen. No frame. Shapes centered with glow filters (PIXI.filters.BlurFilter layered).
HP shown as thin horizontal lines only, no fill bars.
-->
