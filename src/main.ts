import { IW, IH, DRAW_FPS, RS, COLOR } from './config';
import { loadImages } from './images';
import { GameLoop } from './loop';
import { inputController, resources } from './deps';
import { drawDebugGrid } from './debug';
import {
  ActSmokeState,
  createDefaultActSmokeState,
  drawActSmoke,
  updateActSmoke,
} from './act-smoke';
import {
  ActIntroState,
  createDefaultActIntroState,
  drawActIntro,
  updateActIntro,
} from './act-intro';
import {
  createDefaultMenuState,
  drawMenu,
  MenuState,
  updateMenu,
} from './menu';
import { ActNullState, defaultActNull } from './act-null';
import {
  ActGooseState,
  createDefaultActGooseState,
  drawActGoose,
  updateActGoose,
} from './act-goose';
import {
  ActRainState,
  createDefaultActRainState,
  drawActRain,
  updateActRain,
} from './act-rain';
import {
  ActOutroState,
  createDefaultActOutroState,
  drawActOutro,
  updateActOutro,
} from './act-outro';

const loadingElement = document.querySelector<HTMLElement>('[data-loading]');
const crashElement = document.querySelector<HTMLElement>('[data-crash]');

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

canvas.width = IW;
canvas.height = IH;

const loop = new GameLoop({ onTick: tick });

type State = {
  menu: MenuState;
  act:
    | ActNullState
    | ActIntroState
    | ActSmokeState
    | ActRainState
    | ActGooseState
    | ActOutroState;
  actIndex: number;
  shakeFrame: number;
};

const state: State = {
  menu: createDefaultMenuState({ status: 'intro' }),
  shakeFrame: 0,

  act: defaultActNull,
  actIndex: -1,
  //
  // act: createDefaultActIntroState(),
  // actIndex: 0,
  //
  // act: createDefaultActSmokeState(),
  // actIndex: 1,
  //
  // act: createDefaultActRainState(),
  // actIndex: 2,
  //
  // act: createDefaultActGooseState(),
  // actIndex: 3,
  //
  // act: createDefaultActOutroState(),
  // actIndex: 4,
};

// TODO: logo, screenshots
// TODO: 15 or 60 FPS
// TODO: "select act" text in menu?

function draw({
  lastTime,
  shake = false,
}: {
  lastTime: number;
  shake?: boolean;
}) {
  ctx.clearRect(0, 0, IW, IH);

  drawBackground();

  if (shake) {
    const nextFrame = Math.round(lastTime / 0.2) % 2 === 0 ? 1 : 0;
    if (state.shakeFrame !== nextFrame) {
      if (nextFrame === 0) {
        ctx.translate(0, 2);
      } else if (nextFrame === 1) {
        ctx.translate(0, -2);
      }
      state.shakeFrame = nextFrame;
    }
  } else {
    if (state.shakeFrame === 1) {
      state.shakeFrame = 0;
      ctx.translate(0, 2);
    }
  }

  const { actIndex } = state;
  if (actIndex === 0) {
    drawActIntro(ctx, { state: state.act as ActIntroState, lastTime });
  }
  if (actIndex === 1) {
    drawActSmoke(ctx, { state: state.act as ActSmokeState, lastTime });
  }
  if (actIndex === 2) {
    drawActRain(ctx, { state: state.act as ActRainState, lastTime });
  }
  if (actIndex === 3) {
    drawActGoose(ctx, { state: state.act as ActGooseState, lastTime });
  }
  if (actIndex === 4) {
    drawActOutro(ctx, { state: state.act as ActOutroState, lastTime });
  }

  drawMenu(ctx, { state: state.menu, lastTime });

  // drawDebugGrid(ctx);
}

function drawBackground() {
  ctx.fillStyle = COLOR.B;
  ctx.fillRect(0, 0, IW, IH);
}

let lastDrawTime = 0;
const drawInterval = 1 / DRAW_FPS;

function tick({ deltaTime, lastTime }) {
  inputController.update();

  let { act, menu, actIndex } = state;

  // act = updateActIntro({ state: act as ActIntroState, deltaTime });
  // act = updateActSmoke({ state: act as ActSmokeState, deltaTime });
  // act = updateActRain({ state: act as ActRainState, deltaTime });
  // act = updateActGoose({ state: act as ActGooseState, deltaTime });
  // act = updateActOutro({ state: act as ActOutroState, deltaTime });

  menu = updateMenu({ state: menu, deltaTime });

  const { selectedIndex } = state.menu.act;
  if (selectedIndex != null && actIndex !== selectedIndex) {
    actIndex = selectedIndex;

    if (actIndex === 0) act = createDefaultActIntroState();
    if (actIndex === 1) act = createDefaultActSmokeState();
    if (actIndex === 2) act = createDefaultActRainState();
    if (actIndex === 3) act = createDefaultActGooseState();
    if (actIndex === 4) act = createDefaultActOutroState();
  }

  if (state.menu.status === 'level' || state.menu.status === 'next') {
    if (actIndex === 0) {
      act = updateActIntro({ state: act as ActIntroState, deltaTime });
    }
    if (actIndex === 1) {
      act = updateActSmoke({ state: act as ActSmokeState, deltaTime });
    }
    if (actIndex === 2) {
      act = updateActRain({ state: act as ActRainState, deltaTime });
    }
    if (actIndex === 3) {
      act = updateActGoose({ state: act as ActGooseState, deltaTime });
    }
    if (actIndex === 4) {
      act = updateActOutro({ state: act as ActOutroState, deltaTime });
    }
  }

  if (act.status === 'ended' && menu.status === 'level') {
    menu = createDefaultMenuState({
      status: 'next',
      highlightedIndex: actIndex + 1,
    });
  }
  if (menu.status === 'bus') {
    actIndex = -1;
    act = defaultActNull;
  }

  state.menu = menu;
  state.act = act;
  state.actIndex = actIndex;

  // Throttle the drawing but run update loop at regular FPS not to miss input events
  const drawDeltaTime = lastTime - lastDrawTime;
  if (drawDeltaTime > drawInterval) {
    lastDrawTime = lastTime;
    draw({ lastTime, shake: act.shake });
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
