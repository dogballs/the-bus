import { Context2D } from './types';

/**
 * [x, y, width, height] of a sprite in a spritesheet
 */
export type Sheet = [number, number, number, number];

export function createSheet(width, height, count, startIndex = 0): Sheet[] {
  const sheet = [];
  for (let i = startIndex; i < startIndex + count; i++) {
    sheet.push([width * i, 0, width, height]);
  }
  return sheet;
}

export function drawSheet(
  ctx: Context2D,
  image: HTMLImageElement,
  sheet: Sheet,
  { x, y }: { x: number; y: number },
) {
  const [srcX, srcY, width, height] = sheet;

  ctx.drawImage(image, srcX, srcY, width, height, x, y, width, height);
}

export function drawDirectionSheet(
  ctx: Context2D,
  image: HTMLImageElement,
  sheet: Sheet,
  { x, y, direction = 1 }: { x: number; y: number; direction?: 1 | -1 },
) {
  const [srcX, srcY, width, height] = sheet;

  const halfWidth = width / 2;
  // console.assert(halfWidth % 2 === 0, 'Width must be divisible by 2');

  const destX = direction === -1 ? 0 : x - halfWidth;

  if (direction === -1) {
    ctx.translate(x + halfWidth, 0);
    ctx.scale(-1, 1);
  }

  ctx.drawImage(image, srcX, srcY, width, height, destX, y, width, height);

  if (direction === -1) {
    ctx.scale(-1, 1);
    ctx.translate(-(x + halfWidth), 0);
  }
}
