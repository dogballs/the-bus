import { ImageMap } from './images';
import { InputController } from './input';

export type DrawArgs = { ctx: Context2D; lastTime: number; images: ImageMap };
export type UpdateArgs = {
  deltaTime: number;
  inputController: InputController;
};

export type Context2D =
  | CanvasRenderingContext2D
  | OffscreenCanvasRenderingContext2D;
