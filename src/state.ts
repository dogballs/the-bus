import { DrawArgs, UpdateArgs } from './types';

export class State<C> {
  constructor(protected readonly context: C) {}
  enter() {}
  exit() {}
  update(updateArgs: UpdateArgs): State<C> | undefined {
    return undefined;
  }
  draw(drawArgs: DrawArgs) {}
}

export class StateMachine<C> {
  state: State<C>;

  constructor(state: State<C>) {
    this.state = state;
    this.state.enter();
  }

  update(updateArgs: UpdateArgs) {
    this.transition(this.state.update(updateArgs));
  }

  draw(drawArgs: DrawArgs) {
    this.state.draw(drawArgs);
  }

  is(S: typeof State<C>) {
    return this.state instanceof S;
  }

  transition(nextState: State<C> | undefined) {
    if (nextState !== undefined) {
      this.state.exit();
      this.state = nextState;
      this.state.enter();
    }
  }
}
