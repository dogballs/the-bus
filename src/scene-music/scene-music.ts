import { Dude } from '../dude';
import { DrawArgs, UpdateArgs } from '../types';
import { Bench } from '../bench';
import { Arrow } from './arrow';
import { Note } from './note';
import { Punk } from './punk';
import { State, StateMachine } from '../state';
import { Timer } from '../animation';

// TODO: sit hands shorter?

class TutorialAct extends State<MusicScene> {
  arrow = new Arrow();

  enter() {
    const { dude } = this.context;

    dude.walkStart.addListenerOnce(() => {
      this.arrow.ackWalk();
    });
    dude.sitStart.addListenerOnce(() => {
      this.arrow.ackSit();
    });
  }

  exit() {
    const { dude } = this.context;

    dude.walkStart.removeAllListeners();
    dude.sitStart.removeAllListeners();
  }

  update(updateArgs: UpdateArgs) {
    const { dude } = this.context;

    this.arrow.update(updateArgs);

    if (dude.isSit()) {
      return new ApproachAct(this.context);
    }
  }

  draw(drawArgs: DrawArgs) {
    this.arrow.draw(drawArgs);
  }
}

class ApproachAct extends State<MusicScene> {
  enter() {
    const { dude, punk, note } = this.context;

    punk.walkIn();

    dude.sitStart.addListener(() => {
      punk.walkIn();
    });
    dude.sitEnd.addListener(() => {
      punk.walkOut();
    });

    punk.listenStart.addListener(() => {
      note.playForward();
    });
    punk.walkOutStart.addListener(() => {
      note.stopPlay();
    });
  }

  exit() {
    const { dude, punk } = this.context;

    dude.sitStart.removeAllListeners();
    dude.sitEnd.removeAllListeners();

    punk.listenStart.removeAllListeners();
    punk.walkOutStart.removeAllListeners();
  }

  update(updateArgs: UpdateArgs) {
    const { note, dude } = this.context;

    if (note.x > dude.x) {
      return new OfferAct(this.context);
    }
  }
}

class OfferAct extends State<MusicScene> {
  enter() {
    const { dude, punk, note } = this.context;

    dude.bobHead();
    punk.offer();

    dude.suckStart.addListener(() => {
      note.playBackwards();
    });

    dude.suckEnd.addListener(() => {
      punk.stopOffering();

      this.context.state.transition(new EndingAct(this.context));
    });
  }

  exit() {
    const { dude } = this.context;

    dude.suckStart.removeAllListeners();
    dude.suckEnd.removeAllListeners();
  }

  update(updateArgs: UpdateArgs) {
    const { dude, punk } = this.context;

    if (punk.isOffering() && dude.x < 32) {
      dude.receiveCassette({ x: 32 });
    }
    return undefined;
  }
}

class EndingAct extends State<MusicScene> {
  private timer = new Timer(3);

  update({ deltaTime }: UpdateArgs) {
    this.timer.update(deltaTime);
    if (this.timer.isDone()) {
      return new EndedAct(this.context);
    }
  }
}

class EndedAct extends State<MusicScene> {}

export class MusicScene {
  bench = new Bench();
  dude = new Dude({ x: 18 });
  note = new Note();
  punk = new Punk();
  state = new StateMachine(new TutorialAct(this));

  update(updateArgs: UpdateArgs) {
    this.state.update(updateArgs);

    this.dude.update(updateArgs);
    this.note.update(updateArgs);
    this.punk.update(updateArgs);

    const isSitRange = this.dude.x >= 47 && this.dude.x < 64;
    this.dude.allow.sit = isSitRange;
  }

  draw(drawArgs: DrawArgs) {
    this.state.draw(drawArgs);

    this.bench.draw(drawArgs);
    this.dude.draw(drawArgs);
    this.note.draw(drawArgs);
    this.punk.draw(drawArgs);
  }

  isEnded() {
    return this.state.is(EndedAct);
  }
}
