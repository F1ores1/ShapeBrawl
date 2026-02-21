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