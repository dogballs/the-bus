import { IW, IH, OW, OH, FPS, RS, COLOR } from './config';
import { InputController } from './input';
import { loadImages } from './images';
import { GameLoop } from './loop';

const loadingElement = document.querySelector<HTMLElement>('[data-loading]');
const crashElement = document.querySelector<HTMLElement>('[data-crash]');

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

canvas.width = IW;
canvas.height = IH;

const inputController = new InputController()
const loop = new GameLoop({ fps: FPS, onTick: tick });

const resources = {
  images: undefined,
};

function draw() {
  ctx.clearRect(0, 0, IW, IH);

  drawBackground();
  drawDebugGrid();

  drawDude();
}

function drawBackground() {
  ctx.fillStyle = COLOR.B;
  ctx.fillRect(0, 0, IW, IH);
}

function drawDude() {
  ctx.drawImage(resources.images.dude, 4, 4);
}

function drawDebugGrid() {
  ctx.strokeStyle = 'rgba(128,128,128,0.5)';
  ctx.lineWidth = 0.01;

  for (let i = 0; i < OW; i++) {
    ctx.moveTo(i, 0);
    ctx.lineTo(i, OH);
    ctx.stroke();
  }

  for (let i = 0; i < OH; i++) {
    ctx.moveTo(0, i);
    ctx.lineTo(OW, i);
    ctx.stroke();
  }
}

function tick() {
  inputController.update();

  draw();
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
