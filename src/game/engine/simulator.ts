import type { BattleState, ShapeState, BattleEvent } from '../types';
import { calculateDamage, calculateAttackInterval, rollChance } from '../rules/formulas';
import { RNG } from './rng';

export class BattleSimulator {
  private state: BattleState;
  private rng: RNG;

  constructor(shapeA: ShapeState, shapeB: ShapeState, seed: number) {
    this.rng = new RNG(seed);
    this.state = {
      tick: 0,
      shapes: [shapeA, shapeB],
      events: [],
      status: 'running'
    };
  }

  // The main loop: Processes one "tick" of time
  public update(): BattleState {
    // 1. Clear events from the previous tick
    this.state.events = [];
    this.state.tick++;

    const [shape1, shape2] = this.state.shapes;

    // 2. Process attacks for both shapes
    this.checkAttack(shape1, shape2);
    this.checkAttack(shape2, shape1);

    // 3. Check for winners
    if (shape1.currentHp <= 0 || shape2.currentHp <= 0) {
      this.state.status = shape1.currentHp <= 0 ? 'defeat' : 'victory';
    }

    // 4. Return the new "Snapshot"
    return { ...this.state };
  }

  private checkAttack(attacker: ShapeState, defender: ShapeState) {
    const interval = calculateAttackInterval(attacker.stats.attackSpeed);
    
    // If the current tick is a multiple of the attack interval, attack!
    if (this.state.tick % interval === 0) {
      this.performAttack(attacker, defender);
    }
  }

  private performAttack(attacker: ShapeState, defender: ShapeState) {
    // Check Evasion
    if (rollChance(defender.stats.evasion)) {
      // In MVP, we just skip damage. Later we'll add a 'miss' event.
      return;
    }

    const isCrit = this.rng.next() * 100 < attacker.stats.critChance;
    let damage = calculateDamage(attacker.stats, defender.stats);
    
    if (isCrit) damage *= 2;

    defender.currentHp -= damage;

    // Record the events so the Renderer can see them later
    this.state.events.push({
      type: 'attack',
      attackerId: attacker.id,
      targetId: defender.id,
      isCrit
    });

    this.state.events.push({
      type: 'damage',
      targetId: defender.id,
      amount: damage,
      isCrit,
      currentHp: defender.currentHp
    });
  }
}