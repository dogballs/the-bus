export const DRAW_FPS = 15;

export const RS = 8; // render scale

export const OW = 84; // original width
export const OH = 48; // original height

export const IW = OW * RS;
export const IH = OH * RS;

class Color {
  get A() {
    return '#43523d';
  }
  get B() {
    return '#c7f0d8';
  }
}

export const COLOR = new Color();
