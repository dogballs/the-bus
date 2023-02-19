import { IW, IH, DRAW_FPS, RS, COLOR } from './config';
import { loadImages } from './images';
import { GameLoop } from './loop';
import { inputController, resources } from './deps';
import { drawDebugGrid } from './debug';
import {
  defaultActSmokeState,
  drawActSmoke,
  updateActSmoke,
} from './act-smoke';
import {
  defaultActIntroState,
  drawActIntro,
  updateActIntro,
} from './act-intro';

const loadingElement = document.querySelector<HTMLElement>('[data-loading]');
const crashElement = document.querySelector<HTMLElement>('[data-crash]');

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

canvas.width = IW;
canvas.height = IH;

const loop = new GameLoop({ onTick: tick });

const state = {
  actKind: 'smoke',
  // act: defaultActSmokeState,
  act: defaultActIntroState,
};

function draw({ lastTime }) {
  ctx.clearRect(0, 0, IW, IH);

  drawBackground();

  drawDebugGrid(ctx);

  // drawActSmoke(ctx, { state: state.act, lastTime });
  drawActIntro(ctx, { state: state.act, lastTime });
}

function drawBackground() {
  ctx.fillStyle = COLOR.B;
  ctx.fillRect(0, 0, IW, IH);
}

let lastDrawTime = 0;
const drawInterval = 1 / DRAW_FPS;

// Throttle the drawing but run update loop at regular FPS not to miss input events
function tick({ deltaTime, lastTime }) {
  inputController.update();

  // state.act = updateActSmoke({ state: state.act, deltaTime });
  state.act = updateActIntro({ state: state.act, deltaTime });

  const drawDeltaTime = lastTime - lastDrawTime;
  if (drawDeltaTime > drawInterval) {
    lastDrawTime = lastTime;
    draw({ lastTime });
  }
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
