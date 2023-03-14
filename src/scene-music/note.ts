import { DrawArgs, UpdateArgs } from '../types';
import { resources } from '../deps';
import { OW } from '../config';
import { State, StateMachine } from '../state';

// const NOTE_SPEED = 4;
const NOTE_SPEED = 14;

const NOTE_START_X = 10;

export class Note {
  private state = new StateMachine(new NoteNoneState(this));

  x: number = NOTE_START_X;
  backwards: boolean = false;

  get rx() {
    return Math.round(this.x);
  }

  update({ deltaTime }: UpdateArgs) {
    if (this.state.is(NoteNoneState)) {
      return;
    }

    let xChange = NOTE_SPEED * deltaTime;
    if (this.backwards) {
      xChange *= -4;
    }

    this.x += xChange;
    if (this.x > OW * 3) {
      this.x = OW + (this.x - OW * 3);
    }
  }

  draw({ ctx }: DrawArgs) {
    if (this.state.is(NoteNoneState)) {
      return;
    }

    const image = resources.images.punkNotes;

    const step = 8;
    const baseY = 5;

    function drawOne(x) {
      const yOff = x % 3;
      if (x < 18) return;
      ctx.drawImage(image, 1, 1, 4, 6, x, baseY + yOff, 4, 6);
    }

    function drawTwo(x) {
      const yOff = x % 3;
      if (x < 18) return;
      ctx.drawImage(image, 6, 1, 4, 6, x, baseY + yOff, 4, 6);
    }

    function drawThree(x) {
      const yOff = x % 3;
      if (x < 18) return;
      ctx.drawImage(image, 11, 1, 4, 6, x, baseY + yOff, 4, 6);
    }

    for (let i = 0; i < 33; i++) {
      const index = i % 3;
      const rstep = step * i;

      if (this.rx > rstep) {
        index === 0 && drawOne(this.rx - rstep);
        index === 1 && drawTwo(this.rx - rstep);
        index === 2 && drawThree(this.rx - rstep);
      }
    }
  }

  playForward() {
    this.state.transition(new NotePlayForwardState(this));
  }

  playBackwards() {
    this.state.transition(new NotePlayBackwardsState(this));
  }

  stopPlay() {
    this.state.transition(new NoteNoneState(this));
  }
}

class NoteNoneState extends State<Note> {
  enter() {
    this.context.x = NOTE_START_X;
    this.context.backwards = false;
  }
}

class NotePlayForwardState extends State<Note> {
  enter() {
    this.context.backwards = false;
  }
}

class NotePlayBackwardsState extends State<Note> {
  enter() {
    this.context.backwards = true;
  }
}
