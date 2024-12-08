/**
 * Converts screen coordinates to world coordinates based on the current camera position and zoom level.
 * @param {number} screenX The x coordinate on the screen
 * @param {number} screenY The y coordinate on the screen
 * @returns {{x: number, y: number}} The world coordinates
 */
const screenToWorldCoordinates = (screenX, screenY) => {
  const worldX = (screenX - canvas.width / 2) / zoomFactor + camera.x + canvas.width / 2;
  const worldY = (screenY - canvas.height / 2) / zoomFactor + camera.y + canvas.height / 2;
  return { x: worldX, y: worldY };
}

/**
 * Converts world coordinates to screen coordinates based on the current camera position and zoom level.
 * @param {number} worldX The x coordinate in world space
 * @param {number} worldY The y coordinate in world space
 * @returns {{x: number, y: number}} The screen coordinates
 */
const worldToScreenCoordinates = (worldX, worldY) => {
  const screenX = ((worldX - canvas.width / 2 - camera.x) * zoomFactor) + canvas.width / 2;
  const screenY = ((worldY - canvas.height / 2 - camera.y) * zoomFactor) + canvas.height / 2;
  return { x: screenX, y: screenY };
}

/**
 * Zoom in by increasing the zoom factor.
 */
const zoomIn = () => {
  // Apply exponential zoom for gradual zooming effect
  zoomFactor = Math.max(Math.min(zoomFactor * (1 + zoomSpeed), 6), 0.01);
  zoomFactor = parseFloat(zoomFactor.toFixed(3));
}

/**
 * Zoom out by decreasing the zoom factor.
 */
const zoomOut = () => {
  // Apply exponential zoom for gradual zooming effect
  zoomFactor = Math.max(Math.min(zoomFactor * (1 - zoomSpeed), 6), 0.01);
  zoomFactor = parseFloat(zoomFactor.toFixed(3));
}

/**
 * Converts a hex color string to an RGB object.
 * @param {string} hex The hex color string (e.g., "#ff0000")
 * @returns {{r: number, g: number, b: number}} The RGB color object
 */
const hexToRGB = (hex) => {
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);
  return { r, g, b };
}

/**
 * Resize the canvas to match the window size.
 */
function resizeCanvas() {
  canvas.width = window.innerWidth - 1;
  canvas.height = window.innerHeight - 1;
  starCanvas.width = window.innerWidth - 1;
  starCanvas.height = window.innerHeight - 1;
  trailCanvas.width = window.innerWidth - 1;
  trailCanvas.height = window.innerHeight - 1;
}


export { screenToWorldCoordinates, worldToScreenCoordinates, zoomIn, zoomOut, hexToRGB, resizeCanvas };