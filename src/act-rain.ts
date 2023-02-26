import {
  Animation,
  createSheet,
  Sheet,
  SheetAnimation,
  Timer,
} from './animation';
import { drawBench } from './bench';
import {
  createDefaultDudeState,
  drawDude,
  DudeState,
  updateDude,
} from './dude';
import { inputController, resources } from './deps';
import { InputControl } from './input';
import { COLOR, OH, OW } from './config';
import { randomNumber } from './random';

const GHOST_STAND_ANIMATION = new SheetAnimation(createSheet(16, 24, 1));
const GHOST_APPEAR_ANIMATION_SLOW = new SheetAnimation(
  createSheet(16, 24, 9).reverse(),
  { delay: 0.5 },
);
const GHOST_APPEAR_ANIMATION_ = new SheetAnimation(
  createSheet(16, 24, 9).reverse(),
  {
    delay: 0.05,
  },
);
const GHOST_DISAPPEAR_ANIMATION_ = new SheetAnimation(createSheet(16, 24, 9), {
  delay: 0.05,
});
const DUDE_DISAPPEAR_ANIMATION = new SheetAnimation(createSheet(16, 32, 10), {
  delay: 0.1,
});

type UmbrellaState = {
  status: 'idle' | 'closed' | 'open';
  x: number;
  walkedInOpened: boolean;
};

export const createDefaultUmbrellaState = (): UmbrellaState => ({
  status: 'idle',
  x: 4,
  walkedInOpened: false,
});

type RainState = {
  status: 'none' | 'init' | 'starting' | 'full' | 'umbrella';
  drops: { y: number; x: number }[];
  delayTimer: Timer;
  startingTimer: Timer;
};

export const createDefaultRainSate = (): RainState => ({
  status: 'init',
  drops: [],
  delayTimer: new Timer(1),
  startingTimer: new Timer(7),
});

type GhostState = {
  status: 'none' | 'appear' | 'disappear' | 'idle';
  x: number;
  animation: Animation<Sheet>;
};

export const createDefaultGhostState = (): GhostState => ({
  status: 'none',
  x: 77,
  animation: GHOST_STAND_ANIMATION.reset(),
});

type DudeDisappearState = {
  status: 'none' | 'active';
  animation: Animation<Sheet>;
};

export const createDudeDisappearState = (): DudeDisappearState => ({
  status: 'none',
  animation: DUDE_DISAPPEAR_ANIMATION.reset(),
});

export type ActRainState = {
  status: 'active' | 'ended';
  shake: false;
  endTimer: Timer;
  dude: DudeState;
  umbrella: UmbrellaState;
  rain: RainState;
  ghost: GhostState;
  dudeDisappear: DudeDisappearState;
};

const END_TIME = 4;
export function createDefaultActRainState(): ActRainState {
  return {
    status: 'active',
    shake: false,
    endTimer: new Timer(END_TIME),
    dude: {
      ...createDefaultDudeState(),
      x: 54,
      direction: -1,
      status: 'sitting',
    },
    umbrella: createDefaultUmbrellaState(),
    rain: createDefaultRainSate(),
    ghost: createDefaultGhostState(),
    dudeDisappear: createDudeDisappearState(),
  };
}

function drawUmbrella(
  ctx,
  { state, dude }: { state: UmbrellaState; dude: DudeState },
) {
  const { x, status } = state;

  if (status === 'idle') {
    const rx = Math.round(x);
    const image = resources.images.umbrella;

    const frameWidth = 6;

    ctx.translate(rx + frameWidth / 2, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(image, 0, 0, 6, 19, 0, 24, 6, 19);
    ctx.scale(-1, 1);
    ctx.translate(-(rx + frameWidth / 2), 0);
  }

  if (status === 'open') {
    const image = resources.images.umbrella;

    const dudeRx = Math.round(dude.x);
    const rx = dude.direction === 1 ? dudeRx + 7 : dudeRx - 7;

    const frameWidth = 22;

    if (dude.direction === -1) {
      ctx.translate(rx + frameWidth / 2, 0);
      ctx.scale(-1, 1);
    }

    const destX = dude.direction === -1 ? 0 : rx - frameWidth / 2;

    ctx.drawImage(image, 10, 0, frameWidth, 19, destX, 8, frameWidth, 19);

    if (dude.direction === -1) {
      ctx.scale(-1, 1);
      ctx.translate(-(rx + frameWidth / 2), 0);
    }
    state.x = rx;
  }

  if (status === 'closed') {
    const image = resources.images.umbrella;

    const dudeRx = Math.round(dude.x);
    const rx = dude.direction === 1 ? dudeRx + 7 : dudeRx - 7;

    const frameWidth = 6;

    if (dude.direction === -1) {
      ctx.translate(rx + frameWidth / 2, 0);
      ctx.scale(-1, 1);
    }

    const destX = dude.direction === -1 ? 0 : rx - frameWidth / 2;

    ctx.drawImage(image, 0, 0, frameWidth, 19, destX, 24, frameWidth, 19);

    if (dude.direction === -1) {
      ctx.scale(-1, 1);
      ctx.translate(-(rx + frameWidth / 2), 0);
    }
    state.x = rx;
  }
}

function updateUmbrella({ state }: { state: UmbrellaState }): UmbrellaState {
  const isUp = inputController.isDown(InputControl.Up);
  const isDown = inputController.isDown(InputControl.Down);

  let { status, x } = state;

  if (isUp && status === 'closed') {
    status = 'open';
  }
  if (isDown && status === 'open') {
    status = 'closed';
  }

  return {
    ...state,
    status,
    x,
  };
}

function drawRain(
  ctx,
  {
    state,
    umbrella,
    dude,
  }: { state: RainState; umbrella: UmbrellaState; dude: DudeState },
) {
  const { status, drops, startingTimer } = state;

  if (status === 'none') {
    return;
  }

  ctx.fillStyle = COLOR.A;
  for (const [index, drop] of drops.entries()) {
    const left = dude.direction === 1 ? dude.x - 4 : dude.x - 19;
    const right = dude.direction === 1 ? dude.x + 17 : dude.x + 3;
    const top = 12;
    const bottom = 44;

    if (status === 'starting') {
      if (
        (index % Math.round(startingTimer.timeLeft) === 0 ||
          startingTimer.timeLeft < 1) &&
        drop.y <= bottom
      ) {
        if (
          umbrella.status === 'open' &&
          drop.x >= left &&
          drop.x <= right &&
          drop.y >= top &&
          drop.y <= bottom
        ) {
          ctx.fillRect(drop.x, Math.round(drop.y), 1, 2);
        } else if (umbrella.status === 'closed' || umbrella.status === 'idle') {
          ctx.fillRect(drop.x, Math.round(drop.y), 1, 2);
        }
      }
    }
    if (status === 'full') {
      if (
        umbrella.status === 'open' &&
        drop.x >= left &&
        drop.x <= right &&
        drop.y >= top &&
        drop.y <= bottom
      ) {
        ctx.fillRect(drop.x, Math.round(drop.y), 1, 2);
      } else if (
        (umbrella.status === 'closed' || umbrella.status === 'idle') &&
        drop.y <= bottom
      ) {
        ctx.fillRect(drop.x, Math.round(drop.y), 1, 2);
      }
    }
  }
}

function updateRain({
  state,
  deltaTime,
}: {
  state: RainState;
  deltaTime: number;
}): RainState {
  let { status, drops, startingTimer, delayTimer } = state;

  if (status === 'none') {
    return state;
  }

  if (drops.length === 0) {
    for (let i = 0; i < OW; i++) {
      drops.push({
        x: i,
        y: randomNumber(-500, OH),
      });
    }
  }

  if (status === 'full' || status === 'starting') {
    drops = drops.map((drop) => {
      const yChange = randomNumber(60, 80) * deltaTime;

      let y = drop.y + yChange;
      if (y > OH) {
        y = -5;
      }

      return {
        ...drop,
        y,
      };
    });
  }

  if (status === 'starting') {
    startingTimer.update(deltaTime);
    if (startingTimer.isDone()) {
      status = 'full';
    }
  }

  if (status === 'init') {
    delayTimer.update(deltaTime);
    if (delayTimer.isDone()) {
      status = 'starting';
    }
  }

  return {
    ...state,
    drops,
    status,
  };
}

function drawGhost(
  ctx,
  { state, dude }: { state: GhostState; dude: DudeState },
) {
  const { status, x, animation } = state;

  if (status === 'none') {
    return;
  }

  const rx = Math.round(x);

  let image;
  if (status === 'idle') {
    image = resources.images.ghostWalk;
  } else if (status === 'appear' || status === 'disappear') {
    image = resources.images.ghostAppear;
  }

  const [frameX, frameY, frameWidth, frameHeight] = animation.frame();

  ctx.drawImage(
    image,
    frameX,
    frameY,
    frameWidth,
    frameHeight,
    rx - frameWidth / 2,
    19,
    frameWidth,
    frameHeight,
  );
}

function updateGhost({
  state,
  deltaTime,
}: {
  state: GhostState;
  deltaTime: number;
}): GhostState {
  const { status, animation } = state;

  if (status === 'appear' || status === 'disappear') {
    animation.update(deltaTime);
  }

  return state;
}

function drawDudeDisappear(
  ctx,
  { state, dude }: { state: DudeDisappearState; dude: DudeState },
) {
  const { status, animation } = state;

  if (status === 'none') {
    return;
  }

  const rx = Math.round(dude.x);

  const image = resources.images.dudeDisappear;
  const [frameX, frameY, frameWidth, frameHeight] = animation.frame();

  ctx.drawImage(
    image,
    frameX,
    frameY,
    frameWidth,
    frameHeight,
    rx - frameWidth / 2,
    11,
    frameWidth,
    frameHeight,
  );
}

function updateDudeDisappear({
  state,
  deltaTime,
}: {
  state: DudeDisappearState;
  deltaTime: number;
}) {
  const { status, animation } = state;
  if (status === 'none') {
    return state;
  }
  animation.update(deltaTime);
  return state;
}

export function drawActRain(
  ctx,
  { state, lastTime }: { state: ActRainState; lastTime: number },
) {
  drawBench(ctx);
  drawDude(ctx, { state: state.dude, lastTime });
  drawUmbrella(ctx, { state: state.umbrella, dude: state.dude });
  drawGhost(ctx, { state: state.ghost, dude: state.dude });
  drawDudeDisappear(ctx, { state: state.dudeDisappear, dude: state.dude });
  drawRain(ctx, {
    state: state.rain,
    umbrella: state.umbrella,
    dude: state.dude,
  });
}

export function updateActRain({
  state,
  deltaTime,
}: {
  state: ActRainState;
  deltaTime: number;
}): ActRainState {
  let { dude, umbrella, rain, ghost, dudeDisappear, status, endTimer } = state;

  const isUp = inputController.isDown(InputControl.Up);

  dude = updateDude({ state: dude, deltaTime });
  umbrella = updateUmbrella({ state: umbrella });
  rain = updateRain({ state: rain, deltaTime });
  ghost = updateGhost({ state: ghost, deltaTime });
  dudeDisappear = updateDudeDisappear({ state: dudeDisappear, deltaTime });

  if (rain.startingTimer.isDone() && dude.status === 'sitting' && isUp) {
    dude.status = 'idle';
  }

  if (umbrella.status === 'idle' && dude.x <= 13) {
    umbrella.status = 'closed';
    dude.hand = 'holding-straight';
  }

  if (rain.status === 'full' && ghost.status === 'none') {
    ghost.status = 'appear';
    ghost.animation = GHOST_APPEAR_ANIMATION_SLOW.reset();
  }

  if (
    (dude.direction === 1 && dude.x >= 60 && dude.x <= 82) ||
    (dude.direction === -1 && dude.x >= 72)
  ) {
    if (umbrella.status === 'closed' && ghost.status !== 'appear') {
      ghost.status = 'appear';
      ghost.animation = GHOST_APPEAR_ANIMATION_.reset();
    } else if (umbrella.status === 'open' && ghost.status !== 'appear') {
      umbrella.walkedInOpened = true;
      ghost.status = 'appear';
      ghost.animation = GHOST_APPEAR_ANIMATION_.reset();
    } else if (umbrella.status === 'open') {
      umbrella.walkedInOpened = true;
    } else {
      if (umbrella.status === 'closed' && umbrella.walkedInOpened) {
        dudeDisappear.status = 'active';
        dude.status = 'none';
        umbrella.status = 'idle';
        rain.status = 'none';
        ghost.status = 'disappear';
        ghost.animation = GHOST_DISAPPEAR_ANIMATION_.reset();
        endTimer.update(deltaTime);
      }
    }
  } else if (dudeDisappear.status === 'none') {
    if (umbrella.status === 'open' && ghost.status !== 'disappear') {
      ghost.status = 'disappear';
      ghost.animation = GHOST_DISAPPEAR_ANIMATION_.reset();
    }

    if (umbrella.status === 'closed' && ghost.status !== 'appear') {
      ghost.status = 'appear';
      ghost.animation = GHOST_APPEAR_ANIMATION_.reset();
    }
  }

  if (endTimer.timeLeft < END_TIME) {
    endTimer.update(deltaTime);
    if (endTimer.isDone()) {
      status = 'ended';
    }
  }

  return { ...state, dude, umbrella, rain, ghost, dudeDisappear, status };
}
