import type { Stats } from '../types';

/**
 * SHAPEBRAWL MVP FORMULAS
 * These are "Pure Functions" - they take numbers in, and spit numbers out.
 */

// 1. DAMAGE CALCULATION
// attacker: The shape hitting
// defender: The shape being hit
export const calculateDamage = (attacker: Stats, defender: Stats): number => {
  const baseDamage = attacker.attack;
  
  // Defense Formula: Damage reduction = def / (def + 100)
  // Example: 100 defense = 50% reduction. 20 defense = ~16% reduction.
  const reductionPercent = defender.defense / (defender.defense + 100);
  
  const finalDamage = baseDamage * (1 - reductionPercent);
  
  // Rule: You must always deal at least 1 damage
  return Math.max(1, Math.floor(finalDamage));
};

// 2. ATTACK TIMING
// Converts "Attack Speed" stat into "Ticks" (how long to wait between hits)
export const calculateAttackInterval = (attackSpeed: number): number => {
  const baseInterval = 100; // 100 ticks = 1 second
  return Math.floor(baseInterval / (1 + attackSpeed / 100));
};

// 3. CHANCE ROLLS
// probability: a number from 0 to 100
export const rollChance = (probability: number): boolean => {
  const roll = Math.random() * 100;
  return roll < probability;
};