let fps = 60;
let fpsInterval = 1000 / fps;
let lastFrameTime = Date.now();
let lastframe = 0;
let frameCount = 0;
let currentFps = 0;

function drawFPS(context) {
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
  context.clearRect(0, 0, 60, 15); // Clear the area where FPS will be drawn
  context.fillStyle = 'rgba(255, 255, 255, 0.5)';
  context.fillRect(0, 0, 60, 15); // Background for FPS display
  context.fillStyle = 'black';
  context.font = '11px sans-serif';
  context.fillText('FPS: ' + currentFps, 5, 10); // Align text against the left edge
}
