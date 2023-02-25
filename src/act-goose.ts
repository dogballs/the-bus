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
import { COLOR } from './config';

const GOOSE_WALK_ANIMATION = new SheetAnimation(createSheet(16, 16, 2, 1), {
  loop: true,
  delay: 0.12,
});
const GOOSE_SCREAM_ANIMATION = new SheetAnimation(createSheet(16, 16, 3), {
  loop: true,
  delay: 0.5,
});
const GOSLING_WALK_ANIMATION = new SheetAnimation(createSheet(16, 16, 2, 1), {
  delay: 0.12,
  loop: true,
});
const GOSLING_STAND_ANIMATION = new SheetAnimation(createSheet(16, 16, 1));
const GOSLING_EATING_ANIMATION = new SheetAnimation(createSheet(16, 16, 2, 3), {
  loop: true,
  delay: 0.6,
});
const GOSLING_EATING_ANIMATION_ONCE = new SheetAnimation(
  createSheet(16, 16, 2, 3),
  {
    delay: 0.6,
  },
);
const ZILLA_WALK_ANIMATION = new SheetAnimation(createSheet(100, 80, 2, 1), {
  loop: true,
  delay: 0.2,
});
const ZILLA_EATING_ANIMATION_ONCE = new SheetAnimation(
  createSheet(100, 80, 2, 3),
  {
    delay: 0.6,
  },
);

const GOOSE_WALK_SPEED = 20;
const BREAD_FALL_SPEED = 70;
const CRUMB_FALL_SPEED = 30;
const ZILLA_WALK_SPEED = 30;

const BOY_VISION = 18;

type MomState = {
  status: 'walking' | 'walking-back' | 'screaming' | 'walking-final' | 'none';
  x: number;
  direction: number;
  animation: Animation<Sheet>;
};
const createDefaultMomState = (): MomState => ({
  status: 'walking',
  x: 100,
  direction: -1,
  animation: GOOSE_WALK_ANIMATION,
});

type KidsState = {
  kids: { status: 'walking'; x: number; animation: Animation<Sheet> }[];
};
const createDefaultKidsState = (): KidsState => ({
  kids: Array(2)
    .fill(0)
    .map((v, index) => ({
      status: 'walking',
      x: createDefaultMomState().x + 6 + index * 7,
      animation: new SheetAnimation(createSheet(16, 16, 2, 1), {
        loop: true,
        delay: 0.16,
      }),
    })),
});

type BoyState = {
  status: 'walking' | 'stop' | 'eating' | 'waiting' | 'walking-final' | 'none';
  x: number;
  animation: Animation<Sheet>;
  postStopTimer: Timer;
  crumbId: number;
};

const createDefaultBoyState = (): BoyState => ({
  status: 'walking',
  x: 140,
  animation: new SheetAnimation(createSheet(16, 16, 2, 1), {
    loop: true,
    delay: 0.16,
  }),
  postStopTimer: new Timer(2),
  crumbId: undefined,
});

type BreadState = {
  status: 'idle' | 'falling' | 'laying' | 'dude' | 'none';
  y: number;
  x: number;
};
const createDefaultBreadState = (): BreadState => ({
  status: 'idle',
  y: 22,
  x: 69,
});

type CrumbState = {
  status: 'none' | 'active';
  crumbs: { x: number; y: number; id: number; shouldRemove: boolean }[];
};
const createDefaultCrumbState = (): CrumbState => ({
  status: 'none',
  crumbs: [],
});

type ZillaState = {
  status: 'none' | 'walking' | 'eating' | 'walking-out';
  x: number;
  animation: Animation<Sheet>;
  leaveTimer: Timer;
};
const createDefaultZillaState = (): ZillaState => ({
  status: 'none',
  x: 200,
  animation: ZILLA_WALK_ANIMATION,
  leaveTimer: new Timer(0.5),
});

export type ActGooseState = {
  status: 'active' | 'ended';
  shake: boolean;
  endTimer: Timer;
  dude: DudeState;
  mom: MomState;
  kids: KidsState;
  boy: BoyState;
  bread: BreadState;
  crumb: CrumbState;
  zilla: ZillaState;
};

const END_TIME = 7;
export function createDefaultActGooseState(): ActGooseState {
  return {
    status: 'active',
    shake: false,
    endTimer: new Timer(END_TIME),
    dude: { ...createDefaultDudeState(), x: 30 },
    mom: createDefaultMomState(),
    kids: createDefaultKidsState(),
    boy: createDefaultBoyState(),
    bread: createDefaultBreadState(),
    crumb: createDefaultCrumbState(),
    zilla: createDefaultZillaState(),
  };
}

function drawMom(ctx, { state }: { state: MomState }) {
  const { x, animation, status, direction } = state;

  if (status === 'none') {
    return;
  }

  if (
    status === 'walking' ||
    status === 'walking-back' ||
    status === 'walking-final'
  ) {
    const image = resources.images.gooseWalk;

    const rx = Math.round(x);

    const [frameX, frameY, frameWidth, frameHeight] = animation.frame();

    if (direction === 1) {
      ctx.translate(rx + frameWidth / 2, 0);
      ctx.scale(-1, 1);
    }

    const destX = direction === 1 ? 0 : rx - frameWidth / 2;

    ctx.drawImage(
      image,
      frameX,
      frameY,
      frameWidth,
      frameHeight,
      destX,
      27,
      frameWidth,
      frameHeight,
    );

    if (direction === 1) {
      ctx.scale(-1, 1);
      ctx.translate(-(rx + frameWidth / 2), 0);
    }
  }

  if (status === 'screaming') {
    const image = resources.images.gooseScream;

    const rx = Math.round(x);

    const [frameX, frameY, frameWidth, frameHeight] = animation.frame();

    ctx.drawImage(
      image,
      frameX,
      frameY,
      frameWidth,
      frameHeight,
      rx,
      27,
      frameWidth,
      frameHeight,
    );
  }
}

function updateMom({
  state,
  deltaTime,
}: {
  state: MomState;
  deltaTime: number;
}): MomState {
  let { status, animation, x, direction } = state;

  if (status === 'none') {
    return state;
  }

  if (status === 'walking') {
    const xChange = GOOSE_WALK_SPEED * deltaTime;
    x -= xChange;

    if (x < -20) {
      status = 'walking-back';
    }

    animation.update(deltaTime);
  }

  if (status === 'walking-back') {
    const xChange = GOOSE_WALK_SPEED * deltaTime;
    direction = 1;
    x += xChange;

    animation.update(deltaTime);

    if (x >= 6) {
      x = 1;
      status = 'screaming';
      animation = GOOSE_SCREAM_ANIMATION.reset();
    }
  }

  if (status === 'walking-final') {
    const xChange = GOOSE_WALK_SPEED * deltaTime;
    x -= xChange;
    animation.update(deltaTime);

    if (x < -100) {
      status = 'none';
    }
  }

  if (status === 'screaming') {
    animation.update(deltaTime);
  }

  return {
    ...state,
    x,
    direction,
    status,
  };
}

function drawKids(ctx, { state }: { state: KidsState }) {
  const { kids } = state;

  for (const kid of kids) {
    const { x, animation } = kid;

    const image = resources.images.goslingWalk;

    const rx = Math.round(x);

    const [frameX, frameY, frameWidth, frameHeight] = animation.frame();

    ctx.drawImage(
      image,
      frameX,
      frameY,
      frameWidth,
      frameHeight,
      rx - frameWidth / 2,
      27,
      frameWidth,
      frameHeight,
    );
  }
}

function updateKids({
  state,
  deltaTime,
}: {
  state: KidsState;
  deltaTime: number;
}): KidsState {
  let { kids } = state;

  kids = kids.map((kid) => {
    let { x, animation } = kid;

    const xChange = GOOSE_WALK_SPEED * deltaTime;
    x -= xChange;

    animation.update(deltaTime);

    return { ...kid, x };
  });

  return { ...state, kids };
}

function drawBoy(ctx, { state }: { state: BoyState }) {
  const { status, x, animation } = state;

  if (status === 'none') {
    return;
  }

  const image = resources.images.goslingWalk;

  const rx = Math.round(x);

  const [frameX, frameY, frameWidth, frameHeight] = animation.frame();

  ctx.drawImage(
    image,
    frameX,
    frameY,
    frameWidth,
    frameHeight,
    rx - frameWidth / 2,
    27,
    frameWidth,
    frameHeight,
  );
}

function updateBoy({
  state,
  deltaTime,
  crumbState,
}: {
  state: BoyState;
  deltaTime: number;
  crumbState: CrumbState;
}): BoyState {
  let { status, animation, x, postStopTimer, crumbId } = state;

  if (status === 'none') {
    return state;
  }

  if (status === 'walking' && crumbId == null) {
    const xChange = GOOSE_WALK_SPEED * deltaTime;
    x -= xChange;
    animation.update(deltaTime);

    if (x <= 77) {
      status = 'stop';
      animation = GOSLING_STAND_ANIMATION.reset();
    }
  }

  if (status === 'stop') {
    postStopTimer.update(deltaTime);
    if (postStopTimer.isDone()) {
      status = 'eating';
      animation = GOSLING_EATING_ANIMATION.reset();
    }
  }

  if (status === 'eating' && crumbId == null) {
    animation.update(deltaTime);
  }

  if (status === 'waiting' && crumbId == null) {
    let closestIndex = -1;
    let closestDistance = Infinity;
    for (const [index, crumb] of crumbState.crumbs.entries()) {
      if (crumb.x >= x - BOY_VISION && crumb.x <= x + BOY_VISION) {
        const distance = Math.abs(x - crumb.x);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      }
    }
    const crumbInVision = crumbState.crumbs[closestIndex];
    if (crumbInVision) {
      crumbId = crumbInVision.id;
      status = 'walking';
      animation = GOSLING_WALK_ANIMATION.reset();
    }
  }

  if (status === 'walking' && crumbId != null) {
    const xChange = GOOSE_WALK_SPEED * deltaTime;
    const rx = Math.round(x);
    const eatX = x - 4;

    animation.update(deltaTime);

    const crumb = crumbState.crumbs.find((c) => c.id === crumbId);

    if (crumb.x < eatX) {
      x -= xChange;
    } else if (crumb.x > eatX) {
      x += xChange;
    }

    if (Math.abs(crumb.x - eatX) <= 1) {
      x = crumb.x + 4;
      status = 'eating';
      animation = GOSLING_EATING_ANIMATION_ONCE.reset();
    }
  }

  if (status === 'eating' && crumbId != null) {
    animation.update(deltaTime);
    if (animation.isComplete()) {
      const crumb = crumbState.crumbs.find((c) => c.id === crumbId);
      crumb.shouldRemove = true;
      status = 'waiting';
      animation = GOSLING_STAND_ANIMATION.reset();
      crumbId = null;
    }
  }

  if (status === 'walking-final') {
    const xChange = GOOSE_WALK_SPEED * deltaTime;
    x -= xChange;

    animation.update(deltaTime);

    if (x < -100) {
      status = 'none';
    }
  }

  return {
    ...state,
    x,
    status,
    animation,
    crumbId,
  };
}

function drawBread(
  ctx,
  { state, dude }: { state: BreadState; dude: DudeState },
) {
  const { status, x, y } = state;

  if (status === 'none') {
    return;
  }

  const image = resources.images.bread;

  const rx = Math.round(x);
  const ry = Math.round(y);

  if (status === 'idle') {
    ctx.drawImage(image, 0, 4, 15, 3, rx - 10, ry + 10, 15, 3);
  }
  if (status === 'falling') {
    ctx.drawImage(image, 0, 4, 15, 3, rx - 10, ry + 10, 15, 3);
    // ctx.drawImage(image, 0, 8, 8, 12, rx, ry + 12, 8, 12);
  }
  if (status === 'laying') {
    ctx.drawImage(image, 0, 0, 15, 3, rx - 10, ry + 10, 15, 3);
  }
  if (status === 'dude') {
    const dudeRx = Math.round(dude.x);
    const rx = dude.direction === 1 ? dudeRx + 10 : dudeRx - 10;
    const frameWidth = 10;

    if (dude.direction === -1) {
      ctx.translate(Math.round(rx + frameWidth / 2), 0);
      ctx.scale(-1, 1);
    }

    const destX = dude.direction === -1 ? 0 : Math.round(rx - frameWidth / 2);

    ctx.drawImage(image, 0, 0, frameWidth, 3, destX, 26, frameWidth, 3);

    if (dude.direction === -1) {
      ctx.scale(-1, 1);
      ctx.translate(-Math.round(rx + frameWidth / 2), 0);
    }
  }
}

function updateBread({
  state,
  deltaTime,
}: {
  state: BreadState;
  deltaTime: number;
}): BreadState {
  let { status, x, y } = state;

  if (status === 'none') {
    return state;
  }

  if (status === 'falling') {
    const yChange = BREAD_FALL_SPEED * deltaTime;
    y += yChange;

    if (y >= 30) {
      y = 30;
      status = 'laying';
    }
  }

  return {
    ...state,
    y,
    status,
  };
}

function drawCrumb(ctx, { state }: { state: CrumbState }) {
  const { crumbs } = state;

  for (const crumb of crumbs) {
    ctx.fillStyle = COLOR.A;
    ctx.fillRect(Math.round(crumb.x), Math.round(crumb.y), 1, 1);
  }
}

function updateCrumb({
  state,
  deltaTime,
  dude,
}: {
  state: CrumbState;
  deltaTime: number;
  dude: DudeState;
}): CrumbState {
  let { crumbs, status } = state;

  if (status === 'none') {
    return state;
  }

  crumbs = crumbs.map((crumb) => {
    let { y } = crumb;

    const yChange = CRUMB_FALL_SPEED * deltaTime;
    y += yChange;

    if (y >= 42) {
      y = 42;
    }

    return {
      ...crumb,
      y,
    };
  });
  crumbs = crumbs.filter((c) => !c.shouldRemove);

  const maxId = Math.max(...crumbs.map((c) => c.id), 0);

  const isDown = inputController.isDown(InputControl.Down);
  const anyFalling = crumbs.some((crumb) => crumb.y < 42);

  if (!anyFalling && isDown) {
    crumbs = [
      ...crumbs,
      {
        x: dude.direction === 1 ? dude.x + 13 : dude.x - 13,
        y: 28,
        id: maxId + 1,
        shouldRemove: false,
      },
    ];
  }

  return {
    ...state,
    crumbs,
  };
}

function drawZilla(ctx, { state }: { state: ZillaState }) {
  const { x, animation } = state;

  const image = resources.images.gosilla;

  const rx = Math.round(x);

  const [frameX, frameY, frameWidth, frameHeight] = animation.frame();

  ctx.drawImage(
    image,
    frameX,
    frameY,
    frameWidth,
    frameHeight,
    rx - frameWidth / 2,
    -32,
    frameWidth,
    frameHeight,
  );
}

function updateZilla({
  state,
  deltaTime,
}: {
  state: ZillaState;
  deltaTime: number;
}): ZillaState {
  let { status, animation, x } = state;

  if (status === 'none') {
    return state;
  }

  if (status === 'walking') {
    const xChange = ZILLA_WALK_SPEED * deltaTime;
    x -= xChange;

    animation.update(deltaTime);
  }

  if (status === 'eating') {
    animation.update(deltaTime);
    if (animation.isComplete()) {
      status = 'walking-out';
      animation = ZILLA_WALK_ANIMATION.reset();
    }
  }

  if (status === 'walking-out') {
    const xChange = ZILLA_WALK_SPEED * deltaTime;
    x -= xChange;

    animation.update(deltaTime);
  }

  return {
    ...state,
    x,
    status,
    animation,
  };
}

export function drawActGoose(
  ctx,
  { state, lastTime }: { state: ActGooseState; lastTime: number },
) {
  drawBench(ctx);
  drawDude(ctx, { state: state.dude, lastTime });
  drawMom(ctx, { state: state.mom });
  drawKids(ctx, { state: state.kids });
  drawBoy(ctx, { state: state.boy });
  drawBread(ctx, { state: state.bread, dude: state.dude });
  drawCrumb(ctx, { state: state.crumb });
  drawZilla(ctx, { state: state.zilla });
}

export function updateActGoose({
  state,
  deltaTime,
}: {
  state: ActGooseState;
  deltaTime: number;
}): ActGooseState {
  let { dude, mom, kids, boy, bread, crumb, zilla, endTimer, status, shake } =
    state;

  dude = updateDude({ state: dude, deltaTime });
  mom = updateMom({ state: mom, deltaTime });
  kids = updateKids({ state: kids, deltaTime });
  boy = updateBoy({ state: boy, deltaTime, crumbState: crumb });
  bread = updateBread({ state: bread, deltaTime });
  crumb = updateCrumb({ state: crumb, deltaTime, dude });
  zilla = updateZilla({ state: zilla, deltaTime });

  const isUp = inputController.isDown(InputControl.Up);
  const isDown = inputController.isDown(InputControl.Down);

  if (mom.x <= 44 && bread.status === 'idle') {
    bread.status = 'falling';
  }

  const isBreadRange =
    dude.direction === 1
      ? dude.x >= 55 && dude.x <= 70
      : dude.x >= 60 && dude.x <= 74;
  if (
    bread.status === 'laying' &&
    (dude.status === 'idle' || dude.status === 'walking') &&
    isDown &&
    isBreadRange
  ) {
    dude.status = 'crouch';
  }
  if (
    bread.status === 'laying' &&
    dude.status === 'crouch' &&
    isUp &&
    isBreadRange
  ) {
    dude.status = 'idle';
    dude.hand = 'holding-down';
    bread.status = 'dude';
  }
  if (bread.status === 'dude' && crumb.status !== 'active') {
    boy.status = 'waiting';
    boy.animation = GOSLING_STAND_ANIMATION.reset();
    crumb.status = 'active';
  }
  if (boy.x < 19 && mom.status === 'screaming') {
    mom.status = 'walking-final';
    mom.animation = GOOSE_WALK_ANIMATION.reset();
    mom.direction = -1;
    boy.status = 'walking-final';
    boy.animation = GOSLING_WALK_ANIMATION.reset();
  }

  if (boy.x < -30 && zilla.status === 'none') {
    zilla.status = 'walking';
    dude.status = 'idle';
    dude.walking = 'blocked';
    shake = true;
  }

  if (zilla.status === 'walking' && zilla.x - 22 <= dude.x) {
    shake = false;
    zilla.status = 'eating';
    zilla.animation = ZILLA_EATING_ANIMATION_ONCE.reset();
  }

  if (zilla.status === 'eating' && zilla.animation.index() === 1) {
    dude.status = 'none';
    bread.status = 'none';
    endTimer.update(deltaTime);
  }

  if (zilla.status === 'walking-out') {
    zilla.leaveTimer.update(deltaTime);
    if (zilla.leaveTimer.isDone()) {
      shake = true;
    }
  }

  if (endTimer.timeLeft < END_TIME) {
    endTimer.update(deltaTime);
    if (endTimer.isDone()) {
      shake = false;
      status = 'ended';
    }
  }

  return {
    ...state,
    dude,
    mom,
    kids,
    boy,
    bread,
    crumb,
    zilla,
    endTimer,
    status,
    shake,
  };
}
