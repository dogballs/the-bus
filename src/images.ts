const IMAGES = {
  // common - dude
  dudeWalk: 'dude-walk-Sheet.png',
  dudeSitting: 'dude-sitting.png',
  dudeCrouch: 'dude-crouch.png',
  dudeHeadBob: 'dude-head-bob.png',
  dudeHand: 'dude-hand.png',
  dudeClimb: 'dude-climb-Sheet.png',
  // menu
  bus: 'bus.png',
  // common - env
  bench: 'bench.png',
  npc1Walk: 'npc1-walk-Sheet.png',
  npc2Walk: 'npc2-walk-Sheet.png',
  npc3Walk: 'npc3-walk-Sheet.png',
  // common - ui
  arrows: 'arrows.png',
  text: 'text.png',
  // act - intro
  punkWalk: 'punk-walk-Sheet.png',
  punkListen: 'punk-listen-Sheet.png',
  punkNotes: 'punk-notes.png',
  dudeSucked: 'dude-sucked-Sheet.png',
  // act - smoker
  dudeTransformTrash: 'dude-transform-trash-Sheet.png',
  trashbin: 'trashbin.png',
  trashspot: 'trashshop.png',
  smokerWalk: 'smoker-walk-Sheet.png',
  smokerSitting: 'smoker-sitting-Sheet.png',
  smokerTransform: 'smoker-transform-Sheet.png',
  cig: 'smoke-Sheet.png',
  cigFall: 'cig-fall-Sheet.png',
  // act - agent
  agentWalk: 'agent-walk-Sheet.png',
  // act - rain
  umbrella: 'umbrella.png',
  ghostWalk: 'ghost-walk-Sheet.png',
  ghostAppear: 'ghost-appear-Sheet.png',
  dudeDisappear: 'dude-disappear-Sheet.png',
  // act - goose
  gooseWalk: 'goose-walk-Sheet.png',
  gooseScream: 'goose-scream-Sheet.png',
  goslingWalk: 'gosling-walk-Sheet.png',
  gosilla: 'gosilla-Sheet.png',
  bread: 'bread.png',
  // act - outro
  manhole: 'manhole.png',
  manholeAppear: 'manhole-appear-Sheet.png',
  tree: 'tree.png',
  midgetWalk: 'midget-Sheet.png',
  midgetClimb: 'midget-climb-Sheet.png',
};

export type ImageMap = {
  [key: string]: HTMLImageElement;
};

export async function loadImages(): Promise<ImageMap> {
  const promises = Object.keys(IMAGES).map(async (id) => {
    const path = `data/graphics/${IMAGES[id]}`;
    return { id, image: await loadImage(path) };
  });

  const results = await Promise.all(promises);

  const map: ImageMap = {};

  results.forEach(({ id, image }) => {
    map[id] = image;
  });

  return map;
}

async function loadImage(imagePath: string) {
  return new Promise<HTMLImageElement>((resolve) => {
    const image = new Image();
    image.src = imagePath;
    image.addEventListener('load', () => {
      resolve(image);
    });
  });
}
