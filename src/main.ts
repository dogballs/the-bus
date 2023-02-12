const loadingElement = document.querySelector<HTMLElement>('[data-loading]');
const crashElement = document.querySelector<HTMLElement>('[data-crash]');

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

canvas.width = 500;
canvas.height = 500;

async function main() {
  try {
    document.body.appendChild(canvas);

    ctx.fillText('Hello', 10, 10);

  } catch (err) {
    crash();

    console.error(err);
  } finally {
    loadingElement.style.display = 'none';
  }
}

function crash() {
  // loop.stop();
  try {
    document.body.removeChild(canvas);
  } catch (err) {}
  crashElement.style.display = 'flex';
}

main();
