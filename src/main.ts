// src/main.ts
import { GameRenderer } from './renderer/GameRenderer';

const container = document.getElementById('app')!;
const renderer = new GameRenderer();
renderer.init(container);
