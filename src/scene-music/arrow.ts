import { DrawArgs, UpdateArgs } from '../types';
import { resources } from '../deps';
import { State, StateMachine } from '../state';

export class Arrow {
  state = new StateMachine<Arrow>(new ArrowWalkState(this));

  ackWalk() {
    if (this.state.is(ArrowWalkState)) {
      this.state.transition(new ArrowSitState(this));
    }
  }

  ackSit() {
    if (this.state.is(ArrowSitState)) {
      this.state.transition(new ArrowNoneState(this));
    }
  }

  update(updateArgs: UpdateArgs) {
    this.state.update(updateArgs);
  }

  draw(drawArgs: DrawArgs) {
    this.state.draw(drawArgs);
  }
}

class ArrowNoneState extends State<Arrow> {}

class ArrowWalkState extends State<Arrow> {
  draw({ ctx, lastTime }: DrawArgs) {
    const image = resources.images.arrows;
    const w = 6;
    const h = 6;

    if (Math.round(lastTime / 0.5) % 2 === 0) {
      ctx.drawImage(image, 0, 0, w, h, 10, 5, w, h);
      ctx.drawImage(image, 7, 0, w, h, 20, 5, w, h);
    }
  }
}

class ArrowSitState extends State<Arrow> {
  draw({ ctx, lastTime }: DrawArgs) {
    const image = resources.images.arrows;
    const w = 6;
    const h = 6;

    if (Math.round(lastTime / 0.5) % 2 === 0) {
      ctx.drawImage(image, 7, 6, w, h, 54, 10, w, h);
      ctx.drawImage(image, 0, 6, w, h, 54, 2, w, h);
    }
  }
}
