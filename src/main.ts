import { IW, IH, DRAW_FPS, RS, COLOR } from './config';
import { loadImages } from './images';
import { GameLoop } from './loop';
import { inputController, resources } from './deps';
import { drawDebugGrid } from './debug';
import {
  ActSmokeState,
  defaultActSmokeState,
  drawActSmoke,
  updateActSmoke,
} from './act-smoke';
import {
  ActIntroState,
  defaultActIntroState,
  drawActIntro,
  updateActIntro,
} from './act-intro';
import { defaultMenuState, drawMenu, MenuState, updateMenu } from './menu';

const loadingElement = document.querySelector<HTMLElement>('[data-loading]');
const crashElement = document.querySelector<HTMLElement>('[data-crash]');

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

canvas.width = IW;
canvas.height = IH;

const loop = new GameLoop({ onTick: tick });

type State = {
  menu: MenuState;
  act: ActIntroState | ActSmokeState;
};

const state: State = {
  menu: defaultMenuState,
  act: null,
};

function draw({ lastTime }) {
  ctx.clearRect(0, 0, IW, IH);

  drawBackground();

  drawDebugGrid(ctx);

  const { chosenIndex } = state.menu.act;
  if (state.act !== null) {
    if (chosenIndex === 0) {
      drawActIntro(ctx, { state: state.act as ActIntroState, lastTime });
    }
    if (chosenIndex === 1) {
      drawActSmoke(ctx, { state: state.act as ActSmokeState, lastTime });
    }
  }

  drawMenu(ctx, { state: state.menu, lastTime });
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

  let { act, menu } = state;

  menu = updateMenu({ state: menu, deltaTime });

  const { chosenIndex } = state.menu.act;

  if (chosenIndex === 0) {
    if (act === null) {
      act = defaultActIntroState;
    }
    act = updateActIntro({ state: act as ActIntroState, deltaTime });
  }
  if (chosenIndex === 1) {
    if (act === null) {
      act = defaultActSmokeState;
    }
    act = updateActSmoke({ state: act as ActSmokeState, deltaTime });
  }

  state.menu = menu;
  state.act = act;

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
