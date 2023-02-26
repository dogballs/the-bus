import {
  Animation,
  createSheet,
  Sheet,
  SheetAnimation,
  Timer,
} from './animation';
import {
  createDefaultDudeState,
  drawDude,
  DudeState,
  updateDude,
} from './dude';
import { drawBench } from './bench';
import { inputController, resources } from './deps';
import { InputControl } from './input';
import { COLOR, IH, IW, OH, OW } from './config';

const MIDGET_WALK_ANIMATION = new SheetAnimation(createSheet(16, 32, 3), {
  loop: true,
  delay: 0.12,
});
const MIDGET_CLIMB_SPEED = 6;
const MIDGET_WALK_SPEED = 10;

const MANHOLE_DISAPPEAR_ANIMATION = new SheetAnimation(createSheet(16, 8, 6), {
  delay: 0.3,
});

let offCanvas;
if (window.OffscreenCanvas) {
  offCanvas = new OffscreenCanvas(IW, IH);
} else {
  offCanvas = document.createElement('canvas');
  offCanvas.width = IW;
  offCanvas.height = IH;
}
const offCtx = offCanvas.getContext('2d');
offCtx.imageSmoothingEnabled = false;

type MidgetState = {
  status: 'none' | 'climb' | 'walking';
  x: number;
  y: number;
  animation: Animation<Sheet>;
};
const createDefaultMidgetState = (): MidgetState => ({
  status: 'none',
  x: 5,
  y: 40,
  animation: new SheetAnimation(createSheet(16, 32, 2), {
    loop: true,
    delay: 0.4,
  }),
});

type ManholeState = {
  status: 'idle' | 'appear' | 'full' | 'disappear' | 'none';
  animation: Animation<Sheet>;
  appearTimer: Timer;
};
const createDefaultManholeState = (): ManholeState => ({
  status: 'idle',
  animation: new SheetAnimation(createSheet(16, 8, 6).reverse(), {
    delay: 0.3,
  }),
  appearTimer: new Timer(0),
});

export type ActOutroState = {
  status: 'active' | 'ended';
  shake: false;
  endTimer: Timer;
  dude: DudeState;
  clone: DudeState;
  midget: MidgetState;
  manhole: ManholeState;
  isUnderworld: boolean;
};

const END_TIME = 3;
export function createDefaultActOutroState(): ActOutroState {
  return {
    status: 'active',
    shake: false,
    endTimer: new Timer(END_TIME),
    dude: {
      ...createDefaultDudeState(),
      x: 63,
      status: 'sitting',
      direction: -1,
    },
    clone: {
      ...createDefaultDudeState(),
      x: 63,
      status: 'sitting',
      direction: -1,
      controllable: false,
      isUnderworld: true,
    },
    midget: createDefaultMidgetState(),
    manhole: createDefaultManholeState(),
    isUnderworld: false,
  };
}

function drawManhole(ctx, { state }: { state: ManholeState }) {
  const { status, animation } = state;

  if (status === 'none') {
    return;
  }

  if (status === 'appear' || status === 'disappear') {
    const image = resources.images.manholeAppear;
    const [frameX, frameY, frameWidth, frameHeight] = animation.frame();
    ctx.drawImage(
      image,
      frameX,
      frameY,
      frameWidth,
      frameHeight,
      5,
      35,
      frameWidth,
      frameHeight,
    );
  }

  if (status === 'full') {
    ctx.drawImage(resources.images.manhole, 0, 0, 16, 8, 5, 35, 16, 8);
  }
}

function updateManhole({
  state,
  deltaTime,
}: {
  state: ManholeState;
  deltaTime: number;
}): ManholeState {
  let { status, animation, appearTimer } = state;

  if (status === 'none') {
    return state;
  }

  if (status === 'idle') {
    appearTimer.update(deltaTime);
    if (appearTimer.isDone()) {
      status = 'appear';
    }
  }

  if (status === 'appear') {
    animation.update(deltaTime);
    if (animation.isComplete()) {
      status = 'full';
    }
  }

  if (status === 'disappear') {
    animation.update(deltaTime);
    if (animation.isComplete()) {
      status = 'none';
    }
  }

  return { ...state, status, appearTimer };
}

function drawUnderworldLadder(ctx) {
  ctx.drawImage(resources.images.manhole, 0, 0, 16, 50, 5, -10, 16, 50);
}

function drawUnderworldBackground(ctx) {
  ctx.fillStyle = COLOR.A;
  ctx.fillRect(0, 0, OW, OH);
}

function drawSneakyPatch(ctx) {
  ctx.fillStyle = COLOR.B;
  ctx.fillRect(0, 43, OW, OH);
}

function drawTree(ctx) {
  ctx.drawImage(resources.images.tree, 0, 0, 64, 48, 56, -2, 54, 48);
}

function drawWithSwappedFill(ctx, drawFn: (otherCtx) => void) {
  offCtx.globalCompositeOperation = 'source-over';
  offCtx.clearRect(0, 0, OW, OH);

  drawFn(offCtx);

  offCtx.globalCompositeOperation = 'source-atop';

  offCtx.fillStyle = COLOR.B;
  offCtx.fillRect(0, 0, OW, OH);

  offCtx.globalCompositeOperation = 'source-over';

  ctx.drawImage(offCanvas, 0, 0);
}

function drawMidget(ctx, { state }: { state: MidgetState }) {
  const { x, y, animation, status } = state;

  if (status === 'none') {
    return;
  }

  const rx = Math.round(x);
  const ry = Math.round(y);

  let image;
  if (status === 'climb') {
    image = resources.images.midgetClimb;
  } else {
    image = resources.images.midgetWalk;
  }

  const [frameX, frameY, frameWidth, frameHeight] = animation.frame();

  ctx.drawImage(
    image,
    frameX,
    frameY,
    frameWidth,
    frameHeight,
    rx,
    ry,
    frameWidth,
    frameHeight,
  );
}

function updateMidget({
  state,
  deltaTime,
}: {
  state: MidgetState;
  deltaTime: number;
}): MidgetState {
  let { x, y, status, animation } = state;

  if (status === 'none') {
    return state;
  }

  if (status === 'climb') {
    animation.update(deltaTime);
    const yChange = MIDGET_CLIMB_SPEED * deltaTime;
    y -= yChange;
    if (y <= 11) {
      y = 11;
      status = 'walking';
      animation = MIDGET_WALK_ANIMATION;
    }
  }

  if (status === 'walking') {
    const xChange = MIDGET_WALK_SPEED * deltaTime;
    x -= xChange;
    animation.update(deltaTime);
    if (x < -10) {
      status = 'none';
    }
  }

  return {
    ...state,
    x,
    y,
    status,
    animation,
  };
}

export function drawActOutro(
  ctx,
  { state, lastTime }: { state: ActOutroState; lastTime: number },
) {
  const { isUnderworld } = state;

  if (isUnderworld) {
    drawUnderworldBackground(ctx);
    drawWithSwappedFill(ctx, (otherCtx) => drawBench(otherCtx));
    drawWithSwappedFill(ctx, (otherCtx) => drawUnderworldLadder(otherCtx));
    drawWithSwappedFill(ctx, (otherCtx) => {
      drawDude(otherCtx, { state: state.dude, lastTime });
    });
    drawWithSwappedFill(ctx, (otherCtx) => {
      drawDude(otherCtx, { state: state.clone, lastTime });
    });
    drawWithSwappedFill(ctx, (otherCtx) => {
      drawTree(otherCtx);
    });
  } else {
    drawBench(ctx);
    drawMidget(ctx, { state: state.midget });

    if (state.dude.controllable) {
      drawDude(ctx, { state: state.dude, lastTime });
    } else {
      drawDude(ctx, { state: state.clone, lastTime });
    }

    drawManhole(ctx, { state: state.manhole });
    drawSneakyPatch(ctx);
  }
}

export function updateActOutro({
  state,
  deltaTime,
}: {
  state: ActOutroState;
  deltaTime: number;
}) {
  let { isUnderworld, dude, clone, midget, manhole, status, endTimer } = state;

  dude = updateDude({ state: dude, deltaTime });
  clone = updateDude({ state: clone, deltaTime });
  midget = updateMidget({ state: midget, deltaTime });
  manhole = updateManhole({ state: manhole, deltaTime });

  const isUp = inputController.isDown(InputControl.Up);
  const isDown = inputController.isDown(InputControl.Down);

  if (manhole.status === 'appear') {
    midget.status = 'climb';
  }

  if (dude.status === 'sitting' && dude.controllable && isUp) {
    dude.status = 'idle';
  }

  const active = () => (dude.controllable ? dude : clone);

  const isManholeRange = active().x >= 8 && active().x <= 18;
  if (
    isDown &&
    isManholeRange &&
    active().status !== 'climb' &&
    manhole.status === 'full'
  ) {
    active().status = 'climb';
  }
  if (
    isUp &&
    isManholeRange &&
    active().status !== 'climb' &&
    manhole.status === 'full' &&
    isUnderworld
  ) {
    active().status = 'climb';
  }

  if (active().y < -20 && isUnderworld) {
    isUnderworld = false;
    active().isUnderworld = false;
    active().y = 40;
  }
  if (active().y > 40 && !isUnderworld) {
    isUnderworld = true;
    active().isUnderworld = true;
    active().y = -20;
  }

  if (isUnderworld) {
    const isSittingRange = dude.x >= 47 && dude.x < 54;
    if (
      (dude.status === 'walking' || dude.status === 'idle') &&
      isDown &&
      isSittingRange
    ) {
      dude.status = 'sitting';
      dude.controllable = false;
      clone.controllable = true;
    }

    if (clone.status === 'sitting' && isUp) {
      clone.status = 'idle';
    }
  }

  if (
    !clone.isUnderworld &&
    clone.status !== 'climb' &&
    manhole.status === 'full'
  ) {
    manhole.status = 'disappear';
    manhole.animation = MANHOLE_DISAPPEAR_ANIMATION.reset();
  }

  const isSittingRange = clone.x >= 47 && clone.x < 65;
  if (
    !clone.isUnderworld &&
    isSittingRange &&
    isDown &&
    clone.status !== 'sitting'
  ) {
    clone.status = 'sitting';
    clone.controllable = false;
    endTimer.update(deltaTime);
  }

  if (endTimer.timeLeft < END_TIME) {
    endTimer.update(deltaTime);
    if (endTimer.isDone()) {
      status = 'ended';
    }
  }

  return {
    ...state,
    dude,
    clone,
    midget,
    manhole,
    status,
    endTimer,
    isUnderworld,
  };
}
