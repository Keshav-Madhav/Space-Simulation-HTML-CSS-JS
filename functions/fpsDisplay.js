let fps = 60;
let fpsInterval = 1000 / fps;
let lastFrameTime = Date.now();
let frameTimes = [];
let currentFps = 0;
let avgFps = 0;
let onePercentLowFps = 0;

/**
 * Draw FPS on canvas
 * @param {number} width - Width of canvas
 * @param {number} height - Height of canvas
 * @param {CanvasRenderingContext2D} context - 2D rendering context for the canvas
 */
const drawFPS = (width, height, context) => {
  let now = Date.now();
  let frameTime = now - lastFrameTime;
  lastFrameTime = now;

  // Update current FPS
  currentFps = Math.round(1000 / frameTime);

  // Store frame time for average and 1% low calculations
  frameTimes.push(frameTime);
  if (frameTimes.length > fps) {
    frameTimes.shift(); // Keep only the last second's worth of frames
  }

  // Calculate average FPS over the last second
  const totalFrameTime = frameTimes.reduce((a, b) => a + b, 0);
  avgFps = Math.round(1000 / (totalFrameTime / frameTimes.length));

  // Calculate 1% low FPS
  const sortedFrameTimes = [...frameTimes].sort((a, b) => b - a);
  const onePercentLowIndex = Math.ceil(sortedFrameTimes.length * 0.01);
  const onePercentLowTime = sortedFrameTimes.slice(0, onePercentLowIndex).reduce((a, b) => a + b, 0) / onePercentLowIndex;
  onePercentLowFps = Math.round(1000 / onePercentLowTime);

  // Draw FPS metrics on canvas
  context.clearRect(width - 80, 0, 80, 40); // Clear previous FPS display
  context.fillStyle = 'rgba(255, 255, 255, 0.5)';
  context.fillRect(width - 80, 10, 80, 40);
  context.fillStyle = 'black';
  context.font = '11px sans-serif';
  context.fillText(`FPS: ${currentFps}`, width - 75, 22);
  context.fillText(`Avg FPS: ${avgFps}`, width - 75, 34);
  context.fillText(`1% Low: ${onePercentLowFps}`, width - 75, 46);
}

export { drawFPS };