import { screenToWorldCoordinates } from "./utils.js";
import { CelestialBody } from "../classes/CelestialBodyClass.js";
import { prompt } from "./showPrompts.js";

let isShiftPressed = false;
let isFirstDrag = true;

// Add shift key listeners
document.addEventListener('keydown', (e) => {
  if (e.key === 'Shift') isShiftPressed = true;
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'Shift') isShiftPressed = false;
});

function startDragHandler(e) {
  e.preventDefault();
  if(selectedBody !== '') {
    startDrag = screenToWorldCoordinates(e.clientX, e.clientY);
  } else {
    if (isFirstDrag) {
      prompt({
        text: 'Press (c) to camera follow a celestial body.',
        vel: 20,
        time: 0.1,
        y: canvas.height - 20,
        textSize: 20,
        isOverRide: true
      });
      isFirstDrag = false;
    }
    camera.lastMouseX = e.clientX;
    camera.lastMouseY = e.clientY;
  }
  canvas.addEventListener('mousemove', dragHandler);
  canvas.addEventListener('mouseup', endDragHandler);
}

function dragHandler(e) {
  e.preventDefault();
  if(selectedBody !== '') {
    endDrag = screenToWorldCoordinates(e.clientX, e.clientY);
  } else {
    // Calculate the difference from the last mouse position
    const deltaX = e.clientX - camera.lastMouseX;
    const deltaY = e.clientY - camera.lastMouseY;
    
    // Apply speed multiplier if shift is pressed
    const speedMultiplier = isShiftPressed ? 3 : 1;
    
    // Update camera position with speed multiplier
    camera.x -= (deltaX * speedMultiplier)/ Math.sqrt(zoomFactor);
    camera.y -= (deltaY * speedMultiplier) / Math.sqrt(zoomFactor);
    
    // Update last mouse position for next frame
    camera.lastMouseX = e.clientX;
    camera.lastMouseY = e.clientY;
  }
}

function drawTrajectory(startX, startY, endX, endY) {
  const cameraAdjustedStartX = startX - camera.x;
  const cameraAdjustedStartY = startY - camera.y;
  const cameraAdjustedEndX = endX - camera.x;
  const cameraAdjustedEndY = endY - camera.y;

  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(cameraAdjustedStartX, cameraAdjustedStartY);
  ctx.lineTo(cameraAdjustedEndX, cameraAdjustedEndY);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.stroke();
  ctx.setLineDash([]);
}

function endDragHandler(e) {
  e.preventDefault();
  if (startDrag) {
    endDrag = screenToWorldCoordinates(e.clientX, e.clientY);

    const dx = endDrag.x - startDrag.x;
    const dy = endDrag.y - startDrag.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const maxSpeed = 50;
    const launchSpeed = Math.min(0.05 * distance, maxSpeed);

    let launchVelocityX = 0;
    let launchVelocityY = 0;

    if (launchSpeed > 0) {
      launchVelocityX = (dx / distance) * launchSpeed;
      launchVelocityY = (dy / distance) * launchSpeed;
    }

    if (selectedBody === 'Planet') {
      celestialBodies.push(
        new CelestialBody({
          bodyType: 'planet',
          radius: celestialBodyValues.planet.radius,
          density: celestialBodyValues.planet.density,
          x: endDrag.x,
          y: endDrag.y,
          dx: -launchVelocityX,
          dy: -launchVelocityY,
          color: celestialBodyValues.planet.color,
          label: 'Planet ' + (celestialBodies.length + 1)
        })
      );
    } else if (selectedBody === 'Star') {
      celestialBodies.push(
        new CelestialBody({
          bodyType: 'star',
          radius: celestialBodyValues.star.radius,
          density: celestialBodyValues.star.density,
          x: endDrag.x,
          y: endDrag.y,
          dx: -launchVelocityX,
          dy: -launchVelocityY,
          color: celestialBodyValues.star.color,
          label: 'Star ' + (celestialBodies.length + 1)
        })
      );
    } else if (selectedBody === 'Black Hole') {
      celestialBodies.push(
        new CelestialBody({
          bodyType: 'blackHole',
          radius: celestialBodyValues.blackHole.radius,
          density: celestialBodyValues.blackHole.density,
          x: endDrag.x,
          y: endDrag.y,
          dx: -launchVelocityX,
          dy: -launchVelocityY,
          color: celestialBodyValues.blackHole.color,
          label: 'Black Hole ' + (celestialBodies.length + 1),
          trailColor: 'rgba(100, 100, 100, 0.5)',
          textColor: 'rgba(255, 255, 255, 0.9)'
        })
      );
    }

    startDrag = null;
    endDrag = null;
    selectedBody = '';
  }
  canvas.removeEventListener('mousemove', dragHandler);
  canvas.removeEventListener('mouseup', endDragHandler);
}

export { startDragHandler, dragHandler, endDragHandler, drawTrajectory };