import * as PIXI from 'pixi.js';
import type { BattleState } from '../game/types';

export class HUD {
  public container: PIXI.Container;
  private triHpText: PIXI.Text;
  private sqHpText: PIXI.Text;
  private statusText: PIXI.Text;
  private fightButton: PIXI.Container;

  constructor(
    arenaX: number, arenaY: number,
    arenaW: number, arenaH: number,
    onFightClick: () => void
  ) {
    this.container = new PIXI.Container();
    const style = { fontFamily: 'Arial', fontSize: 20, fill: 0xffffff };

    this.triHpText  = new PIXI.Text({ text: '', style });
    this.sqHpText   = new PIXI.Text({ text: '', style });
    this.statusText = new PIXI.Text({ text: '', style: { ...style, fontSize: 48, fill: 0xffd700 } });

    this.triHpText.x = arenaX + 20;
    this.triHpText.y = arenaY + 15;

    this.sqHpText.x = arenaX + arenaW - 150;
    this.sqHpText.y = arenaY + 15;

    this.statusText.anchor.set(0.5, 0);
    this.statusText.x = arenaX + arenaW * 0.5;
    this.statusText.y = arenaY + arenaH * 0.75;

    // --- FIGHT button ---
    const btnW = 180, btnH = 60;
    const btnX = arenaX + arenaW * 0.5;
    const btnY = arenaY + arenaH * 0.5;

    this.fightButton = new PIXI.Container();
    this.fightButton.x = btnX;
    this.fightButton.y = btnY;
    this.fightButton.eventMode = 'static';
    this.fightButton.cursor = 'pointer';

    const bg = new PIXI.Graphics();
    bg.roundRect(-btnW / 2, -btnH / 2, btnW, btnH, 12)
      .fill({ color: 0x1a1a2e })
      .stroke({ width: 2, color: 0xffd700 });

    const label = new PIXI.Text({
      text: 'FIGHT',
      style: { fontFamily: 'Arial', fontSize: 32, fontWeight: 'bold', fill: 0xffd700 }
    });
    label.anchor.set(0.5);

    this.fightButton.addChild(bg, label);

    // Hover effects
    this.fightButton.on('pointerover', () => {
      bg.clear();
      bg.roundRect(-btnW / 2, -btnH / 2, btnW, btnH, 12)
        .fill({ color: 0x2a2a4e })
        .stroke({ width: 2, color: 0xffd700 });
    });
    this.fightButton.on('pointerout', () => {
      bg.clear();
      bg.roundRect(-btnW / 2, -btnH / 2, btnW, btnH, 12)
        .fill({ color: 0x1a1a2e })
        .stroke({ width: 2, color: 0xffd700 });
    });
    this.fightButton.on('pointerdown', () => {
      this.fightButton.visible = false;
      onFightClick();
    });

    this.container.addChild(this.triHpText, this.sqHpText, this.statusText, this.fightButton);
  }

  update(triHp: number, triMax: number, sqHp: number, sqMax: number, status: BattleState['status']) {
    this.triHpText.text = `Triangle\n${Math.max(0, Math.ceil(triHp))} / ${triMax}`;
    this.sqHpText.text  = `Square\n${Math.max(0, Math.ceil(sqHp))} / ${sqMax}`;

    if (status === 'victory') this.statusText.text = 'TRIANGLE WINS!';
    if (status === 'defeat')  this.statusText.text = 'SQUARE WINS!';
    if (status === 'draw')    this.statusText.text = 'DRAW!';
  }
}