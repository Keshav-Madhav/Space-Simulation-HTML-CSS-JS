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
 * Zoom in by increasing the zoom factor.
 */
const zoomIn = () => {
  zoomFactor = Math.max(Math.min(zoomFactor + zoomSpeed, 6), 0.1);
}

/**
 * Zoom out by decreasing the zoom factor.
 */
const zoomOut = () => {
  zoomFactor = Math.max(Math.min(zoomFactor - zoomSpeed, 6), 0.1);
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
  canvas.width = window.innerWidth - 10;
  canvas.height = window.innerHeight - 5;
  starCanvas.width = window.innerWidth - 10;
  starCanvas.height = window.innerHeight - 5;
  trailCanvas.width = window.innerWidth - 10;
  trailCanvas.height = window.innerHeight - 5;
}


export { screenToWorldCoordinates, zoomIn, zoomOut, hexToRGB, resizeCanvas };