import { Animation } from './animation';
import { resources, inputController } from './deps';

const walkSheet = [
  [0, 0, 16, 32],
  [16, 0, 16, 32],
  [32, 0, 16, 32],
];

type DudeStatus = 'idle' | 'walking';

type DudeState = {
  status: DudeStatus;
  animation: Animation<(typeof walkSheet)[0]> | undefined;
};

export const defaultDudeState: DudeState = {
  status: 'idle',
  animation: new Animation(walkSheet, { loop: true }),
};

export function drawDude(ctx, { state }: { state: DudeState }) {
  const image = resources.images.dudeWalk;
  const imageRect = walkSheet[state.animation.index()];

  ctx.drawImage(image, ...imageRect, 4, 4, imageRect[2], imageRect[3]);
}

export function updateDude({
  state,
  deltaTime,
}: {
  state: DudeState;
  deltaTime: number;
}) {
  state.animation.update(deltaTime);
}
