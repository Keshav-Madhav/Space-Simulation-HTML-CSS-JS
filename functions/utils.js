
const screenToWorldCoordinates = (screenX, screenY) => {
  const worldX = (screenX - canvas.width / 2) / zoomFactor + camera.x + canvas.width / 2;
  const worldY = (screenY - canvas.height / 2) / zoomFactor + camera.y + canvas.height / 2;
  return { x: worldX, y: worldY };
}

const zoomIn = () => {
  zoomFactor = Math.max(Math.min(zoomFactor + zoomSpeed, 6), 0.1);
}

const zoomOut = () => {
  zoomFactor = Math.max(Math.min(zoomFactor - zoomSpeed, 6), 0.1);
}

const hexToRGB = (hex) => {
  const r = parseInt(hex.substring(1, 3), 16);
  const g = parseInt(hex.substring(3, 5), 16);
  const b = parseInt(hex.substring(5, 7), 16);
  return { r, g, b };
}

function resizeCanvas() {
  canvas.width = window.innerWidth - 10;
  canvas.height = window.innerHeight - 5;
  starCanvas.width = window.innerWidth - 10;
  starCanvas.height = window.innerHeight - 5;
  trailCanvas.width = window.innerWidth - 10;
  trailCanvas.height = window.innerHeight - 5;
}


export { screenToWorldCoordinates, zoomIn, zoomOut, hexToRGB, resizeCanvas };