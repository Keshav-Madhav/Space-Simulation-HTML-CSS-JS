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
 * Zoom in towards mouse position by increasing the zoom factor.
 * If camera is locked on a celestial body, the camera will zoom in towards the center of screen.
 */
const zoomIn = () => {
  // Store mouse position before zoom
  const mouseX = camera.clientX;
  const mouseY = camera.clientY;
  
  // Convert mouse position to world coordinates before zoom
  const worldPosBeforeZoom = screenToWorldCoordinates(mouseX, mouseY);
  
  zoomFactor = Math.max(Math.min(zoomFactor * (1 + zoomSpeed), 6), 0.01);
  zoomFactor = parseFloat(zoomFactor.toFixed(3));
  
  // Convert the same world position back to screen coordinates after zoom
  const screenPosAfterZoom = worldToScreenCoordinates(worldPosBeforeZoom.x, worldPosBeforeZoom.y);
  
  // Adjust camera position to keep mouse position fixed
  if(!cameraFollow) {
    camera.x += (screenPosAfterZoom.x - mouseX) / zoomFactor;
    camera.y += (screenPosAfterZoom.y - mouseY) / zoomFactor;
  }
}

/**
 * Zoom out from mouse position by decreasing the zoom factor.
 * If camera is locked on a celestial body, the camera will zoom out towards the center of screen.
 */
const zoomOut = () => {
  // Store mouse position before zoom
  const mouseX = camera.clientX;
  const mouseY = camera.clientY;
  
  // Convert mouse position to world coordinates before zoom
  const worldPosBeforeZoom = screenToWorldCoordinates(mouseX, mouseY);
  
  zoomFactor = Math.max(Math.min(zoomFactor * (1 - zoomSpeed), 6), 0.01);
  zoomFactor = parseFloat(zoomFactor.toFixed(3));
  
  // Convert the same world position back to screen coordinates after zoom
  const screenPosAfterZoom = worldToScreenCoordinates(worldPosBeforeZoom.x, worldPosBeforeZoom.y);
  
  // Adjust camera position to keep mouse position fixed
  if(!cameraFollow) {
    camera.x += (screenPosAfterZoom.x - mouseX) / zoomFactor;
    camera.y += (screenPosAfterZoom.y - mouseY) / zoomFactor;
  }
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
 * @param {Object} [webglRenderer] - Optional WebGL renderer to resize
 * @param {Object} [gravityFieldRenderer] - Optional gravity field renderer to resize
 */
function resizeCanvas(webglRenderer, gravityFieldRenderer) {
  canvas.width = window.innerWidth - 1;
  canvas.height = window.innerHeight - 1;
  starCanvas.width = window.innerWidth - 1;
  starCanvas.height = window.innerHeight - 1;
  trailCanvas.width = window.innerWidth - 1;
  trailCanvas.height = window.innerHeight - 1;
  webglCanvas.width = window.innerWidth - 1;
  webglCanvas.height = window.innerHeight - 1;
  
  // Resize WebGL renderer if provided
  if (webglRenderer) {
    webglRenderer.resize(window.innerWidth - 1, window.innerHeight - 1);
  }
  
  // Resize gravity field renderer if provided
  if (gravityFieldRenderer) {
    gravityFieldRenderer.resize(window.innerWidth - 1, window.innerHeight - 1);
  }
}

/**
 * Finds the closest celestial body to the given screen coordinates.
 * @param {number} screenX The x coordinate on the screen
 * @param {number} screenY The y coordinate on the screen
 * @returns {Object|null} The closest celestial body object or null if none found
 */

function findClosestBody(screenX, screenY) {
  if (celestialBodies.length === 0) return null;
  
  const {x: worldX, y: worldY} = screenToWorldCoordinates(screenX, screenY);
  
  let closestBody = null;
  let minDistance = Infinity;
  const clickThreshold = 100 / zoomFactor;
  
  celestialBodies.forEach(body => {
    const distance = Math.sqrt((body.x - worldX) ** 2 + (body.y - worldY) ** 2);
    
    if (distance < clickThreshold && distance < minDistance) {
      minDistance = distance;
      closestBody = body;
    }
  });
  
  return closestBody;
}


/**
 * Calculates the orbital velocity needed for a circular orbit at a given distance from a central mass.
 * Uses the formula: v = sqrt(GM/r)
 * @param {number} centralMass - Mass of the central body
 * @param {number} distance - Distance from the central body
 * @param {number} G - Gravitational constant (default: 0.1 to match simulation)
 * @returns {number} Orbital velocity magnitude
 */
function calculateOrbitalVelocity(centralMass, distance, G = 0.1) {
  return Math.sqrt(G * centralMass / distance);
}

/**
 * Creates orbital velocity components for a body orbiting around a central point.
 * @param {number} centerX - X coordinate of the central body
 * @param {number} centerY - Y coordinate of the central body
 * @param {number} orbitX - X coordinate of the orbiting body
 * @param {number} orbitY - Y coordinate of the orbiting body
 * @param {number} orbitalSpeed - Magnitude of orbital velocity
 * @param {boolean} clockwise - Whether to orbit clockwise (default: false for counter-clockwise)
 * @returns {{dx: number, dy: number}} Velocity components
 */
function createOrbitalVelocity(centerX, centerY, orbitX, orbitY, orbitalSpeed, clockwise = false) {
  const dx = orbitX - centerX;
  const dy = orbitY - centerY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance === 0) return { dx: 0, dy: 0 };
  
  // Perpendicular direction for circular orbit
  const perpX = clockwise ? dy / distance : -dy / distance;
  const perpY = clockwise ? -dx / distance : dx / distance;
  
  return {
    dx: perpX * orbitalSpeed,
    dy: perpY * orbitalSpeed
  };
}

export { screenToWorldCoordinates, worldToScreenCoordinates, zoomIn, zoomOut, hexToRGB, resizeCanvas, findClosestBody, calculateOrbitalVelocity, createOrbitalVelocity };