import { inputController, resources } from './deps';
import { InputControl } from './input';
import { Animation, SheetAnimation } from './animation';
import { Sheet, createSheet } from './sprite';
import { randomElement, randomNumber } from './random';

const BUS_STOP_X = -30;

type BusState = {
  status: 'none' | 'drive-in' | 'stop' | 'drive-out';
  x: number;
};

const defaultBusState: BusState = {
  status: 'drive-in',
  x: 100,
};

type ActState = {
  status: 'none' | 'visible' | 'chosen';
  highlightedIndex: number;
  selectedIndex: number;
  acts: { id: number; isOpen: boolean }[];
};

const defaultActState: ActState = {
  status: 'none',
  highlightedIndex: 0,
  selectedIndex: undefined,
  acts: [
    { id: 1, isOpen: true },
    { id: 2, isOpen: false },
    { id: 3, isOpen: false },
    { id: 4, isOpen: false },
    { id: 5, isOpen: false },
  ],
};

type CrowdState = {
  status: 'none' | 'active' | 'done';
  boys: {
    kind: 'npc1' | 'npc2' | 'npc3' | 'agent' | 'smoker';
    x: number;
    speed: number;
    direction: number;
    animation: Animation<Sheet>;
  }[];
};
const defaultCrowdState: CrowdState = { status: 'none', boys: [] };

export type MenuState = {
  status: 'intro' | 'bus' | 'level' | 'next';
  bus: BusState;
  act: ActState;
  crowd: CrowdState;
};
export function createDefaultMenuState({
  status,
  highlightedIndex = 0,
}: {
  status: 'intro' | 'bus' | 'level' | 'next';
  highlightedIndex?: number;
}): MenuState {
  if (highlightedIndex > defaultActState.acts.length - 1) {
    highlightedIndex = 0;
  }
  return {
    status,
    bus: { ...defaultBusState },
    act: {
      ...defaultActState,
      highlightedIndex,
    },
    crowd: { ...defaultCrowdState, boys: [] },
  };
}

function drawBus(ctx, { state }: { state: BusState }) {
  const { x, status } = state;

  if (status === 'none') {
    return;
  }

  const rx = Math.round(x);

  const image = resources.images.bus;

  ctx.drawImage(image, rx, -9);
}

function updateBus({
  state,
  deltaTime,
}: {
  state: BusState;
  deltaTime: number;
}): BusState {
  let { x, status } = state;

  if (status === 'none') {
    return state;
  }

  if (status === 'drive-in') {
    let speed = 40;
    if (x < 30) {
      speed = 30;
    }
    if (x < -10) {
      speed = 20;
    }
    const xChange = speed * deltaTime;
    x -= xChange;

    if (x < BUS_STOP_X) {
      x = BUS_STOP_X;
      status = 'stop';
    }
  }

  if (status === 'drive-out') {
    let speed = 20;
    if (x < -40) {
      speed = 30;
    }
    if (x < -60) {
      speed = 40;
    }

    const xChange = speed * deltaTime;
    x -= xChange;
  }

  return {
    ...state,
    x,
    status,
  };
}

function drawAct(
  ctx,
  { state, lastTime }: { state: ActState; lastTime: number },
) {
  const { highlightedIndex, acts, status } = state;

  if (status === 'none' || status === 'chosen') {
    return;
  }

  const image = resources.images.text;

  for (const [index, act] of acts.entries()) {
    ctx.drawImage(image, index * 4, 0, 4, 5, index * 7 + 28, 26, 4, 5);

    if (highlightedIndex === index && Math.round(lastTime / 0.2) % 2 === 0) {
      ctx.drawImage(image, 0, 5, 7, 8, index * 7 + 28 - 2, 24, 7, 8);
    }
  }
}

function updateAct({ state }: { state: ActState }): ActState {
  let { highlightedIndex, selectedIndex, acts, status } = state;

  if (status === 'none' || status === 'chosen') {
    return state;
  }

  const isLeft = inputController.isDown(InputControl.Left);
  const isRight = inputController.isDown(InputControl.Right);
  const isSelect = inputController.isDown(InputControl.Select);

  if (isLeft && highlightedIndex > 0) {
    highlightedIndex -= 1;
  }
  if (isRight && highlightedIndex < acts.length - 1) {
    highlightedIndex += 1;
  }
  if (isSelect) {
    selectedIndex = highlightedIndex;
    status = 'chosen';
  }

  return {
    ...state,
    highlightedIndex,
    selectedIndex,
    status,
  };
}

function drawCrowd(ctx, { state }: { state: CrowdState }) {
  const { status, boys } = state;

  if (status === 'none' || status === 'done') {
    return;
  }

  for (const boy of boys) {
    const { x, direction, animation, kind } = boy;

    let image;
    if (kind === 'npc1') {
      image = resources.images.npc1Walk;
    } else if (kind === 'npc2') {
      image = resources.images.npc2Walk;
    } else if (kind === 'npc3') {
      image = resources.images.npc3Walk;
    } else if (kind === 'agent') {
      image = resources.images.agentWalk;
    } else if (kind === 'smoker') {
      image = resources.images.smokerWalk;
    }

    const rx = Math.round(x);

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
      12,
      frameWidth,
      frameHeight,
    );

    if (direction === -1) {
      ctx.scale(-1, 1);
      ctx.translate(-(rx + frameWidth / 2), 0);
    }
  }
}

function updateCrowd({
  state,
  deltaTime,
}: {
  state: CrowdState;
  deltaTime: number;
}): CrowdState {
  let { status, boys } = state;
  if (status === 'none' || status === 'done') {
    return state;
  }

  const BOYS_COUNT = 30;
  if (boys.length === 0) {
    for (let i = 0; i < BOYS_COUNT; i++) {
      boys.push({
        kind: randomElement(['npc1', 'npc2', 'npc3', 'agent', 'smoker']),
        x: randomNumber(20, 40),
        speed: randomNumber(15, 30),
        direction: randomElement([1, -1]),
        animation: new SheetAnimation(createSheet(16, 32, 3), {
          loop: true,
          delay: randomElement([0.08, 0.12, 0.16]),
        }),
      });
    }
  }

  boys = boys.map((boy) => {
    let { x, animation, speed, direction } = boy;

    const xChange = speed * deltaTime;
    x += xChange * direction;

    animation.update(deltaTime);

    return {
      ...boy,
      x,
      animation,
    };
  });

  const allDone = boys.every((boy) => {
    return boy.x < -10 || boy.x > 90;
  });

  if (allDone) {
    status = 'done';
  }

  return {
    ...state,
    boys,
    status,
  };
}

export function drawMenu(
  ctx,
  { state, lastTime }: { state: MenuState; lastTime: number },
) {
  drawCrowd(ctx, { state: state.crowd });
  drawBus(ctx, { state: state.bus });
  drawAct(ctx, { state: state.act, lastTime });
}

export function updateMenu({
  state,
  deltaTime,
}: {
  state: MenuState;
  deltaTime: number;
}) {
  let { bus, act, crowd, status } = state;

  bus = updateBus({ state: bus, deltaTime });
  act = updateAct({ state: act });
  crowd = updateCrowd({ state: crowd, deltaTime });

  if (act.status === 'chosen') {
    status = 'intro';
    bus.status = 'drive-out';
  }
  if (bus.status === 'stop') {
    act.status = 'visible';
    if (status === 'next') {
      status = 'bus';
    }
  }
  if (crowd.status === 'done') {
    status = 'level';
  }
  if (bus.x < -70) {
    crowd.status = 'active';
  }

  return {
    ...state,
    bus,
    act,
    crowd,
    status,
  };
}
