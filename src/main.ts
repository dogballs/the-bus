import { IW, IH, OW, OH, FPS, RS, COLOR } from './config';
import { loadImages } from './images';
import { GameLoop } from './loop';
import { inputController, resources } from './deps';

import { defaultDudeState, drawDude, updateDude } from './dude';

const loadingElement = document.querySelector<HTMLElement>('[data-loading]');
const crashElement = document.querySelector<HTMLElement>('[data-crash]');

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

canvas.width = IW;
canvas.height = IH;

const loop = new GameLoop({ fps: FPS, onTick: tick });

const state = {
  dude: defaultDudeState,
};

function draw({ lastTime }) {
  ctx.clearRect(0, 0, IW, IH);

  drawBackground();
  drawDebugGrid();

  drawDude(ctx, { state: state.dude });
}

function drawBackground() {
  ctx.fillStyle = COLOR.B;
  ctx.fillRect(0, 0, IW, IH);
}

function drawDebugGrid() {
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 0.1;

  for (let i = 0; i < OW; i++) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, OH);
    ctx.stroke();
  }

  for (let i = 0; i < OH; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(OW, i);
    ctx.stroke();
  }
}

function tick({ deltaTime, lastTime }) {
  inputController.update();

  updateDude({ state: state.dude, deltaTime });

  draw({ lastTime });
}

async function main() {
  try {
    loadingElement.textContent = 'Loading images...';
    resources.images = await loadImages();

    document.body.appendChild(canvas);

    ctx.scale(RS, RS);
    ctx.imageSmoothingEnabled = false;

    inputController.listen();
    loop.start();
  } catch (err) {
    crash();

    console.error(err);
  } finally {
    loadingElement.style.display = 'none';
  }
}

function crash() {
  loop.stop();
  try {
    document.body.removeChild(canvas);
  } catch (err) {}
  crashElement.style.display = 'flex';
}

main();
