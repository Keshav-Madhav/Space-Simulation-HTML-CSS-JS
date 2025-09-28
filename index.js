import { drawFPS } from "./functions/fpsDisplay.js";
import { spawnDeterministicTestSystem } from "./functions/spawnTemplates.js";
import { getDeltaTime } from "./functions/deltaTime.js";
import { BackgroundStar } from "./classes/BackgroundStarsClass.js";
import { TrailManager } from "./classes/TrailManagerClass.js";
import { zoomIn, zoomOut, hexToRGB, resizeCanvas, findClosestBody } from "./functions/utils.js";
import { spawnPlanetsNearMouse, spawnPlanetWithLightSpeed, setupThreeBodyProblem, spawnSolarSystem, spawnGalaxy, spawnBinaryStarSystem, spawnMeteorShower } from "./functions/spawnTemplates.js";
import { smoothFollow, updateCameraToFollowCenterOfMass } from "./functions/cameraHelper.js";
import { prompt, showPrompts, clearPrompts } from "./functions/showPrompts.js";
import { startDragHandler, drawTrajectory } from "./functions/dragListeners.js";
import { PhysicsSystem } from "./classes/PhysicsSystem.js";

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
timeScaleSlider.addEventListener('input', function() {
  timeScale = parseFloat(this.value);
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
zoomMinus.addEventListener('click', zoomIn);
zoomPlus.addEventListener('click', zoomOut);


// Add event listeners to toggle features

collision.addEventListener('change', function() {
  collideIsON = this.checked;
});
massTransfer.addEventListener('change', function() {
  massTransferEnabled = this.checked;
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

deterministicTest.addEventListener('click', function() {
  celestialBodies.length = 0;
  spawnDeterministicTestSystem();
  prompt({
    text: 'Deterministic test system spawned',
    y: canvas.height - 20,
    vel: 0,
    time: 0.2,
    textSize: 16,
    isOverRide: true
  });
});

solarSystem.addEventListener('click', function() {
  celestialBodies.length = 0;
  zoomFactor = 0.02;
  velocityUnit = 'km/s';
  showTrailsIsON = showTrails.checked = false;
  showStarsIsON = showStars.checked = false;

  spawnSolarSystem();
});

galaxySpawn.addEventListener('click', function() {
  zoomFactor = 0.3;
  showVelocitiesIsON = showVelocities.checked = false;
  showStarsIsON = showStars.checked = false;
  collideIsON = collision.checked = false;
  celestialBodies.length = 0;

  spawnGalaxy();
});

reset.addEventListener('click', function() {
  resetEverything();
});

showTrails.addEventListener('change', function() {
  showTrailsIsON = this.checked;
  if(!showTrailsIsON){
    trailCanvas.style.display = 'none';
    trailctx.clearRect(0, 0, canvas.width, canvas.height);
    
    trailManager.clearAllTrails();
  } else {
    trailCanvas.style.display = 'block';
    trailctx.clearRect(0, 0, canvas.width, canvas.height);
  }
});

function createBackgroundStars(numStars) {
  for (let i = 0; i < numStars; i++) {
    backgroundStars.push(new BackgroundStar());
  }
}

createBackgroundStars(1000);

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
    backgroundStars.length = 0;
    createBackgroundStars(1500);
    drawBackgroundStars();
  } else {
    starCanvas.style.display = 'none';
    backgroundStars.length = 0;
    drawBackgroundStars();
  }
});

canvas.addEventListener('mousedown', startDragHandler);

canvas.addEventListener('dblclick', function(event) {
  const rect = canvas.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const clickY = event.clientY - rect.top;
  
  const closestBody = findClosestBody(clickX, clickY);
  
  if (closestBody) {
    cameraFollowingIndex = celestialBodies.indexOf(closestBody);
    cameraFollow = true;
    followCam.checked = true;
    
    prompt({
      text: `Now following ${closestBody.label}`,
      y: canvas.height - 20,
      vel: 20,
      time: 0.4,
      textSize: 16,
      isOverRide: true
    });
  } else {
    prompt({
      text: "No body nearby to follow",
      y: canvas.height - 20,
      vel: 20,
      time: 0.1,
      textSize: 16,
      isOverRide: true
    });
  }
});

document.addEventListener('keydown', function (event) {
  if (keys.hasOwnProperty(event.key)) {
    keys[event.key] = true;
  } 
  if (event.key === 'w'){
    keys.ArrowUp = true;
  } 
  if (event.key === 's'){
    keys.ArrowDown = true;
  }
  if (event.key === 'a'){
    keys.ArrowLeft = true;
  }
  if (event.key === 'd'){
    keys.ArrowRight = true;
  }

  if (event.code === 'Backspace') {
    if(cameraFollowingIndex !== -1 && celestialBodies.length > 0 && cameraFollow){
      const removedBody = celestialBodies.splice(cameraFollowingIndex, 1);
      trailManager.clearTrail(removedBody[0].id);
      cameraFollowingIndex = 0;
      cameraFollow = false;
      followCam.checked = false;
    } else {
      prompt({
        text: "No body to delete",
        y: canvas.height - 20,
        vel: 20,
        time: 0.1,
        textSize: 16,
        isOverRide: true
      });
    }
  }
  if (event.key === 'Shift') {
    camSpeed = 20;
    camSpeedElement.value = 20;
  }
  if(event.key === 'Control'){
    camSpeed = 1;
    camSpeedElement.value = 1;
  }

  if(event.key === 'p'){
    isPaused = !isPaused;
    clearPrompts();
    prompt({
      text: isPaused ? 'Simulation Paused' : 'Simulation Resumed',
      y: canvas.height - 20,
      vel: 0,
      time: isPaused ? 0 : 0.4,
      textSize: 16,
      isOverRide: true
    });
  }

  if (event.key === '0' || event.key === '1' || event.key === '2' || event.key === '3') {
    switch (event.key) {
      case '0':
        selectedBody = '';
        break;
      case '1':
        selectedBody = 'Planet';
        break;
      case '2':
        selectedBody = 'Star';
        break;
      case '3':
        selectedBody = 'Black Hole';
        break;
    }
    startDrag = null;
    endDrag = null;
  }

  // Handle cycling through celestial bodies using 'n' and 'm'
  if (event.key === 'e' || event.key === 'q') {
    const direction = event.key === 'e' ? 1 : -1;
    cameraFollowingIndex = (cameraFollowingIndex + direction + celestialBodies.length) % celestialBodies.length;
  }

  // Increase / Decrease Time Scale
  if (event.key === '-') {
    timeScale = Math.max(0.1, timeScale - 0.1);
    timeScaleElement.value = timeScale;
  }
  if (event.key === '=') {
    timeScale = Math.min(50, timeScale + 0.1);
    timeScaleElement.value = timeScale;
  }

  if (event.key === 'c') {
    
    if(celestialBodies.length === 0){
      prompt({
        text: "No bodies to follow",
        y: canvas.height - 20,
        vel: 20,
        time: 0.1,
        textSize: 16,
        isOverRide: true
      });
    } else {
      cameraFollow = !cameraFollow;
    }
  }

  if (event.key === 'r') {
    resetEverything();
  }

  if (event.key === 'k') {
    // zoomFactor = 0.05;
    // collideIsON = collision.checked = false;
    showTrailsIsON = showTrails.checked = false;
    showStarsIsON = showStars.checked = false;
    showVelocitiesIsON = showVelocities.checked = false;
    showLabelsIsON = showLabels.checked = false;
    showFPSIsON = showFPS.checked = true;
    spawnPlanetsNearMouse(1500);
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

  if(event.key === 'l'){
    clearPrompts();
    playInstructions();
  }

  if(event.key === '.'){
    clearPrompts();
  }

  if(event.key === 'g'){
    zoomFactor = 0.15;
    showVelocitiesIsON = showVelocities.checked = false;
    showStarsIsON = showStars.checked = false;
    collideIsON = collision.checked = false;
    celestialBodies.length = 0;

    spawnGalaxy();
  }

  if(event.key === 'h'){
    spawnSolarSystem();
  }

  if(event.key === 'b'){
    spawnBinaryStarSystem();
  }

  if(event.key === 'm'){
    spawnMeteorShower();
  }

  if(event.key === 'y'){
    celestialBodies.length = 0;
    spawnDeterministicTestSystem();
    prompt({
      text: 'Deterministic test system spawned',
      y: canvas.height - 20,
      vel: 0,
      time: 0.2,
      textSize: 16,
      isOverRide: true
    });
  }

  if(event.key === 'z'){
    showDebugPoints = !showDebugPoints;
  }

  if(event.key === 'n'){
    // Pin/unpin the currently followed body
    if(cameraFollowingIndex !== -1 && celestialBodies.length > 0 && cameraFollow){
      const followedBody = celestialBodies[cameraFollowingIndex];
      followedBody.togglePin();
      
      clearPrompts();
      prompt({
        text: followedBody.isPinned ? 
          `${followedBody.label} is now PINNED` : 
          `${followedBody.label} is now UNPINNED`,
        y: canvas.height - 20,
        vel: 20,
        time: 0.15,
        textSize: 16,
        isOverRide: true
      });
    } else {
      clearPrompts();
      prompt({
        text: "No body being followed to pin/unpin",
        y: canvas.height - 20,
        vel: 20,
        time: 0.1,
        textSize: 16,
        isOverRide: true
      });
    }
  }
});

window.addEventListener('keyup', function(e) {
  if (keys.hasOwnProperty(e.key)) {
    keys[e.key] = false;
  }
  if (e.key === 'w'){
    keys.ArrowUp = false;
  }
  if (e.key === 's'){
    keys.ArrowDown = false;
  }
  if (e.key === 'a'){
    keys.ArrowLeft = false;
  }
  if (e.key === 'd'){
    keys.ArrowRight = false;
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

canvas.addEventListener('mousemove', function(event) {
  camera.clientX = event.clientX;
  camera.clientY = event.clientY;
})

// Create a new trail manager instance
const trailManager = new TrailManager({ context: trailctx });

// Create a new physics system instance
const physicsSystem = new PhysicsSystem();

function draw() {
  const deltaTime = getDeltaTime();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!isPaused) {
    for (let i = 0; i < timeScale; i++) {
      // Update physics system (handles collisions and attraction forces between bodies using Barnes-Hut algorithm)
      physicsSystem.update(celestialBodies, collideIsON);
      
      // Update all bodies
      for (let j = 0; j < celestialBodies.length; j++) {
        celestialBodies[j].update();
      }
    }
  }

  if (keys.ArrowUp) camera.y -= (camSpeed / Math.sqrt(zoomFactor));
  if (keys.ArrowDown) camera.y += (camSpeed / Math.sqrt(zoomFactor));
  if (keys.ArrowLeft) camera.x -= (camSpeed / Math.sqrt(zoomFactor));
  if (keys.ArrowRight) camera.x += (camSpeed / Math.sqrt(zoomFactor));

  if (celestialBodies.length > 0 && cameraFollow) {
    if (cameraFollowingIndex === -1) {
      updateCameraToFollowCenterOfMass();
    } else if (cameraFollowingIndex < celestialBodies.length) {
      const followedBody = celestialBodies[cameraFollowingIndex];
      const targetX = followedBody.x - canvas.width / 2;
      const targetY = followedBody.y - canvas.height / 2;

      smoothFollow(targetX, targetY, followedBody);
    }
  }

  // Apply zoom and camera transformation
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.scale(zoomFactor, zoomFactor);
  ctx.translate(-canvas.width / 2, -canvas.height / 2);

  if(showStarsIsON) {
    if (camera.prevX !== camera.x || camera.prevY !== camera.y) {
      starCtx.clearRect(0, 0, canvas.width, canvas.height);
      drawBackgroundStars();
    }
  } else {
    starCtx.clearRect(0, 0, canvas.width, canvas.height);
  }

  for (let i = 0; i < celestialBodies.length; i++) {
    const body = celestialBodies[i];

    // Handle trails
    if (showTrailsIsON) {
      trailManager.initializeTrail(body.id, body.trailColor);
      trailManager.updateTrail(body.id, body.x, body.y, body.dx, body.dy);
    }

    // Update and draw body
    if (!isPaused) body.update();
    body.draw();
  }

  showTrailsIsON && trailManager.drawTrails(camera);

  // Draw trajectory if dragging
  if (startDrag && endDrag) {
    drawTrajectory(startDrag.x, startDrag.y, endDrag.x, endDrag.y, physicsSystem);
  }

  ctx.restore();

  // Update last camera position
  camera.prevX = camera.x;
  camera.prevY = camera.y;

  updateUI(deltaTime);

  requestAnimationFrame(draw);
}

draw();

function updateUI(deltaTime) {
  ctx.fillStyle = 'white';
  ctx.font = '14px Arial';
  ctx.fillText(`(${camera.x.toFixed(2)}, ${camera.y.toFixed(2)})`, 10, canvas.height - 20);
  ctx.fillText(`Zoom Scale: ${zoomFactor}`, 10, canvas.height - 6);
  ctx.fillText(`Time Scale: ${timeScale.toFixed(1)}x`, 10, canvas.height - 34);

  if(selectedBody){
    const text = `Selected Body: ${selectedBody}`;
    ctx.fillText(text, canvas.width - ctx.measureText(text).width - 10, canvas.height - 20);
  }

  if(celestialBodies.length > 0){
    const text = `Bodies: ${celestialBodies.length}`;
    ctx.fillText(text, canvas.width - ctx.measureText(text).width - 10, window.innerHeight - 40);
  }

  if(cameraFollow){
    const text = cameraFollowingIndex === -1 ? 'Following Center of Mass' : `Following: ${celestialBodies[cameraFollowingIndex].label}`
    ctx.fillStyle = cameraFollowingIndex === -1 ? 'white' : celestialBodies[cameraFollowingIndex].textColor;
    ctx.fillText(text, canvas.width - ctx.measureText(text).width - 10, canvas.height - 6);
  }

  showPrompts(deltaTime);

  if (showFPSIsON) drawFPS(canvas.width, canvas.height, ctx);
}

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
  timeScaleSlider.value = timeScale = 1;

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

  // Reset the trail canvas and clear all trails
  trailctx.clearRect(0, 0, canvas.width, canvas.height);
  trailManager.clearAllTrails();
}

function playInstructions() {
  prompt({
    text: "Use number keys to select a celestial body",
    y: canvas.height - 50,
    vel: 140,
    time: 0.2
  });

  prompt({
    text: "Click to place a body or drag to launch it",
    y: canvas.height - 50,
    vel: 140,
    time: 0.2
  });

  prompt({
    text: "Use WASD to move camera and scroll to zoom in/out",
    y: canvas.height - 50,
    vel: 140,
    time: 0.2
  });

  prompt({
    text: "Press C to follow a body, E/Q to cycle through bodies",
    y: canvas.height - 50,
    vel: 140,
    time: 0.2
  });

  prompt({
    text: "Use settings menu in top left to customize the simulation",
    y: canvas.height - 50,
    vel: 140,
    time: 0.2
  });

  prompt({
    text: "(L) to replay instructions. (.) to clear prompts",
    y: 60,
    x: 10,
    vel: 0,
    time: 0.05,
    textSize: 16,
    isOverRide: true,
  })
}

playInstructions();