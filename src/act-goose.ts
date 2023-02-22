import { Timer } from './animation';
import { drawBench } from './bench';
import {
  createDefaultDudeState,
  drawDude,
  DudeState,
  updateDude,
} from './dude';

export type ActGooseState = {
  status: 'active' | 'ended';
  endTimer: Timer;
  dude: DudeState;
};

export function createDefaultActGooseState(): ActGooseState {
  return {
    status: 'active',
    endTimer: new Timer(3),
    dude: { ...createDefaultDudeState(), x: 18 },
  };
}

export function drawActGoose(
  ctx,
  { state, lastTime }: { state: ActGooseState; lastTime: number },
) {
  drawBench(ctx);
  drawDude(ctx, { state: state.dude, lastTime });
}

export function updateActGoose({
  state,
  deltaTime,
}: {
  state: ActGooseState;
  deltaTime: number;
}): ActGooseState {
  let { dude } = state;

  dude = updateDude({ state: dude, deltaTime });

  return { ...state, dude };
}
