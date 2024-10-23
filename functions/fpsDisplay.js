let fps = 60;
let fpsInterval = 1000 / fps;
let lastFrameTime = Date.now();
let lastframe = 0;
let frameCount = 0;
let currentFps = 0;

const drawFPS = (width, height, context) => {
  // Calculate FPS
  frameCount++;
  let now = Date.now();
  let elapsed = now - lastFrameTime;
  if (elapsed > fpsInterval) {
      currentFps = Math.round(frameCount / (elapsed / 1000));
      frameCount = 0;
      lastFrameTime = now;
  }

  // Draw FPS on canvas
  context.clearRect(width - 60, 0, 60, 15); // Clear previous FPS display
  context.fillStyle = 'rgba(255, 255, 255, 0.5)';
  context.fillRect(width - 60, 10, 60, 15);
  context.fillStyle = 'black';
  context.font = '11px sans-serif';
  context.fillText('FPS: ' + currentFps, width - 55, 22);
}

export { drawFPS };