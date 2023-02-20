import { drawBench } from './bench';
import { defaultDudeState, drawDude, DudeState, updateDude } from './dude';
import { inputController, resources } from './deps';
import { InputControl } from './input';
import {
  createSheet,
  Sheet,
  Animation,
  SheetAnimation,
  Timer,
} from './animation';
import { OW } from './config';

const PUNK_WALK_ANIMATION = new SheetAnimation(createSheet(12, 32, 3), {
  loop: true,
  delay: 0.2,
});
const PUNK_LISTEN_ANIMATION = new SheetAnimation(createSheet(12, 32, 2), {
  loop: true,
  delay: 0.2,
});
const PUNK_WALK_SPEED = 6;

const NOTE_SPEED = 4;

type ArrowState = { status: 'walk' | 'sit' | 'none' };
const defaultArrowState: ArrowState = { status: 'walk' };

type PunkState = {
  status: 'off' | 'walk-in' | 'listen' | 'walk-out';
  x: number;
  direction: number;
  animation: Animation<Sheet>;
};
const defaultPunkState: PunkState = {
  status: 'off',
  x: -15,
  direction: 1,
  animation: PUNK_WALK_ANIMATION,
};

type NoteState = {
  status: 'none' | 'playing';
  x: number;
};
const defaultNoteState: NoteState = {
  status: 'none',
  x: 10,
};

export type ActIntroState = {
  status: 'active' | 'ended';
  endTimer: Timer;
  dude: DudeState;
  arrow: ArrowState;
  punk: PunkState;
  note: NoteState;
};

export const defaultActIntroState: ActIntroState = {
  status: 'active',
  endTimer: new Timer(5),
  dude: { ...defaultDudeState, x: 18 },
  arrow: defaultArrowState,
  punk: defaultPunkState,
  note: { ...defaultNoteState },
};

export function drawActIntro(
  ctx,
  { state, lastTime }: { state: ActIntroState; lastTime: number },
) {
  drawBench(ctx);
  drawArrow(ctx, { state: state.arrow, lastTime });
  drawPunk(ctx, { state: state.punk });
  drawNote(ctx, { state: state.note });
  drawDude(ctx, { state: state.dude, lastTime });
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

function drawPunk(ctx, { state }: { state: PunkState }) {
  const { x, direction, animation, status } = state;
  const rx = Math.round(x);

  let image;
  if (status === 'walk-in' || status === 'walk-out' || status === 'off') {
    image = resources.images.punkWalk;
  } else if (status === 'listen') {
    image = resources.images.punkListen;
  }

  const [frameX, frameY, frameWidth, frameHeight] = animation.frame();

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
    13,
    frameWidth,
    frameHeight,
  );

  if (direction === -1) {
    ctx.scale(-1, 1);
    ctx.translate(-(rx + frameWidth / 2), 0);
  }
}

function drawNote(ctx, { state }: { state: NoteState }) {
  const { x, status } = state;

  if (status === 'none') {
    return;
  }

  const rx = Math.round(x);

  const image = resources.images.punkNotes;

  const step = 8;
  const baseY = 6;

  function drawOne(x) {
    const yOff = x % 3;
    if (x < 20) return;
    ctx.drawImage(image, 1, 1, 2, 6, x, baseY + yOff, 2, 6);
  }

  function drawTwo(x) {
    const yOff = x % 3;
    if (x < 20) return;
    ctx.drawImage(image, 6, 1, 2, 6, x, baseY + yOff, 2, 6);
  }

  function drawThree(x) {
    const yOff = x % 3;
    if (x < 20) return;
    ctx.drawImage(image, 11, 1, 2, 6, x, baseY + yOff, 2, 6);
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

    if (x < defaultPunkState.x) {
      x = defaultPunkState.x;
      direction = 1;
      status = 'off';
    }
  }

  if (status === 'listen') {
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

function updateNote({
  state,
  deltaTime,
}: {
  state: NoteState;
  deltaTime: number;
}): NoteState {
  let { x, status } = state;

  if (status === 'none') {
    return state;
  }

  const xChange = NOTE_SPEED * deltaTime;

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
  let { status, dude, arrow, punk, note, endTimer } = state;

  const isUp = inputController.isDown(InputControl.Up);
  const isDown = inputController.isDown(InputControl.Down);

  dude = updateDude({ state: dude, deltaTime });
  punk = updatePunk({ state: punk, deltaTime });
  note = updateNote({ state: note, deltaTime });

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
      note = { ...defaultNoteState };
    }
  }
  if (punk.status === 'listen') {
    note.status = 'playing';
  }
  if (note.x > dude.x) {
    dude.head = 'bobbing';
  }

  const isEndingRange = dude.x < 30;
  if (dude.head === 'bobbing' && isEndingRange) {
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
    note,
    endTimer,
  };
}
