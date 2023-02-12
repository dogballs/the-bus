import { IW, IH, FPS } from './config';
import { InputController } from './input';
import { GameLoop } from './loop';

const loadingElement = document.querySelector<HTMLElement>('[data-loading]');
const crashElement = document.querySelector<HTMLElement>('[data-crash]');

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

canvas.width = IW;
canvas.height = IH;

const inputController = new InputController()
const loop = new GameLoop({ fps: FPS, onTick: tick });

function draw() {
  ctx.clearRect(0, 0, IW, IH);

  ctx.fillText('Hello', 10, 10);
}

function tick() {
  inputController.update();

  draw();
}

async function main() {
  try {
    document.body.appendChild(canvas);

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
