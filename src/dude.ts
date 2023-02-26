import { Animation, SheetAnimation, createSheet, Sheet } from './animation';
import { resources, inputController } from './deps';
import { InputControl } from './input';
import { OW } from './config';

const WALK_SHEET = createSheet(16, 32, 3);
const SIT_SHEET = createSheet(16, 32, 1);
const CROUCH_SHEET = createSheet(16, 32, 1);

const CROUCH_ANIMATION = new SheetAnimation(CROUCH_SHEET);
const STAND_ANIMATION = new SheetAnimation(createSheet(16, 32, 1));
const CLIMB_ANIMATION_HIGH = new SheetAnimation(createSheet(16, 32, 2, 2), {
  loop: true,
  delay: 0.5,
});
const CLIMB_ANIMATION_LOW = new SheetAnimation(createSheet(16, 32, 2), {
  loop: true,
  delay: 0.5,
});

const WALK_SPEED = 16;
const CLIMB_SPEED = 10;

type DudeStatus = 'none' | 'idle' | 'walking' | 'sitting' | 'crouch' | 'climb';

export type DudeState = {
  status: DudeStatus;
  head: 'static' | 'bobbing';
  hand: 'static' | 'holding-down' | 'holding-straight';
  walking: 'active' | 'blocked';
  animation: Animation<Sheet>;
  x: number;
  y: number;
  direction: number;
  isUnderworld: boolean;
  controllable: boolean;
};

export const createDefaultDudeState = (): DudeState => ({
  status: 'idle',
  head: 'static',
  hand: 'static',
  walking: 'active',
  animation: STAND_ANIMATION,
  x: 10,
  y: 11,
  direction: 1,
  isUnderworld: false,
  controllable: true,
});

export function drawDude(
  ctx,
  { state, lastTime }: { state: DudeState; lastTime: number },
) {
  const { x, y, direction, animation, status, head, hand } = state;
  if (status === 'none') {
    return;
  }

  const rx = Math.round(x);
  const ry = Math.round(y);

  if (status === 'climb') {
    const image = resources.images.dudeClimb;
    const [frameX, frameY, frameWidth, frameHeight] = animation.frame();

    ctx.drawImage(
      image,
      frameX,
      frameY,
      frameWidth,
      frameHeight,
      rx - frameWidth / 2,
      ry,
      frameWidth,
      frameHeight,
    );
    return;
  }

  const dstHeadHeight = 12;
  let dstHeadYOff = 0;
  let dstHandYOff = 0;
  let srcHeadY = 12;

  let image;
  let destY;
  let frame = animation.frame();
  if (status === 'idle' || status === 'walking') {
    image = resources.images.dudeWalk;
    destY = 11;
    dstHandYOff = 13;
  } else if (status === 'sitting') {
    image = resources.images.dudeSitting;
    frame = SIT_SHEET[0];
    destY = 12;
    srcHeadY = 14;
    dstHeadYOff = 2;
    dstHandYOff = 15;
  } else if (status === 'crouch') {
    frame = CROUCH_SHEET[0];
    image = resources.images.dudeCrouch;
    destY = 13;
    srcHeadY = 16;
    dstHeadYOff = 4;
    dstHandYOff = 17;
  }

  const [frameX, frameY, frameWidth, frameHeight] = frame;

  if (direction === -1) {
    ctx.translate(rx + frameWidth / 2, 0);
    ctx.scale(-1, 1);
  }

  const destX = direction === -1 ? 0 : rx - frameWidth / 2;

  const headImage = resources.images.dudeHeadBob;

  ctx.drawImage(
    image,
    frameX,
    frameY + srcHeadY,
    frameWidth,
    frameHeight - dstHeadHeight,
    destX,
    destY + srcHeadY,
    frameWidth,
    frameHeight - dstHeadHeight,
  );

  if (head === 'static') {
    ctx.drawImage(headImage, 0, 0, 16, 16, destX, destY + dstHeadYOff, 16, 16);
  } else if (head === 'bobbing') {
    const srcX = Math.round(lastTime / 0.22) % 2 === 0 ? 0 : 16;
    ctx.drawImage(
      headImage,
      srcX,
      0,
      16,
      16,
      destX,
      destY + dstHeadYOff,
      16,
      16,
    );
  }

  const handImage = resources.images.dudeHand;
  if (hand === 'static') {
    ctx.drawImage(handImage, 0, 0, 1, 8, destX + 5, destY + dstHandYOff, 1, 8);
    ctx.drawImage(handImage, 0, 0, 1, 8, destX + 10, destY + dstHandYOff, 1, 8);
  } else if (hand === 'holding-down') {
    ctx.drawImage(handImage, 0, 0, 1, 8, destX + 5, destY + dstHandYOff, 1, 8);
    ctx.drawImage(handImage, 2, 0, 6, 8, destX + 10, destY + dstHandYOff, 6, 8);
  } else if (hand === 'holding-straight') {
    ctx.drawImage(handImage, 0, 0, 1, 8, destX + 5, destY + dstHandYOff, 1, 8);
    ctx.drawImage(handImage, 9, 0, 6, 8, destX + 10, destY + dstHandYOff, 6, 8);
  }

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
  let {
    status,
    x,
    y,
    direction,
    animation,
    walking,
    isUnderworld,
    controllable,
  } = state;

  if (status === 'none' || status === 'sitting' || status === 'crouch') {
    return state;
  }

  const isLeft = inputController.isHold(InputControl.Left) && controllable;
  const isRight = inputController.isHold(InputControl.Right) && controllable;
  const isUp = inputController.isHold(InputControl.Up) && controllable;
  const isDown = inputController.isHold(InputControl.Down) && controllable;

  if (status === 'climb') {
    const yChange = CLIMB_SPEED * deltaTime;
    if (isDown) {
      animation.update(deltaTime);
      y += yChange;
    } else if (isUp) {
      animation.update(deltaTime);
      y -= yChange;
    }
    if (isUnderworld) {
      y = Math.min(y, 11);
    } else {
      y = Math.max(y, 11);
    }

    if (isUnderworld) {
      if (y >= 11) {
        y = 11;
        status = 'idle';
      }
    } else {
      if (y <= 11) {
        y = 11;
        status = 'idle';
      }
    }

    if (isUnderworld) {
      animation = CLIMB_ANIMATION_LOW;
    } else {
      if (y < 24) {
        animation = CLIMB_ANIMATION_HIGH;
      } else {
        animation = CLIMB_ANIMATION_LOW;
      }
    }

    return { ...state, status, y, animation };
  }

  const xChange = WALK_SPEED * deltaTime;

  if (walking === 'active') {
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
      animation = new SheetAnimation(WALK_SHEET, { loop: true, delay: 0.12 });
    }
    animation.update(deltaTime);
  }

  if (status === 'idle') {
    animation = STAND_ANIMATION;
  }

  return {
    ...state,
    status,
    x,
    direction,
    animation,
  };
}
