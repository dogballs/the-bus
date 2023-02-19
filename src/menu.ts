import { inputController, resources } from './deps';
import { InputControl } from './input';
import { stat } from 'copy-webpack-plugin/types/utils';

const BUS_STOP_X = -30;

type BusState = {
  status: 'drive-in' | 'stop' | 'drive-out';
  x: number;
};

const defaultBusState: BusState = {
  status: 'drive-in',
  x: 100,
};

type ActState = {
  status: 'none' | 'visible';
  selectedIndex: number;
  chosenIndex: number;
  acts: { id: number; isOpen: boolean }[];
};

const defaultActState: ActState = {
  status: 'none',
  selectedIndex: 0,
  chosenIndex: undefined,
  acts: [
    { id: 1, isOpen: true },
    { id: 2, isOpen: false },
  ],
};

export type MenuState = {
  isOpen: boolean;
  bus: BusState;
  act: ActState;
};
export const defaultMenuState: MenuState = {
  isOpen: true,
  bus: defaultBusState,
  act: defaultActState,
};

export function drawMenu(
  ctx,
  { state, lastTime }: { state: MenuState; lastTime: number },
) {
  drawBus(ctx, { state: state.bus });
  drawAct(ctx, { state: state.act, lastTime });
}

function drawBus(ctx, { state }: { state: BusState }) {
  const { x } = state;

  const rx = Math.round(x);

  const image = resources.images.bus;

  ctx.drawImage(image, rx, -9);
}

function drawAct(
  ctx,
  { state, lastTime }: { state: ActState; lastTime: number },
) {
  const { selectedIndex, acts, status } = state;

  if (status === 'none') {
    return;
  }

  const image = resources.images.text;

  for (const [index, act] of acts.entries()) {
    ctx.drawImage(image, index * 4, 0, 4, 5, index * 7 + 28, 26, 4, 5);

    if (selectedIndex === index && Math.round(lastTime / 0.2) % 2 === 0) {
      ctx.drawImage(image, 0, 5, 7, 8, index * 7 + 28 - 2, 24, 7, 8);
    }
  }
}

function updateBus({
  state,
  deltaTime,
}: {
  state: BusState;
  deltaTime: number;
}): BusState {
  let { x, status } = state;

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

function updateAct({ state }: { state: ActState }): ActState {
  let { selectedIndex, chosenIndex, acts, status } = state;

  if (status === 'none') {
    return state;
  }

  const isLeft = inputController.isDown(InputControl.Left);
  const isRight = inputController.isDown(InputControl.Right);
  const isSelect = inputController.isDown(InputControl.Select);

  if (isLeft && selectedIndex > 0) {
    selectedIndex -= 1;
  }
  if (isRight && selectedIndex < acts.length - 1) {
    selectedIndex += 1;
  }
  if (isSelect) {
    chosenIndex = selectedIndex;
  }

  return {
    ...state,
    selectedIndex,
    chosenIndex,
  };
}

export function updateMenu({
  state,
  deltaTime,
}: {
  state: MenuState;
  deltaTime: number;
}) {
  let { bus, act } = state;

  bus = updateBus({ state: bus, deltaTime });
  act = updateAct({ state: act });

  if (bus.x === BUS_STOP_X) {
    act.status = 'visible';
  }
  if (act.chosenIndex != null) {
    act.status = 'none';
    bus.status = 'drive-out';
  }

  return {
    ...state,
    bus,
    act,
  };
}
