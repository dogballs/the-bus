import { defaultDudeState, drawDude, DudeState, updateDude } from './dude';
import { inputController, resources } from './deps';
import { Animation, createSheet, Sheet, SheetAnimation } from './animation';
import { InputControl } from './input';

const SMOKER_WALK_SHEET = createSheet(16, 32, 3);
const SMOKER_SIT_DOWN_SHEET = createSheet(24, 32, 1);
const SMOKER_START_SMOKE_SHEET = createSheet(24, 32, 3, 1);
const SMOKER_SMOKING_SHEET = createSheet(24, 32, 5, 3);
const SMOKER_STOP_SMOKE_SHEET = createSheet(24, 32, 6, 5);
const SMOKER_TRANSFORM_SHEET = createSheet(16, 32, 7);
const CIG_SHEET = createSheet(12, 12, 2);
const DUDE_TRANSFORM_SHEET = createSheet(16, 32, 8);
const SMOKER_WALK_SPEED = 14;

export type SmokerState = {
  status:
    | 'walk-to-sit'
    | 'sit-down'
    | 'start-smoke'
    | 'smoking'
    | 'stop-smoking'
    | 'walk-away'
    | 'none'
    | 'transform';
  animation: Animation<Sheet>;
  x: number;
};

const defaultSmokerState: SmokerState = {
  status: 'walk-to-sit',
  animation: new SheetAnimation(SMOKER_WALK_SHEET, { loop: true, delay: 0.16 }),
  x: 40,
};

type CigState = {
  status: 'none' | 'ground' | 'dude' | 'trash';
  animation: Animation<Sheet>;
  x: number;
};

const defaultCigState: CigState = {
  status: 'none',
  animation: new SheetAnimation(CIG_SHEET, { loop: true, delay: 0.3 }),
  x: 75,
};

type DudeTransformState = {
  status: 'none' | 'active';
  animation: Animation<Sheet>;
  x: number;
};

const defaultDudeTransformState: DudeTransformState = {
  status: 'none',
  animation: new SheetAnimation(DUDE_TRANSFORM_SHEET, { delay: 0.4 }),
  x: 0,
};

type TrashState = {
  status: 'full' | 'spot';
};

type ActSmokeState = {
  status: 'intro';
  trash: TrashState;
  smoker: SmokerState;
  dude: DudeState;
  dudeTransform: DudeTransformState;
  cig: CigState;
};

export const defaultActSmokeState: ActSmokeState = {
  status: 'intro',
  trash: { status: 'full' },
  dude: { ...defaultDudeState, x: 28 },
  dudeTransform: defaultDudeTransformState,
  smoker: defaultSmokerState,
  cig: defaultCigState,
};

function drawBench(ctx) {
  ctx.drawImage(resources.images.bench, 40, 34);
}

function drawTrashbin(ctx, { state }: { state: TrashState }) {
  if (state.status === 'spot') {
    ctx.drawImage(resources.images.trashspot, 10, 31);
    return;
  }

  ctx.drawImage(resources.images.trashbin, 10, 31);
}

function drawSmoker(ctx, { state }: { state: ActSmokeState }) {
  const { x, animation, status } = state.smoker;

  if (status === 'none') {
    return;
  }

  const rx = Math.round(x);

  let image;
  let destY;
  if (status === 'walk-to-sit' || status === 'walk-away') {
    image = resources.images.smokerWalk;
    destY = 11;
  } else if (
    status === 'sit-down' ||
    status === 'start-smoke' ||
    status === 'smoking' ||
    status === 'stop-smoking'
  ) {
    image = resources.images.smokerSitting;
    destY = 15;
  } else if (status === 'transform') {
    image = resources.images.smokerTransform;
    destY = 11;
  }

  const [frameX, frameY, frameWidth, frameHeight] = animation.frame();

  ctx.drawImage(
    image,
    frameX,
    frameY,
    frameWidth,
    frameHeight,
    rx - frameWidth / 2,
    destY,
    frameWidth,
    frameHeight,
  );
}

function drawCig(ctx, { state, dude }: { state: CigState; dude: DudeState }) {
  const { x, animation, status } = state;
  if (status === 'none' || status === 'trash') {
    return;
  }

  let rx = Math.round(x);
  let y = 33;

  if (status === 'dude') {
    y = 22;
    const dudeRx = Math.round(dude.x);
    rx = dude.direction === 1 ? dudeRx + 5 : dudeRx - 5;
  }

  const image = resources.images.cig;

  const [frameX, frameY, frameWidth, frameHeight] = animation.frame();

  if (dude.direction === -1) {
    ctx.translate(rx + frameWidth / 2, 0);
    ctx.scale(-1, 1);
  }

  const destX = dude.direction === -1 ? 0 : rx - frameWidth / 2;

  ctx.drawImage(
    image,
    frameX,
    frameY,
    frameWidth,
    frameHeight,
    destX,
    y,
    frameWidth,
    frameHeight,
  );

  if (dude.direction === -1) {
    ctx.scale(-1, 1);
    ctx.translate(-(rx + frameWidth / 2), 0);
  }
}

function drawDudeTransform(
  ctx,
  { state, dude }: { state: DudeTransformState; dude: DudeState },
) {
  const { x, status, animation } = state;
  if (status === 'none') {
    return;
  }

  const rx = Math.round(x);

  const image = resources.images.dudeTransformTrash;

  const [frameX, frameY, frameWidth, frameHeight] = animation.frame();

  if (dude.direction === -1) {
    ctx.translate(rx + frameWidth / 2, 0);
    ctx.scale(-1, 1);
  }

  const destX = dude.direction === -1 ? 0 : rx - frameWidth / 2;

  ctx.drawImage(
    image,
    frameX,
    frameY,
    frameWidth,
    frameHeight,
    destX,
    11,
    frameWidth,
    frameHeight,
  );

  if (dude.direction === -1) {
    ctx.scale(-1, 1);
    ctx.translate(-(rx + frameWidth / 2), 0);
  }
}

export function drawActSmoke(ctx, { state }) {
  drawBench(ctx);
  drawTrashbin(ctx, { state: state.trash });
  drawSmoker(ctx, { state });
  drawCig(ctx, { state: state.cig, dude: state.dude });
  drawDude(ctx, { state: state.dude });
  drawDudeTransform(ctx, { state: state.dudeTransform, dude: state.dude });
}

function updateSmoker({
  state,
  dude,
  deltaTime,
}: {
  state: SmokerState;
  dude: DudeState;
  deltaTime: number;
}): SmokerState {
  let { x, animation, status } = state;

  const xChange = SMOKER_WALK_SPEED * deltaTime;
  x += xChange;

  if (status === 'walk-to-sit') {
    if (x > 62) {
      return {
        ...state,
        status: 'sit-down',
        animation: new SheetAnimation(SMOKER_SIT_DOWN_SHEET, { delay: 1 }),
      };
    }

    animation.update(deltaTime);

    return {
      ...state,
      x,
      animation,
    };
  }

  if (status === 'sit-down') {
    animation.update(deltaTime);
    if (animation.isComplete()) {
      return {
        ...state,
        status: 'start-smoke',
        animation: new SheetAnimation(SMOKER_START_SMOKE_SHEET, { delay: 0.5 }),
      };
    }
    return { ...state, animation };
  }

  if (status === 'start-smoke') {
    animation.update(deltaTime);
    if (animation.isComplete()) {
      return {
        ...state,
        status: 'smoking',
        animation: new SheetAnimation(SMOKER_SMOKING_SHEET, {
          loop: true,
          delay: 0.4,
        }),
      };
    }
    return { ...state, animation };
  }

  if (status === 'smoking') {
    if (dude.status === 'sitting') {
      return {
        ...state,
        status: 'stop-smoking',
        animation: new SheetAnimation(SMOKER_STOP_SMOKE_SHEET, {
          delay: 0.3,
        }),
      };
    }
    animation.update(deltaTime);
    return { ...state, animation };
  }

  if (status === 'stop-smoking') {
    if (animation.isComplete()) {
      return {
        ...state,
        status: 'walk-away',
        animation: new SheetAnimation(SMOKER_WALK_SHEET, {
          loop: true,
          delay: 0.16,
        }),
      };
    }
    animation.update(deltaTime);
    return { ...state, animation };
  }

  if (status === 'walk-away') {
    animation.update(deltaTime);

    if (x > 100) {
      return {
        ...state,
        status: 'none',
      };
    }

    return {
      ...state,
      x,
      animation,
    };
  }

  if (status === 'transform') {
    animation.update(deltaTime);
    if (animation.isComplete()) {
      return {
        ...state,
        status: 'walk-to-sit',
        animation: new SheetAnimation(SMOKER_WALK_SHEET, {
          loop: true,
          delay: 0.3,
        }),
      };
    }
    return { ...state, animation };
  }

  return state;
}

function updateCig({
  state,
  deltaTime,
}: {
  state: CigState;
  deltaTime: number;
}) {
  const { animation } = state;

  animation.update(deltaTime);

  return {
    ...state,
    animation,
  };
}

function updateDudeTransform({
  state,
  deltaTime,
}: {
  state: DudeTransformState;
  deltaTime: number;
}) {
  let { status, animation } = state;
  if (status === 'none') {
    return state;
  }

  animation.update(deltaTime);

  return {
    ...state,
    animation,
  };
}

export function updateActSmoke({
  state,
  deltaTime,
}: {
  state: ActSmokeState;
  deltaTime: number;
}) {
  let { smoker, dude, dudeTransform, cig, trash } = state;

  smoker = updateSmoker({ state: smoker, deltaTime, dude });
  cig = updateCig({ state: cig, deltaTime });
  dude = updateDude({ state: dude, deltaTime });
  dudeTransform = updateDudeTransform({ state: dudeTransform, deltaTime });

  const isUp = inputController.isDown(InputControl.Up);
  const isDown = inputController.isDown(InputControl.Down);
  const isSittingRange = dude.x >= 47 && dude.x < 54;
  if (
    (dude.status === 'walking' || dude.status === 'idle') &&
    isDown &&
    isSittingRange
  ) {
    dude.status = 'sitting';
  }

  if (dude.status === 'sitting' && isUp) {
    dude.status = 'walking';
  }

  if (smoker.status === 'walk-away') {
    if (cig.status === 'none') {
      cig.status = 'ground';
    }
  }

  if (cig.status === 'ground') {
    const isPickingRange = dude.x >= 69 && dude.x < 76;

    if (isDown && isPickingRange) {
      dude.status = 'crouch';
    }

    if (dude.status === 'crouch' && isUp) {
      cig.status = 'dude';
      dude.status = 'walking';
    }
  }

  if (cig.status === 'dude') {
    const isTrashingRange = dude.x >= 10 && dude.x < 22;

    if (isDown && isTrashingRange) {
      if (trash.status === 'full') {
        cig.status = 'none';
        trash.status = 'spot';

        smoker.status = 'transform';
        smoker.animation = new SheetAnimation(SMOKER_TRANSFORM_SHEET, {
          delay: 0.4,
        });
        smoker.x = 13;
      } else if (trash.status === 'spot') {
        cig.status = 'none';
        dude.status = 'none';
        dudeTransform.status = 'active';
        dudeTransform.x = dude.x;
      }
    }
  }

  return {
    ...state,
    trash,
    smoker,
    dude,
    dudeTransform,
    cig,
  };
}
