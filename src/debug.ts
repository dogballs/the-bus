import { OH, OW } from './config';

export function drawDebugGrid(ctx) {
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 0.1;

  for (let i = 0; i < OW; i++) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, OH);
    ctx.stroke();
  }

  for (let i = 0; i < OH; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(OW, i);
    ctx.stroke();
  }
}
