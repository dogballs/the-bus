import { DrawArgs, UpdateArgs } from '../types';
import { SheetAnimation, Timer } from '../animation';
import { createSheet, drawDirectionSheet } from '../sprite';
import { Subject } from '../subject';
import { State, StateMachine } from '../state';

const PUNK_WALK_ANIMATION = new SheetAnimation(createSheet(12, 32, 3), {
  loop: true,
  delay: 0.2,
});
const PUNK_LISTEN_ANIMATION = new SheetAnimation(createSheet(24, 32, 2), {
  loop: true,
  delay: 0.2,
});

// const PUNK_WALK_SPEED = 6;
const PUNK_WALK_SPEED = 16;

const PUNK_START_X = -15;
const PUNK_LISTEN_X = 15;

export class Punk {
  state = new StateMachine<Punk>(new PunkWaitState(this));
  x = PUNK_START_X;
  direction: 1 | -1 = 1;

  listenStart = new Subject<null>();
  listenStop = new Subject<null>();
  walkOutStart = new Subject<null>();

  update(updateArgs: UpdateArgs) {
    this.state.update(updateArgs);
  }

  draw(drawArgs: DrawArgs) {
    this.state.draw(drawArgs);
  }

  get rx() {
    return Math.round(this.x);
  }

  walkIn() {
    this.state.transition(new PunkWalkInState(this));
  }

  walkOut() {
    this.state.transition(new PunkWalkOutState(this));
  }

  offer() {
    this.state.transition(new PunkPreGiveState(this));
  }

  stopOffering() {
    this.state.transition(new PunkListenState(this));
  }

  isOffering() {
    return this.state.is(PunkGiveState);
  }
}

class PunkWaitState extends State<Punk> {
  enter() {
    this.context.x = PUNK_START_X;
    this.context.direction = 1;
  }
}

class PunkWalkInState extends State<Punk> {
  private animation = PUNK_WALK_ANIMATION;

  enter() {
    this.context.direction = 1;
  }

  update({ deltaTime }: UpdateArgs) {
    const xChange = PUNK_WALK_SPEED * deltaTime;
    this.context.x += xChange;
    this.animation.update(deltaTime);
    if (this.context.x >= PUNK_LISTEN_X) {
      return new PunkListenState(this.context);
    }
  }

  draw({ ctx, images }: DrawArgs) {
    drawDirectionSheet(ctx, images.punkWalk, this.animation.frame(), {
      x: this.context.rx,
      y: 13,
      direction: this.context.direction,
    });
  }
}

class PunkWalkOutState extends State<Punk> {
  private animation = PUNK_WALK_ANIMATION;

  enter() {
    this.context.walkOutStart.notify(null);
    this.context.direction = -1;
  }

  update({ deltaTime }: UpdateArgs) {
    const xChange = PUNK_WALK_SPEED * deltaTime;
    this.context.x -= xChange;
    this.animation.update(deltaTime);
    if (this.context.x < PUNK_START_X) {
      return new PunkWaitState(this.context);
    }
  }

  draw({ ctx, images }: DrawArgs) {
    drawDirectionSheet(ctx, images.punkWalk, this.animation.frame(), {
      x: this.context.rx,
      y: 13,
      direction: this.context.direction,
    });
  }
}

class PunkListenState extends State<Punk> {
  private animation = PUNK_LISTEN_ANIMATION;

  enter() {
    this.context.x = PUNK_LISTEN_X;
    this.context.listenStart.notify(null);
  }

  exit() {
    this.context.listenStop.notify(null);
  }

  update({ deltaTime }: UpdateArgs) {
    this.animation.update(deltaTime);
    return undefined;
  }

  draw({ ctx, images }: DrawArgs) {
    drawDirectionSheet(ctx, images.punkListen, this.animation.frame(), {
      x: this.context.rx + 6,
      y: 13,
    });
  }
}

class PunkPreGiveState extends State<Punk> {
  private animation = PUNK_LISTEN_ANIMATION;
  private timer = new Timer(2);

  update({ deltaTime }: UpdateArgs) {
    this.animation.update(deltaTime);
    this.timer.update(deltaTime);
    if (this.timer.isDone()) {
      return new PunkGiveState(this.context);
    }
  }

  draw({ ctx, images }: DrawArgs) {
    drawDirectionSheet(ctx, images.punkListen, this.animation.frame(), {
      x: this.context.rx + 6,
      y: 13,
    });
  }
}

class PunkGiveState extends State<Punk> {
  private animation = new SheetAnimation(createSheet(24, 32, 2, 2), {
    loop: true,
    delay: 0.2,
  });

  update({ deltaTime }: UpdateArgs) {
    this.animation.update(deltaTime);
    return undefined;
  }

  draw({ ctx, images }: DrawArgs) {
    drawDirectionSheet(ctx, images.punkListen, this.animation.frame(), {
      x: this.context.rx + 6,
      y: 13,
    });
  }
}
