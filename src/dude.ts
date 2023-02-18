import { Animation, FrameAnimation, NullAnimation } from './animation';
import { resources, inputController } from './deps';
import { InputControl } from './input';
import { OW } from './config';

type Sheet = [number, number, number, number];

const WALK_SHEET: Sheet[] = [
  [0, 0, 16, 32],
  [16, 0, 16, 32],
  [32, 0, 16, 32],
];

const WALK_SPEED = 20;

type DudeStatus = 'idle' | 'walking';

type DudeState = {
  status: DudeStatus;
  animation: Animation<Sheet>;
  x: number;
  direction: number;
};

export const defaultDudeState: DudeState = {
  status: 'idle',
  animation: new NullAnimation(),
  x: 10,
  direction: 1,
};

export function drawDude(ctx, { state }: { state: DudeState }) {
  const { x, direction, animation } = state;

  const rx = Math.round(x);

  const image = resources.images.dudeWalk;
  const frameRect = WALK_SHEET[animation.index()];
  const [frameX, frameY, frameWidth, frameHeight] = frameRect;

  if (direction === -1) {
    ctx.translate(rx + frameWidth / 2, 0);
    ctx.scale(-1, 1);
  }

  const destX = direction === -1 ? 0 : rx - frameWidth / 2;

  ctx.drawImage(
    image,
    frameX,
    frameY,
    frameWidth,
    frameHeight,
    destX,
    10,
    frameWidth,
    frameHeight,
  );

  if (direction === -1) {
    ctx.scale(-1, 1);
    ctx.translate(-(rx + frameWidth / 2), 0);
  }
}

export function updateDude({
  state,
  deltaTime,
}: {
  state: DudeState;
  deltaTime: number;
}): DudeState {
  const isLeft = inputController.isHold(InputControl.Left);
  const isRight = inputController.isHold(InputControl.Right);

  let { status, x, direction, animation } = state;

  const xChange = WALK_SPEED * deltaTime;

  if (isLeft) {
    x -= xChange;
    status = 'walking';
    direction = -1;
  } else if (isRight) {
    x += xChange;
    status = 'walking';
    direction = 1;
  } else {
    status = 'idle';
  }
  x = Math.max(x, 0);
  x = Math.min(x, OW);

  if (status === 'walking' && state.status !== 'walking') {
    animation = new FrameAnimation(WALK_SHEET, { loop: true, delay: 0.06 });
  }
  if (status === 'idle' && state.status !== 'idle') {
    animation = new NullAnimation();
  }

  animation.update(deltaTime);

  return {
    ...state,
    status,
    x,
    direction,
    animation,
  };
}
