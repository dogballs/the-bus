const IMAGES = {
  // common - dude
  dudeWalk: 'dude-walk-Sheet.png',
  dudeSitting: 'dude-sitting.png',
  dudeCrouch: 'dude-crouch.png',
  dudeHeadBob: 'dude-head-bob.png',
  // menu
  bus: 'bus.png',
  // common - env
  bench: 'bench.png',
  // common - ui
  arrows: 'arrows.png',
  text: 'text.png',
  // act - intro
  punkWalk: 'punk-walk-Sheet.png',
  punkListen: 'punk-listen-Sheet.png',
  punkNotes: 'punk-notes.png',
  // act - smoker
  dudeTransformTrash: 'dude-transform-trash-Sheet.png',
  trashbin: 'trashbin.png',
  trashspot: 'trashshop.png',
  smokerWalk: 'smoker-walk-Sheet.png',
  smokerSitting: 'smoker-sitting-Sheet.png',
  smokerTransform: 'smoker-transform-Sheet.png',
  cig: 'smoke-Sheet.png',
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
