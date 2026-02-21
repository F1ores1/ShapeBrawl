import type { ShapeType, Stats } from '../types';

/**
 * THE SHAPE DICTIONARY
 * This is the "Balance Sheet" for our MVP.
 */

export const BASE_STATS: Record<ShapeType, Stats> = {
  triangle: {
    hp: 80,
    attack: 15,
    defense: 5,
    attackSpeed: 120, // Fast attacker
    critChance: 15,   // Higher crit
    evasion: 10,      // Higher dodge
  },
  square: {
    hp: 150,
    attack: 10,
    defense: 25,     // High defense
    attackSpeed: 80,  // Slower attacker
    critChance: 5,
    evasion: 2,
  },
};