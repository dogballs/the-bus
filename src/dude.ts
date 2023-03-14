import { Animation, SheetAnimation, Timer } from './animation';
import { inputController, resources } from './deps';
import { createSheet, drawDirectionSheet, drawSheet, Sheet } from './sprite';
import { InputControl } from './input';
import { Subject } from './subject';
import { OW } from './config';
import { DrawArgs, UpdateArgs } from './types';
import { State, StateMachine } from './state';

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
  direction: 1 | -1;
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

const DUDE_START_X = 10;

export class Dude {
  state: StateMachine<Dude> = new StateMachine(new DudeIdleState(this));
  readonly hand = new Hand(this);
  readonly head = new Head(this);

  x: number;
  y = 11;
  direction: 1 | -1 = 1;
  allow: {
    control: boolean;
    sit: boolean;
  } = {
    control: true,
    sit: false,
  };

  walkStart = new Subject<null>();
  sitStart = new Subject<null>();
  sitEnd = new Subject<null>();
  suckStart = new Subject<null>();
  suckEnd = new Subject<null>();

  constructor({ x = DUDE_START_X }: { x?: number } = {}) {
    this.x = x;
  }

  update(updateArgs: UpdateArgs) {
    this.state.update(updateArgs);
  }

  draw(drawArgs: DrawArgs) {
    if (this.state.is(DudeNoneState)) {
      return;
    }

    this.state.draw(drawArgs);
    this.hand.draw(drawArgs);
    this.head.draw(drawArgs);
  }

  get rx() {
    return Math.round(this.x);
  }

  get ry() {
    return Math.round(this.y);
  }

  bobHead() {
    this.head.bob();
  }

  receiveCassette({ x }: { x: number }) {
    this.state.transition(new DudeReceiveCassetteState(this));
    this.x = x;
  }

  isSit() {
    return this.state.is(DudeSitState);
  }
}

class DudeNoneState extends State<Dude> {}

class DudeIdleState extends State<Dude> {
  private animation = new SheetAnimation(createSheet(16, 32, 1));

  update({ inputController }: UpdateArgs) {
    const isLeft = inputController.isHold(InputControl.Left);
    const isRight = inputController.isHold(InputControl.Right);
    const isDown = inputController.isHold(InputControl.Down);

    if (isLeft || isRight) {
      return new DudeWalkState(this.context);
    }

    if (this.context.allow.sit && isDown) {
      return new DudeSitState(this.context);
    }
  }

  draw({ ctx, images }: DrawArgs) {
    const headY = 12;
    const [frameX, frameY, frameWidth, frameHeight] = this.animation.frame();

    drawDirectionSheet(
      ctx,
      images.dudeWalk,
      [frameX, frameY + headY, frameWidth, frameHeight],
      {
        x: this.context.rx,
        y: 11 + headY,
        direction: this.context.direction,
      },
    );
  }
}

class DudeWalkState extends State<Dude> {
  private animation = new SheetAnimation(WALK_SHEET, {
    loop: true,
    delay: 0.12,
  });

  enter() {
    this.context.walkStart.notify(null);
  }

  update({ deltaTime, inputController }: UpdateArgs) {
    if (!this.context.allow.control) {
      return;
    }

    const isDown = inputController.isHold(InputControl.Down);
    if (this.context.allow.sit && isDown) {
      return new DudeSitState(this.context);
    }

    const isLeft = inputController.isHold(InputControl.Left);
    const isRight = inputController.isHold(InputControl.Right);
    if (!isLeft && !isRight) {
      return new DudeIdleState(this.context);
    }

    let { x, direction } = this.context;

    const xChange = WALK_SPEED * deltaTime;
    if (isLeft) {
      x -= xChange;
      direction = -1;
    } else if (isRight) {
      x += xChange;
      direction = 1;
    }
    // Limit to screen bounds
    x = Math.max(x, 0);
    x = Math.min(x, OW);

    this.context.x = x;
    this.context.direction = direction;

    this.animation.update(deltaTime);
  }

  draw({ ctx, images }: DrawArgs) {
    const headY = 12;
    const [frameX, frameY, frameWidth, frameHeight] = this.animation.frame();

    drawDirectionSheet(
      ctx,
      images.dudeWalk,
      [frameX, frameY + headY, frameWidth, frameHeight],
      {
        x: this.context.rx,
        y: 11 + headY,
        direction: this.context.direction,
      },
    );
  }
}

class DudeSitState extends State<Dude> {
  private sheet = createSheet(16, 32, 1);

  enter() {
    this.context.sitStart.notify(null);
  }

  exit() {
    this.context.sitEnd.notify(null);
  }

  update({ inputController }: UpdateArgs) {
    if (!this.context.allow.control) {
      return;
    }
    const isUp = inputController.isHold(InputControl.Up);
    if (isUp) {
      return new DudeIdleState(this.context);
    }
  }

  draw({ ctx, images }: DrawArgs) {
    const headY = 13;
    const [frameX, frameY, frameWidth, frameHeight] = this.sheet[0];
    drawDirectionSheet(
      ctx,
      images.dudeSitting,
      [frameX, frameY + headY, frameWidth, frameHeight],
      {
        x: this.context.rx,
        y: 12 + headY,
        direction: this.context.direction,
      },
    );
  }
}

class DudeReceiveCassetteState extends State<Dude> {
  private animation = new SheetAnimation(createSheet(16, 32, 1));
  private timer = new Timer(4);

  enter() {
    this.context.hand.holdDown();
    this.context.allow.control = false;
  }

  update({ deltaTime }: UpdateArgs) {
    this.timer.update(deltaTime);
    if (this.timer.isDone()) {
      return new DudeSuckState(this.context);
    }
  }

  // TODO: how to dedup drawings????
  draw({ ctx, images }: DrawArgs) {
    const headY = 12;
    const [frameX, frameY, frameWidth, frameHeight] = this.animation.frame();

    drawDirectionSheet(
      ctx,
      images.dudeWalk,
      [frameX, frameY + headY, frameWidth, frameHeight],
      {
        x: this.context.rx,
        y: 11 + headY,
        direction: this.context.direction,
      },
    );
  }
}

class DudeSuckState extends State<Dude> {
  private animation = new SheetAnimation(createSheet(16, 32, 11), {
    delay: 0.3,
  });

  enter() {
    this.context.suckStart.notify(null);

    this.context.head.none();
    this.context.hand.none();
  }

  exit() {
    this.context.suckEnd.notify(null);
  }

  update({ deltaTime }: UpdateArgs) {
    this.animation.update(deltaTime);
    if (this.animation.isComplete()) {
      return new DudeNoneState(this.context);
    }
  }

  draw({ ctx, images }: DrawArgs) {
    drawDirectionSheet(
      ctx,
      resources.images.dudeSucked,
      this.animation.frame(),
      {
        x: 32,
        y: 10,
      },
    );
  }
}

class Hand {
  state = new StateMachine(new HandIdleState(this));

  constructor(readonly dude: Dude) {}

  draw(drawArgs: DrawArgs) {
    if (this.state.is(HandNoneState)) {
      return;
    }

    this.state.draw(drawArgs);
  }

  none() {
    this.state.transition(new HandNoneState(this));
  }

  holdDown() {
    this.state.transition(new HandHoldDownState(this));
  }
}

class HandNoneState extends State<Hand> {}

class HandIdleState extends State<Hand> {
  draw({ ctx, images }: DrawArgs) {
    if (this.context.dude.isSit()) {
      drawSheet(ctx, images.dudeHand, [0, 0, 1, 8], {
        x: this.context.dude.rx + 2,
        y: this.context.dude.ry + 15,
      });
      drawSheet(ctx, images.dudeHand, [0, 0, 1, 8], {
        x: this.context.dude.rx - 3,
        y: this.context.dude.ry + 15,
      });
    } else {
      drawSheet(ctx, images.dudeHand, [0, 0, 1, 8], {
        x: this.context.dude.rx + 2,
        y: this.context.dude.ry + 13,
      });
      drawSheet(ctx, images.dudeHand, [0, 0, 1, 8], {
        x: this.context.dude.rx - 3,
        y: this.context.dude.ry + 13,
      });
    }
  }
}

class HandHoldDownState extends State<Hand> {
  draw({ ctx, images }: DrawArgs) {
    if (this.context.dude.direction === 1) {
      drawSheet(ctx, images.dudeHand, [0, 0, 1, 8], {
        x: this.context.dude.rx - 3,
        y: this.context.dude.ry + 13,
      });
      drawDirectionSheet(ctx, images.dudeHand, [2, 0, 6, 8], {
        x: this.context.dude.rx + 5,
        y: this.context.dude.ry + 13,
        direction: this.context.dude.direction,
      });
    } else {
      drawSheet(ctx, images.dudeHand, [0, 0, 1, 8], {
        x: this.context.dude.rx + 2,
        y: this.context.dude.ry + 13,
      });
      drawDirectionSheet(ctx, images.dudeHand, [2, 0, 6, 8], {
        x: this.context.dude.rx - 5,
        y: this.context.dude.ry + 13,
        direction: this.context.dude.direction,
      });
    }

    // if (hand === 'static') {
    //   ctx.drawImage(handImage, 0, 0, 1, 8, destX + 5, destY + dstHandYOff, 1, 8);
    //   ctx.drawImage(handImage, 0, 0, 1, 8, destX + 10, destY + dstHandYOff, 1, 8);
    // } else if (hand === 'holding-down') {
    //   ctx.drawImage(handImage, 0, 0, 1, 8, destX + 5, destY + dstHandYOff, 1, 8);
    //   ctx.drawImage(handImage, 2, 0, 6, 8, destX + 10, destY + dstHandYOff, 6, 8);
    // } else if (hand === 'holding-straight') {
    //   ctx.drawImage(handImage, 0, 0, 1, 8, destX + 5, destY + dstHandYOff, 1, 8);
    //   ctx.drawImage(handImage, 9, 0, 6, 8, destX + 10, destY + dstHandYOff, 6, 8);
    // }
  }
}

class Head {
  state = new StateMachine<Head>(new HeadStaticState(this));

  bobStart = new Subject<null>();

  constructor(readonly dude: Dude) {}

  draw(drawArgs: DrawArgs) {
    if (this.state.is(HeadNoneState)) {
      return;
    }
    this.state.draw(drawArgs);
  }

  none() {
    this.state.transition(new HeadNoneState(this));
  }

  bob() {
    this.state.transition(new HeadBobState(this));
  }

  isBob() {
    return this.state.is(HeadBobState);
  }
}

class HeadNoneState extends State<Head> {}

class HeadStaticState extends State<Head> {
  draw({ ctx, images }: DrawArgs) {
    const image = images.dudeHeadBob;

    if (this.context.dude.isSit()) {
      drawSheet(ctx, image, [0, 0, 16, 16], {
        x: this.context.dude.rx - 8,
        y: this.context.dude.ry + 2,
      });
    } else {
      drawSheet(ctx, image, [0, 0, 16, 16], {
        x: this.context.dude.rx - 8,
        y: this.context.dude.ry,
      });
    }
  }
}

class HeadBobState extends State<Head> {
  enter() {
    this.context.bobStart.notify(null);
  }

  draw({ ctx, images, lastTime }: DrawArgs) {
    const srcX = Math.round(lastTime / 0.22) % 2 === 0 ? 0 : 16;

    if (this.context.dude.isSit()) {
      drawSheet(ctx, images.dudeHeadBob, [srcX, 0, 16, 16], {
        x: this.context.dude.rx - 8,
        y: this.context.dude.ry + 2,
      });
    } else {
      drawSheet(ctx, images.dudeHeadBob, [srcX, 0, 16, 16], {
        x: this.context.dude.rx - 8,
        y: this.context.dude.ry,
      });
    }
  }
}
