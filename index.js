import { bodyCollide } from "./functions/collisionAndMassTransfer.js";
import { drawFPS } from "./functions/fpsDisplay.js";
import { createConstantFPSGameLoop } from "./functions/createConstantFPSGameLoop.js";
import { CelestialBody } from "./classes/CelestialBodyClass.js";
import { BackgroundStar } from "./classes/BackgroundStarsClass.js";
import { screenToWorldCoordinates, zoomIn, zoomOut, hexToRGB, resizeCanvas } from "./functions/utils.js";
import { spawnPlanetsNearMouse, spawnPlanetWithLightSpeed, setupThreeBodyProblem } from "./functions/spawnTemplates.js";

//resize canvas
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Add event listeners to update celestial body values

PlanetRadius.addEventListener('input', function() {
  celestialBodyValues.planet.radius = parseInt(this.value);
});
PlanetDensity.addEventListener('input', function() {
  celestialBodyValues.planet.density = parseFloat(this.value);
});
PlanetColor.addEventListener('input', function() {
  celestialBodyValues.planet.color = hexToRGB(this.value);
});
StarRadius.addEventListener('input', function() {
  celestialBodyValues.star.radius = parseInt(this.value);
});
StarDensity.addEventListener('input', function() {
  celestialBodyValues.star.density = parseFloat(this.value);
});
StarColor.addEventListener('input', function() {
  celestialBodyValues.star.color = hexToRGB(this.value);
});
BlackHoleRadius.addEventListener('input', function() {
  celestialBodyValues.blackHole.radius = parseInt(this.value);
});
BlackHoleDensity.addEventListener('input', function() {
  celestialBodyValues.blackHole.density = parseFloat(this.value);
});
BlackHoleColor.addEventListener('input', function() {
  celestialBodyValues.blackHole.color = hexToRGB(this.value);
});


// Add event listeners to camera settings

followCam.addEventListener('change', function() {
  cameraFollow = this.checked;
});
camSpeedElement.addEventListener('input', function() {
  camSpeed = parseInt(this.value);
});
prev.addEventListener('click', function() {
  cameraFollowingIndex = (cameraFollowingIndex - 1 + celestialBodies.length) % celestialBodies.length;
  cameraFollow = true;
  followCam.checked = true;
});
next.addEventListener('click', function() {
  cameraFollowingIndex = (cameraFollowingIndex + 1) % celestialBodies.length;
  cameraFollow = true;
  followCam.checked = true;
});
centerMass.addEventListener('click', function() {
  cameraFollowingIndex = -1;
  cameraFollow = true;
  followCam.checked = true;
});


// Add event listeners to toggle features

collision.addEventListener('change', function() {
  collideIsON = this.checked;
});
showVelocities.addEventListener('change', function() {
  showVelocitiesIsON = this.checked;
});
showLabels.addEventListener('change', function() {
  showLabelsIsON = this.checked;
});
showFPS.addEventListener('change', function() {
  showFPSIsON = this.checked;
});

veloctyUnit.addEventListener('click', function() {
  if(velocityUnit === 'm/s'){
    velocityUnit = 'km/s';
  } else {
    velocityUnit = 'm/s';
  }
  veloctyUnit.textContent = velocityUnit;
});

threeBody.addEventListener('click', function() {
  celestialBodies.length = 0;
  setupThreeBodyProblem();
  cameraFollow = true;
  followCam.checked = true;
  cameraFollowingIndex = -1;
  collideIsON = false;
  collision.checked = false;
});

cluster.addEventListener('click', function() {
  spawnPlanetsNearMouse(15); 
});

lightSpeedP.addEventListener('click', function() {
  spawnPlanetWithLightSpeed();
  cameraFollow = true;
  followCam.checked = true;
});

reset.addEventListener('click', function() {
  resetEverything();
});

showTrails.addEventListener('change', function() {
  showTrailsIsON = this.checked;
  if(!showTrailsIsON){
    trailCanvas.style.display = 'none';
    trailctx.clearRect(0, 0, canvas.width, canvas.height);
    celestialBodies.forEach(body => {
      body.trajectory = [];
    });
  } else {
    trailCanvas.style.display = 'block';
  }
});

function createBackgroundStars(numStars) {
  for (let i = 0; i < numStars; i++) {
    backgroundStars.push(new BackgroundStar());
  }
}

createBackgroundStars(1500);

// Modify the drawBackgroundStars function to apply distortion
function drawBackgroundStars() {
  backgroundStars.forEach(star => {
    star.draw();
  });
}
drawBackgroundStars();

showStars.addEventListener('change', function() {
  showStarsIsON = this.checked;
  if(showStarsIsON){
    starCanvas.style.display = 'block';
    createBackgroundStars(1500);
    drawBackgroundStars();
  } else {
    starCanvas.style.display = 'none';
    backgroundStars.length = 0;
    drawBackgroundStars();
  }
});

document.addEventListener('keydown', function (event) {
  if (event.key === 'p' || event.key === 's' || event.key === 'b') {
    lastPressedKey = event.key;
    startDrag = null;
    endDrag = null;
    canvas.addEventListener('mousedown', startDragHandler);
  }

  // Handle cycling through celestial bodies using 'n' and 'm'
  if (event.key === 'n' || event.key === 'm') {
    const direction = event.key === 'n' ? 1 : -1;
    cameraFollowingIndex = (cameraFollowingIndex + direction + celestialBodies.length) % celestialBodies.length;
  }

  // Handle following celestial bodies using numbers '0' to '9'
  if (event.key >= '0' && event.key <= '9') {
    const index = parseInt(event.key);
    if (index < celestialBodies.length) {
      cameraFollowingIndex = index;
    }
  }

  if (event.key === 'c') {
    cameraFollow = !cameraFollow;
  }

  if (event.key === 'r') {
    resetEverything();
  }

  if (event.key === 'k') {
    spawnPlanetsNearMouse(15);
  }

  if (event.key === 't'){
    setupThreeBodyProblem();
    cameraFollow = true;
    cameraFollowingIndex = -1;
    collideIsON = false;
  }

  if(event.key === 'x'){
    collideIsON = !collideIsON;
  }
});

window.addEventListener('keydown', function(e) {
  if (keys.hasOwnProperty(e.key)) {
    keys[e.key] = true;
  }
  if (e.key === ' '){
    camera.x = 0;
    camera.y = 0;
  }
  if (e.code === 'Backspace') {
    cameraFollowingIndex = -1;
    cameraFollow = true;
  }
  if (e.key === 'Shift') {
    camSpeed = 20;
    camSpeedElement.value = 20;
  }
  if(e.key === 'Control'){
    camSpeed = 1;
    camSpeedElement.value = 1;
  }
}); 

window.addEventListener('keyup', function(e) {
  if (keys.hasOwnProperty(e.key)) {
    keys[e.key] = false;
  }
  if (e.key === 'Shift') {
    camSpeed = 5;
    camSpeedElement.value = 5;
  }
  if(e.key === 'Control'){
    camSpeed = 5;
    camSpeedElement.value = 5;
  }
});

canvas.addEventListener('wheel', function(event) {
  event.preventDefault();
  if (event.deltaY < 0) {
    zoomIn();
  } else {
    zoomOut();
  }
});


function startDragHandler(e) {
  e.preventDefault();
  const worldCoords = screenToWorldCoordinates(e.clientX, e.clientY);
  startDrag = worldCoords;
  canvas.addEventListener('mousemove', dragHandler);
  canvas.addEventListener('mouseup', endDragHandler);
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

function dragHandler(e) {
  e.preventDefault();
  const worldCoords = screenToWorldCoordinates(e.clientX, e.clientY);
  drawTrajectory(startDrag.x, startDrag.y, worldCoords.x, worldCoords.y);
  endDrag = worldCoords;
}

function endDragHandler(e) {
  e.preventDefault();
  if (startDrag) {
    const worldCoords = screenToWorldCoordinates(e.clientX, e.clientY);
    endDrag = worldCoords;

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

    if (lastPressedKey === 'p') {
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
    } else if (lastPressedKey === 's') {
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
    }else if (lastPressedKey === 'b') {
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

    canvas.removeEventListener('mousemove', dragHandler);
    canvas.removeEventListener('mouseup', endDragHandler);
    canvas.removeEventListener('mousedown', startDragHandler);
    lastPressedKey = null;
  }
}

function updateCameraToFollowCenterOfMass() {
  if (celestialBodies.length === 0) return;

  let totalMass = 0;
  let centerX = 0;
  let centerY = 0;

  celestialBodies.forEach(body => {
    totalMass += body.weight;
    centerX += body.x * body.weight;
    centerY += body.y * body.weight;
  });

  centerX /= totalMass;
  centerY /= totalMass;

  // Set the target camera position
  targetCamera.x = centerX - canvas.width / 2;
  targetCamera.y = centerY - canvas.height / 2;

  // Smoothly move the camera towards the target
  camera.x += (targetCamera.x - camera.x) * cameraMoveSpeed;
  camera.y += (targetCamera.y - camera.y) * cameraMoveSpeed;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  trailctx.clearRect(0, 0, canvas.width, canvas.height);  

  if (keys.ArrowUp) camera.y -= camSpeed;
  if (keys.ArrowDown) camera.y += camSpeed;
  if (keys.ArrowLeft) camera.x -= camSpeed;
  if (keys.ArrowRight) camera.x += camSpeed;

  if (celestialBodies.length > 0 && cameraFollow) {
    if (cameraFollowingIndex === -1) {
      updateCameraToFollowCenterOfMass();
    } else if (cameraFollowingIndex < celestialBodies.length) {
      const followedBody = celestialBodies[cameraFollowingIndex];
      targetCamera.x = followedBody.x - canvas.width / 2;
      targetCamera.y = followedBody.y - canvas.height / 2;
      camera.x += (targetCamera.x - camera.x) * cameraMoveSpeed;
      camera.y += (targetCamera.y - camera.y) * cameraMoveSpeed;
    }
  }

  // Apply zoom and camera transformation
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.scale(zoomFactor, zoomFactor);
  ctx.translate(-canvas.width / 2, -canvas.height / 2);
  ctx.translate(-camera.x, -camera.y);

  trailctx.save();
  trailctx.translate(canvas.width / 2, canvas.height / 2);
  trailctx.scale(zoomFactor, zoomFactor);
  trailctx.translate(-canvas.width / 2, -canvas.height / 2);
  trailctx.translate(-camera.x, -camera.y);

  if(showStarsIsON){
    if (camera.prevX !== camera.x || camera.prevY !== camera.y) {
      starCtx.clearRect(0, 0, canvas.width, canvas.height);
      drawBackgroundStars();
    }
  } else {
    starCtx.clearRect(0, 0, canvas.width, canvas.height);
  }

  celestialBodies.forEach(body => {
    body.draw();
    body.update();
  });

  if (startDrag) {
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(startDrag.x, startDrag.y);

    if (endDrag) {
      ctx.lineTo(endDrag.x, endDrag.y);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.stroke();
    }

    ctx.setLineDash([]);
  }

  if(collideIsON){
    for (let i = 0; i < celestialBodies.length; i++) {
      for (let j = i + 1; j < celestialBodies.length; j++) {
        const dx = celestialBodies[i].x - celestialBodies[j].x;
        const dy = celestialBodies[i].y - celestialBodies[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
  
        if (distance < celestialBodies[i].radius + celestialBodies[j].radius) {
          bodyCollide(celestialBodies[i], celestialBodies[j]);
        }
      }
    }
  }

  ctx.restore();
  trailctx.restore();

  // Update last camera position
  camera.prevX = camera.x;
  camera.prevY = camera.y;

  ctx.fillStyle = 'white';
  ctx.font = '14px Arial';
  ctx.fillText(`(${camera.x.toFixed(2)}, ${camera.y.toFixed(2)})`, 10, canvas.height - 10);

  if (showFPSIsON) drawFPS(canvas.width, canvas.height, ctx);

  requestAnimationFrame(draw);
}

draw();

// Reset all celestial bodies and settings
function resetEverything() {
  celestialBodies.length = 0;

  // Reset celestial body values
  PlanetRadius.value = celestialBodyValues.planet.radius = 4;
  PlanetDensity.value = celestialBodyValues.planet.density = 0.5;
  celestialBodyValues.planet.color = { r: 255, g: 255, b: 255 };
  PlanetColor.value = '#ffffff';
  StarRadius.value = celestialBodyValues.star.radius = 10;
  StarDensity.value = celestialBodyValues.star.density = 2;
  celestialBodyValues.star.color = { r: 255, g: 165, b: 0 };
  StarColor.value = '#ffa500';
  BlackHoleRadius.value = celestialBodyValues.blackHole.radius = 15;
  BlackHoleDensity.value = celestialBodyValues.blackHole.density = 30;
  celestialBodyValues.blackHole.color = { r: 0, g: 0, b: 0 };
  BlackHoleColor.value = '#000000';

  // Reset toggle settings
  collideIsON = collision.checked = true;
  showTrailsIsON = showTrails.checked = true;
  showStarsIsON = showStars.checked = true;
  showFPSIsON = showFPS.checked = true;
  showVelocitiesIsON = showVelocities.checked = true;
  showLabelsIsON = showLabels.checked = true;

  // Reset camera settings
  cameraFollow = followCam.checked = false;
  cameraFollowingIndex = 0;
  camera.x = 0;
  camera.y = 0;
  camera.prevX = 0;
  camera.prevY = 0;
  camSpeed = camSpeedElement.value = 5;
  zoomFactor = 1;

  // Clear the background stars and redraw them
  backgroundStars.length = 0;
  createBackgroundStars(1500);
  starCtx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackgroundStars();
}
