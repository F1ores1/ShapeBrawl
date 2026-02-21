/**
 * SHAPEBRAWL MVP CORE TYPES
 * Simplified to focus on Triangle vs. Square combat.
 */

// 1. MVP Shapes only
export type ShapeType = 'triangle' | 'square';

// 2. The physical properties (The "Blueprint")
export interface Stats {
  hp: number;
  attack: number;
  defense: number;
  attackSpeed: number; // 100 = 1 attack per second
  critChance: number;  // 0 to 100
  evasion: number;     // 0 to 100
  
}

// 3. The status of a shape in a live battle
export interface ShapeState {
  id: string;
  type: ShapeType;
  stats: Stats;
  currentHp: number;
  position: { x: number; y: number };
  // Temporary simplified for MVP:
  isStunned: boolean;
}

// 4. The Snapshot of a single moment (Tick)
export interface BattleState {
  tick: number;
  shapes: [ShapeState, ShapeState];
  events: BattleEvent[];
  status: 'running' | 'victory' | 'defeat' | 'draw';
}

// 5. Combat Events (The "Log" for the Renderer)
export type BattleEvent = 
  | { type: 'attack'; attackerId: string; targetId: string; isCrit: boolean }
  | { type: 'damage'; targetId: string; amount: number; isCrit: boolean; currentHp: number }
  | { type: 'death'; targetId: string };

// 6. The final result for the UI
export interface BattleResult {
  winnerId: string | null;
  totalTicks: number;
  history: BattleEvent[];
}