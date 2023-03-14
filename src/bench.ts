import { resources } from './deps';
import { DrawArgs } from './types';

export class Bench {
  draw({ ctx, images }: DrawArgs) {
    ctx.drawImage(images.bench, 40, 34);
  }
}

/**
 * @deprecated
 */
export function drawBench(ctx) {
  ctx.drawImage(resources.images.bench, 40, 34);
}
