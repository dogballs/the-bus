import { drawBench } from './bench';
import {
  createDefaultDudeState,
  drawDude,
  Dude,
  DudeState,
  updateDude,
} from './dude';
import { inputController, resources } from './deps';
import { InputControl } from './input';
import { Animation, SheetAnimation, Timer } from './animation';
import { Sheet, createSheet, drawDirectionSheet } from './sprite';
import { OW } from './config';
import { Context2D } from './types';

const PUNK_WALK_ANIMATION = new SheetAnimation(createSheet(12, 32, 3), {
  loop: true,
  delay: 0.2,
});
const PUNK_LISTEN_ANIMATION = new SheetAnimation(createSheet(24, 32, 2), {
  loop: true,
  delay: 0.2,
});
const PUNK_HANDING_ANIMATION = new SheetAnimation(createSheet(24, 32, 2, 2), {
  loop: true,
  delay: 0.2,
});
const PUNK_WALK_SPEED = 16;

const NOTE_SPEED = 14;

type ArrowState = { status: 'walk' | 'sit' | 'none' };
const createDefaultArrowState = (): ArrowState => ({ status: 'walk' });

type PunkState = {
  status: 'off' | 'walk-in' | 'listen' | 'walk-out' | 'handing' | 'listen-end';
  x: number;
  direction: 1 | -1;
  animation: Animation<Sheet>;
};
const createDefaultPunkState = (): PunkState => ({
  status: 'off',
  x: -15,
  direction: 1,
  animation: PUNK_WALK_ANIMATION.reset(),
});

type NoteState = {
  status: 'none' | 'playing';
  backwards: boolean;
  x: number;
};
const createDefaultNoteState = (): NoteState => ({
  status: 'none',
  backwards: false,
  x: 10,
});

type DudeSuckedState = {
  status: 'none' | 'timer' | 'active' | 'done';
  animation: Animation<Sheet>;
  timer: Timer;
};
const createDefaultDudeSuckedState = (): DudeSuckedState => ({
  status: 'none',
  animation: new SheetAnimation(createSheet(16, 32, 11), { delay: 0.3 }),
  timer: new Timer(4),
});

export type ActIntroState = {
  status: 'active' | 'ended';
  shake: false;
  endTimer: Timer;
  bobbingTimer: Timer;
  dude: DudeState;
  arrow: ArrowState;
  punk: PunkState;
  note: NoteState;
  dudeSucked: DudeSuckedState;
};

export function createDefaultActIntroState(): ActIntroState {
  return {
    status: 'active',
    shake: false,
    endTimer: new Timer(3),
    bobbingTimer: new Timer(2),
    dude: { ...createDefaultDudeState(), x: 18 },
    dudeSucked: createDefaultDudeSuckedState(),
    arrow: createDefaultArrowState(),
    punk: createDefaultPunkState(),
    note: createDefaultNoteState(),
  };
}

export function drawActIntro(
  ctx,
  { state, lastTime }: { state: ActIntroState; lastTime: number },
) {
  drawBench(ctx);
  drawArrow(ctx, { state: state.arrow, lastTime });
  drawPunk(ctx, { state: state.punk });
  drawNote(ctx, { state: state.note });
  drawDude(ctx, { state: state.dude, lastTime });
  drawDudeSucked(ctx, { state: state.dudeSucked });
}

function drawArrow(
  ctx,
  { state, lastTime }: { state: ArrowState; lastTime: number },
) {
  const { status } = state;

  const image = resources.images.arrows;
  const w = 6;
  const h = 6;

  if (status === 'walk') {
    if (Math.round(lastTime / 0.5) % 2 === 0) {
      ctx.drawImage(image, 0, 0, w, h, 10, 5, w, h);
      ctx.drawImage(image, 7, 0, w, h, 20, 5, w, h);
    }
  }

  if (status === 'sit') {
    if (Math.round(lastTime / 0.5) % 2 === 0) {
      ctx.drawImage(image, 7, 6, w, h, 54, 10, w, h);
      ctx.drawImage(image, 0, 6, w, h, 54, 2, w, h);
    }
  }
}

function drawDudeSucked(ctx, { state }: { state: DudeSuckedState }) {
  const { status, animation } = state;
  if (status === 'none' || status === 'timer' || status === 'done') {
    return;
  }

  drawDirectionSheet(ctx, resources.images.dudeSucked, animation.frame(), {
    x: 32,
    y: 10,
  });
}

function updateDudeSucked({
  state,
  deltaTime,
}: {
  state: DudeSuckedState;
  deltaTime: number;
}): DudeSuckedState {
  let { status, timer, animation } = state;

  if (status === 'none' || status === 'done') {
    return state;
  }
  if (status === 'timer') {
    timer.update(deltaTime);
    if (timer.isDone()) {
      status = 'active';
    }
  }

  if (status === 'active') {
    animation.update(deltaTime);
    if (animation.isComplete()) {
      status = 'done';
    }
  }

  return { ...state, status };
}

function drawPunk(ctx, { state }: { state: PunkState }) {
  const { x, direction, animation, status } = state;

  let rx = Math.round(x);
  let image;

  if (status === 'walk-in' || status === 'walk-out' || status === 'off') {
    image = resources.images.punkWalk;
  } else if (
    status === 'listen' ||
    status === 'handing' ||
    status === 'listen-end'
  ) {
    image = resources.images.punkListen;
    rx += 6;
  }

  drawDirectionSheet(ctx, image, animation.frame(), {
    x: rx,
    y: 13,
    direction,
  });
}

function updatePunk({
  state,
  deltaTime,
}: {
  state: PunkState;
  deltaTime: number;
}): PunkState {
  let { x, direction, status, animation } = state;

  const xChange = PUNK_WALK_SPEED * deltaTime;
  if (status === 'walk-in') {
    x += xChange;
    direction = 1;
    animation.update(deltaTime);

    if (x >= 15) {
      status = 'listen';
      animation = PUNK_LISTEN_ANIMATION.reset();
    }
  }
  if (status === 'walk-out') {
    if (animation !== PUNK_WALK_ANIMATION) {
      animation = PUNK_WALK_ANIMATION.reset();
    }

    x -= xChange;
    direction = -1;
    animation.update(deltaTime);

    if (x < createDefaultPunkState().x) {
      x = createDefaultPunkState().x;
      direction = 1;
      status = 'off';
    }
  }

  if (status === 'listen') {
    animation.update(deltaTime);
  }

  if (status === 'handing') {
    animation.update(deltaTime);
  }

  if (status === 'listen-end') {
    animation.update(deltaTime);
  }

  return {
    ...state,
    x,
    status,
    direction,
    animation,
  };
}

function drawNote(ctx, { state }: { state: NoteState }) {
  const { x, status } = state;

  if (status === 'none') {
    return;
  }

  const rx = Math.round(x);

  const image = resources.images.punkNotes;

  const step = 8;
  const baseY = 5;

  function drawOne(x) {
    const yOff = x % 3;
    if (x < 18) return;
    ctx.drawImage(image, 1, 1, 4, 6, x, baseY + yOff, 4, 6);
  }

  function drawTwo(x) {
    const yOff = x % 3;
    if (x < 18) return;
    ctx.drawImage(image, 6, 1, 4, 6, x, baseY + yOff, 4, 6);
  }

  function drawThree(x) {
    const yOff = x % 3;
    if (x < 18) return;
    ctx.drawImage(image, 11, 1, 4, 6, x, baseY + yOff, 4, 6);
  }

  for (let i = 0; i < 33; i++) {
    const index = i % 3;
    const rstep = step * i;

    if (rx > rstep) {
      index === 0 && drawOne(rx - rstep);
      index === 1 && drawTwo(rx - rstep);
      index === 2 && drawThree(rx - rstep);
    }
  }
}

function updateNote({
  state,
  deltaTime,
}: {
  state: NoteState;
  deltaTime: number;
}): NoteState {
  let { x, status, backwards } = state;

  if (status === 'none') {
    return state;
  }

  let xChange = NOTE_SPEED * deltaTime;
  if (backwards) {
    xChange *= -4;
  }

  x += xChange;
  if (x > OW * 3) {
    x = OW + (x - OW * 3);
  }

  return {
    ...state,
    x,
  };
}

export function updateActIntro({
  state,
  deltaTime,
}: {
  state: ActIntroState;
  deltaTime: number;
}) {
  let { status, dude, arrow, punk, note, dudeSucked, endTimer, bobbingTimer } =
    state;

  const isUp = inputController.isDown(InputControl.Up);
  const isDown = inputController.isDown(InputControl.Down);

  dude = updateDude({ state: dude, deltaTime });
  punk = updatePunk({ state: punk, deltaTime });
  note = updateNote({ state: note, deltaTime });
  dudeSucked = updateDudeSucked({ state: dudeSucked, deltaTime });

  if (dude.x !== state.dude.x && arrow.status === 'walk') {
    arrow.status = 'sit';
  }

  const isSittingRange = dude.x >= 47 && dude.x < 64;
  if (isDown && isSittingRange) {
    arrow.status = 'none';
    dude.status = 'sitting';
    punk.status = 'walk-in';
  }
  if (dude.status === 'sitting' && isUp) {
    dude.status = 'walking';

    if (dude.head !== 'bobbing') {
      punk.status = 'walk-out';
      note = createDefaultNoteState();
    }
  }
  if (punk.status === 'listen') {
    note.status = 'playing';
  }
  if (note.x > dude.x && dude.status !== 'none') {
    dude.head = 'bobbing';
  }

  if (dude.head === 'bobbing' && dude.status !== 'none') {
    bobbingTimer.update(deltaTime);

    if (bobbingTimer.isDone() && punk.status !== 'handing') {
      punk.status = 'handing';
      punk.animation = PUNK_HANDING_ANIMATION.reset();
    }

    if (punk.status === 'handing') {
      if (dude.x < 32) {
        dude.x = 32;
        dude.hand = 'holding-down';
        dude.status = 'idle';
        dude.walking = 'blocked';
        dudeSucked.status = 'timer';
      }
      if (dudeSucked.status === 'active') {
        note.backwards = true;
        dude.status = 'none';
        dude.head = 'static';
      }
    }
  }

  if (dudeSucked.status === 'done' && punk.status !== 'listen-end') {
    punk.status = 'listen-end';
    punk.animation = PUNK_LISTEN_ANIMATION.reset();
    note.status = 'none';
  }

  if (punk.status === 'listen-end') {
    endTimer.update(deltaTime);
    if (endTimer.isDone()) {
      status = 'ended';
    }
  }

  return {
    ...state,
    status,
    dude,
    arrow,
    punk,
    dudeSucked,
    note,
    endTimer,
  };
}
