const IMAGES = {
  dude: 'data/graphics/dude.png',
};

export type ImageMap = {
  [key: string]: HTMLImageElement;
};

export async function loadImages(): Promise<ImageMap> {
  const promises = Object.keys(IMAGES).map(async (id) => {
    const path = IMAGES[id];
    return { id, image: await loadImage(path) };
  });

  const results = await Promise.all(promises);

  const map: ImageMap = {};

  results.forEach(({ id, image }) => {
    map[id] = image;
  });

  return map;
};

async function loadImage(imagePath: string) {
  return new Promise<HTMLImageElement>((resolve) => {
    const image = new Image();
    image.src = imagePath;
    image.addEventListener('load', () => {
      resolve(image);
    });
  });
}
