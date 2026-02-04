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
import { WebGLRenderer } from "./classes/WebGLRenderer.js";
import { GravityFieldRenderer } from "./classes/GravityFieldRenderer.js";

// Create WebGL renderer for celestial body rendering
const webglRenderer = new WebGLRenderer(webglCanvas);

// Create gravity field renderer (shares the same WebGL canvas)
const gravityFieldRenderer = new GravityFieldRenderer(webglCanvas);

//resize canvas
window.addEventListener('resize', () => resizeCanvas(webglRenderer, gravityFieldRenderer));
resizeCanvas(webglRenderer, gravityFieldRenderer);

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
timeScaleInput.addEventListener('input', function() {
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

// Dev mode toggles
devModeToggle.addEventListener('click', function() {
  devModeIsON = !devModeIsON;
  document.querySelectorAll('.dev-item').forEach(item => {
    item.style.display = devModeIsON ? 'flex' : 'none';
  });
  this.textContent = devModeIsON ? 'Disable Dev Mode (~)' : 'Enable Dev Mode (~)';
});

showBHNodes.addEventListener('change', function() {
  showBHNodesIsON = this.checked;
});

showBHCenterOfMass.addEventListener('change', function() {
  showBHCenterOfMassIsON = this.checked;
});

showTrailPoints.addEventListener('change', function() {
  showTrailPointsIsON = this.checked;
});

// Gravity field visualization event listeners
showGravityGrid.addEventListener('change', function() {
  showGravityGridIsON = this.checked;
});

showGravityVectors.addEventListener('change', function() {
  showGravityVectorsIsON = this.checked;
});

showGravityHeatmap.addEventListener('change', function() {
  showGravityHeatmapIsON = this.checked;
});

showGravityContours.addEventListener('change', function() {
  showGravityContoursIsON = this.checked;
});

gravityGridOpacity.addEventListener('input', function() {
  gravityFieldSettings.gridOpacity = parseFloat(this.value);
  gravityFieldRenderer.updateSettings({ gridOpacity: gravityFieldSettings.gridOpacity });
});

gravityHeatmapOpacity.addEventListener('input', function() {
  gravityFieldSettings.heatmapOpacity = parseFloat(this.value);
  gravityFieldRenderer.updateSettings({ heatmapOpacity: gravityFieldSettings.heatmapOpacity });
});

gravityVectorOpacity.addEventListener('input', function() {
  gravityFieldSettings.vectorOpacity = parseFloat(this.value);
  gravityFieldRenderer.updateSettings({ vectorOpacity: gravityFieldSettings.vectorOpacity });
});

gravityContourOpacity.addEventListener('input', function() {
  gravityFieldSettings.contourOpacity = parseFloat(this.value);
  gravityFieldRenderer.updateSettings({ contourOpacity: gravityFieldSettings.contourOpacity });
});

gravityWarpStrength.addEventListener('input', function() {
  gravityFieldSettings.warpStrength = parseFloat(this.value);
  gravityFieldRenderer.updateSettings({ warpStrength: gravityFieldSettings.warpStrength });
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

showControls.addEventListener('click', function() {
  document.getElementById('controlsModal').showPopover();
});

showTrails.addEventListener('change', function() {
  showTrailsIsON = this.checked;
  if(!showTrailsIsON){
    trailManager.clearAllTrails();
  }
  // Trails are now rendered via WebGL, no need to manage trailCanvas
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

// Add event listener for when the settings menu/drawer is closed
settingsMenu.addEventListener('toggle', function(event) {
  // When the menu is hidden/closed, unfocus any active input elements
  if (!event.newState || event.newState === 'closed') {
    const activeElement = document.activeElement;
    if (activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.contentEditable === 'true'
    )) {
      activeElement.blur();
    }
  }
});

canvas.addEventListener('mousedown', startDragHandler);

// Prevent context menu on canvas
canvas.addEventListener('contextmenu', function(e) {
  e.preventDefault();
});

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
  // Check if user is typing in an input field or other editable element
  const activeElement = document.activeElement;
  const isTyping = activeElement && (
    activeElement.tagName === 'INPUT' ||
    activeElement.tagName === 'TEXTAREA' ||
    activeElement.contentEditable === 'true'
  );
  
  // If user is typing, only allow certain keys (like Escape to unfocus)
  if (isTyping) {
    // Allow Escape key to unfocus the input
    if (event.key === 'Escape') {
      activeElement.blur();
    }
    return; // Skip all other keyboard shortcuts when typing
  }

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
    // Delete probe if in probe mode and probe exists
    if (probeModeEnabled && probe !== null) {
      probe = null;
      clearPrompts();
      prompt({
        text: "Probe deleted",
        y: canvas.height - 20,
        vel: 20,
        time: 0.2,
        textSize: 16,
        isOverRide: true
      });
    } else if(cameraFollowingIndex !== -1 && celestialBodies.length > 0 && cameraFollow){
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

  if(event.key === ' '){
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

  if (event.key === 'Escape') {
    selectedBody = '';
    selectedPreset = null;
    startDrag = null;
    endDrag = null;
  }

  if (event.key === '0') {
    // Toggle probe mode
    probeModeEnabled = !probeModeEnabled;
    selectedBody = '';
    selectedPreset = null;
    startDrag = null;
    endDrag = null;
    
    clearPrompts();
    prompt({
      text: probeModeEnabled ? 'Probe Mode: ON (click to place probe)' : 'Probe Mode: OFF',
      y: canvas.height - 20,
      vel: 20,
      time: 0.3,
      textSize: 16,
      isOverRide: true
    });
  }
  
  if (event.key === '1' || event.key === '2' || event.key === '3') {
    switch (event.key) {
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
    probeModeEnabled = false; // Exit probe mode when selecting body
    selectedPreset = null; // Clear preset selection when selecting body type
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
    timeScaleInput.value = timeScale;
  }
  if (event.key === '=') {
    timeScale = Math.min(50, timeScale + 0.1);
    timeScaleInput.value = timeScale;
  }
  if (event.key === '<') {
    timeScale = Math.max(0.1, timeScale - 0.1);
    timeScaleInput.value = timeScale;
  }
  if (event.key === '>') {
    timeScale = Math.min(100, timeScale + 0.1);
    timeScaleInput.value = timeScale;
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
      followCam.checked = cameraFollow;
    }
  }

  if (event.key === 'r') {
    resetEverything();
  }

  if(event.key === 'x'){
    collideIsON = !collideIsON;
    collision.checked = collideIsON;
  }

  if(event.key === 'l'){
    clearPrompts();
    playInstructions();
  }

  if(event.key === '.'){
    clearPrompts();
  }

  if(event.key === 'z'){
    showDebugPoints = !showDebugPoints;
    clearPrompts();
    prompt({
      text: `Trail Debug Points: ${showDebugPoints ? 'ON' : 'OFF'}`,
      y: canvas.height - 20,
      vel: 20,
      time: 0.3,
      textSize: 16,
      isOverRide: true
    });
  }

  // Gravity field visualization toggles (g, h, j keys)
  if(event.key === 'g'){
    showGravityGridIsON = !showGravityGridIsON;
    showGravityGrid.checked = showGravityGridIsON;
    clearPrompts();
    prompt({
      text: `Gravity Grid: ${showGravityGridIsON ? 'ON' : 'OFF'}`,
      y: canvas.height - 20,
      vel: 20,
      time: 0.2,
      textSize: 16,
      isOverRide: true
    });
  }

  if(event.key === 'h'){
    showGravityHeatmapIsON = !showGravityHeatmapIsON;
    showGravityHeatmap.checked = showGravityHeatmapIsON;
    clearPrompts();
    prompt({
      text: `Gravity Heatmap: ${showGravityHeatmapIsON ? 'ON' : 'OFF'}`,
      y: canvas.height - 20,
      vel: 20,
      time: 0.2,
      textSize: 16,
      isOverRide: true
    });
  }

  if(event.key === 'j'){
    showGravityVectorsIsON = !showGravityVectorsIsON;
    showGravityVectors.checked = showGravityVectorsIsON;
    clearPrompts();
    prompt({
      text: `Gravity Vectors: ${showGravityVectorsIsON ? 'ON' : 'OFF'}`,
      y: canvas.height - 20,
      vel: 20,
      time: 0.2,
      textSize: 16,
      isOverRide: true
    });
  }

  if(event.key === 'k'){
    showGravityContoursIsON = !showGravityContoursIsON;
    showGravityContours.checked = showGravityContoursIsON;
    clearPrompts();
    prompt({
      text: `Gravity Contours: ${showGravityContoursIsON ? 'ON' : 'OFF'}`,
      y: canvas.height - 20,
      vel: 20,
      time: 0.2,
      textSize: 16,
      isOverRide: true
    });
  }

  // Preset selection (4-9 keys) - click to spawn after selecting
  if(event.key >= '4' && event.key <= '9'){
    const presetKey = event.key;
    if(presetDefinitions[presetKey]){
      if(selectedPreset === presetKey){
        // Deselect if pressing same key
        selectedPreset = null;
        clearPrompts();
        prompt({
          text: 'Preset deselected',
          y: canvas.height - 20,
          vel: 20,
          time: 0.2,
          textSize: 16,
          isOverRide: true
        });
      } else {
        selectedPreset = presetKey;
        selectedBody = ''; // Clear body selection when selecting preset
        clearPrompts();
        prompt({
          text: `Selected: ${presetDefinitions[presetKey].name} (click to spawn)`,
          y: canvas.height - 20,
          vel: 20,
          time: 0.3,
          textSize: 16,
          isOverRide: true
        });
      }
    }
  }

  // Dev mode toggle with backtick/tilde key
  if(event.key === '`' || event.key === '~'){
    devModeIsON = !devModeIsON;
    document.querySelectorAll('.dev-item').forEach(item => {
      item.style.display = devModeIsON ? 'flex' : 'none';
    });
    devModeToggle.textContent = devModeIsON ? 'Disable Dev Mode (~)' : 'Enable Dev Mode (~)';
    clearPrompts();
    prompt({
      text: devModeIsON ? 'Dev Mode: ON' : 'Dev Mode: OFF',
      y: canvas.height - 20,
      vel: 0,
      time: 0.15,
      textSize: 16,
      isOverRide: true
    });
  }

  // Toggle FPS display
  if(event.key === 'f'){
    showFPSIsON = !showFPSIsON;
    showFPS.checked = showFPSIsON;
    clearPrompts();
    prompt({
      text: showFPSIsON ? 'FPS: ON' : 'FPS: OFF',
      y: canvas.height - 20,
      vel: 0,
      time: 0.15,
      textSize: 16,
      isOverRide: true
    });
  }

  if(event.key === 'p'){
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
  // Check if user is typing in an input field or other editable element
  const activeElement = document.activeElement;
  const isTyping = activeElement && (
    activeElement.tagName === 'INPUT' ||
    activeElement.tagName === 'TEXTAREA' ||
    activeElement.contentEditable === 'true'
  );
  
  // Skip processing if user is typing
  if (isTyping) {
    return;
  }

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
  
  // Clear WebGL canvas
  webglRenderer.clear();

  if (!isPaused) {
    // Calculate effective timestep with time scaling and frame rate independence
    let effectiveTimeStep = deltaTime * timeScale;
    
    // Limit maximum timestep to prevent instability with very high time scales
    const maxTimeStep = 0.1; // Maximum timestep of 0.1 seconds
    if (effectiveTimeStep > maxTimeStep) {
      // If timestep is too large, subdivide it
      const numSubSteps = Math.ceil(effectiveTimeStep / maxTimeStep);
      const subTimeStep = effectiveTimeStep / numSubSteps;
      
      for (let i = 0; i < numSubSteps; i++) {
        // Update physics system (handles collisions and attraction forces between bodies using Barnes-Hut algorithm)
        physicsSystem.update(celestialBodies, collideIsON, subTimeStep);
        
        // Update all bodies with the sub-timestep
        for (let j = 0; j < celestialBodies.length; j++) {
          celestialBodies[j].update(subTimeStep);
        }
      }
    } else {
      // Normal single timestep update
      physicsSystem.update(celestialBodies, collideIsON, effectiveTimeStep);
      
      // Update all bodies with the effective timestep
      for (let j = 0; j < celestialBodies.length; j++) {
        celestialBodies[j].update(effectiveTimeStep);
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

  // Set up WebGL camera transformation
  webglRenderer.setCamera(camera.x, camera.y, zoomFactor);
  gravityFieldRenderer.setCamera(camera.x, camera.y, zoomFactor);

  // Calculate view bounds for gravity field rendering
  const halfW = canvas.width / 2;
  const halfH = canvas.height / 2;
  const gravityViewBounds = {
    minX: camera.x + halfW - halfW / zoomFactor,
    maxX: camera.x + halfW + halfW / zoomFactor,
    minY: camera.y + halfH - halfH / zoomFactor,
    maxY: camera.y + halfH + halfH / zoomFactor
  };

  // Draw gravity field visualizations (behind celestial bodies)
  if (celestialBodies.length > 0) {
    // Draw heatmap first (furthest back)
    if (showGravityHeatmapIsON) {
      gravityFieldRenderer.drawHeatmap(celestialBodies, gravityViewBounds, {
        opacity: gravityFieldSettings.heatmapOpacity
      });
    }
    
    // Draw contour lines (over heatmap, under grid)
    if (showGravityContoursIsON) {
      gravityFieldRenderer.drawContours(celestialBodies, gravityViewBounds, {
        opacity: gravityFieldSettings.contourOpacity
      });
    }
    
    // Draw warped grid
    if (showGravityGridIsON) {
      gravityFieldRenderer.drawWarpedGrid(celestialBodies, gravityViewBounds, {
        opacity: gravityFieldSettings.gridOpacity
      });
    }
    
    // Draw field vectors
    if (showGravityVectorsIsON) {
      gravityFieldRenderer.drawFieldVectors(celestialBodies, gravityViewBounds, {
        opacity: gravityFieldSettings.vectorOpacity
      });
    }
  }

  // Apply zoom and camera transformation for 2D canvas (for UI elements)
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

  // Handle trails for all bodies
  if (showTrailsIsON) {
    for (let i = 0; i < celestialBodies.length; i++) {
      const body = celestialBodies[i];
      trailManager.initializeTrail(body.id, body.trailColor);
      trailManager.updateTrail(body.id, body.x, body.y, body.dx, body.dy);
    }
  }

  // Update physics for all bodies
  if (!isPaused) {
    for (let i = 0; i < celestialBodies.length; i++) {
      celestialBodies[i].update();
    }
  }
  
  // Draw ALL bodies in a single batched WebGL call (massive performance boost)
  const followedIndex = cameraFollow && cameraFollowingIndex !== -1 ? cameraFollowingIndex : -1;
  webglRenderer.drawAllBodies(celestialBodies, {
    followedBodyIndex: followedIndex,
    zoomFactor
  });
  
  // Draw labels on 2D canvas (text rendering)
  for (let i = 0; i < celestialBodies.length; i++) {
    const body = celestialBodies[i];
    const isFollowed = followedIndex === i;
    body.drawLabels(isFollowed);
  }

  // Draw trails using WebGL (much faster than Canvas 2D)
  if (showTrailsIsON && trailManager.trails.size > 0) {
    // Calculate view bounds in world space
    const halfW = canvas.width / 2;
    const halfH = canvas.height / 2;
    const viewBounds = {
      minX: camera.x + halfW - halfW / zoomFactor,
      maxX: camera.x + halfW + halfW / zoomFactor,
      minY: camera.y + halfH - halfH / zoomFactor,
      maxY: camera.y + halfH + halfH / zoomFactor
    };
    webglRenderer.drawTrails(trailManager.trails, camera, zoomFactor, viewBounds);
    
    // Draw debug trail points if enabled (either via 'z' key or dev mode checkbox)
    if (showDebugPoints || showTrailPointsIsON) {
      webglRenderer.drawTrailPoints(trailManager.trails, viewBounds, zoomFactor);
    }
  }

  // Draw trajectory if dragging
  if (startDrag && endDrag) {
    drawTrajectory(startDrag.x, startDrag.y, endDrag.x, endDrag.y, physicsSystem);
  }

  ctx.restore();

  // Draw Barnes-Hut tree visualization (after restore so it's in screen space)
  if (devModeIsON && (showBHNodesIsON || showBHCenterOfMassIsON)) {
    physicsSystem.drawTree(ctx, camera, zoomFactor, {
      showNodes: showBHNodesIsON,
      showCenterOfMass: showBHCenterOfMassIsON
    });
  }

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
  
  // Draw probe mode indicator at top center
  if (probeModeEnabled) {
    const text = '[ PROBE MODE ACTIVE ]';
    ctx.font = 'bold 16px Arial';
    const textWidth = ctx.measureText(text).width;
    
    // Draw background pill
    ctx.fillStyle = 'rgba(0, 80, 80, 0.8)';
    const pillPadding = 12;
    const pillHeight = 28;
    ctx.beginPath();
    ctx.roundRect(
      canvas.width / 2 - textWidth / 2 - pillPadding,
      10,
      textWidth + pillPadding * 2,
      pillHeight,
      14
    );
    ctx.fill();
    
    // Draw border
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.9)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw text
    ctx.fillStyle = 'rgba(0, 255, 255, 1)';
    ctx.fillText(text, canvas.width / 2 - textWidth / 2, 30);
    
    ctx.font = '14px Arial';
  }

  // Move selected body/preset and body count to bottom left
  if(probeModeEnabled){
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modKey = isMac ? 'Cmd' : 'Ctrl';
    const text = `Probe Mode (click to place, ${modKey}+click to transition)`;
    ctx.fillStyle = 'rgba(0, 255, 255, 1)';
    ctx.fillText(text, 10, canvas.height - 75);
    ctx.fillStyle = 'white';
  } else if(selectedBody){
    const text = `Selected Body: ${selectedBody}`;
    ctx.fillText(text, 10, canvas.height - 75);
  } else if(selectedPreset !== null && presetDefinitions[selectedPreset]){
    const text = `Selected Preset: ${presetDefinitions[selectedPreset].name} (click to spawn)`;
    ctx.fillStyle = 'rgba(100, 200, 255, 1)';
    ctx.fillText(text, 10, canvas.height - 75);
    ctx.fillStyle = 'white';
  }

  if(celestialBodies.length > 0){
    const text = `Bodies: ${celestialBodies.length}`;
    ctx.fillText(text, 10, canvas.height - 55);
  }

  // Only show following text for center of mass (not specific bodies)
  if(cameraFollow && cameraFollowingIndex === -1){
    const text = 'Following Center of Mass';
    ctx.fillStyle = 'white';
    ctx.fillText(text, canvas.width - ctx.measureText(text).width - 10, canvas.height - 6);
  }

  // Draw followed body info panel
  if (cameraFollow && cameraFollowingIndex !== -1 && cameraFollowingIndex < celestialBodies.length) {
    drawFollowedBodyInfo(celestialBodies[cameraFollowingIndex]);
  }
  
  // Draw probe and its info panel (if probe exists)
  if (probe) {
    drawProbe();
  }

  showPrompts(deltaTime);

  if (showFPSIsON) drawFPS(canvas.width, canvas.height, ctx);
}

/**
 * Calculates just the gravitational field strength at a point (optimized for null point search)
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 * @returns {number} Field strength magnitude
 */
function getFieldStrengthAt(x, y) {
  const G = 0.1;
  const softening = 100;
  let totalAx = 0;
  let totalAy = 0;
  
  for (const body of celestialBodies) {
    const dx = body.x - x;
    const dy = body.y - y;
    const distanceSquared = dx * dx + dy * dy;
    const softenedDistance = Math.sqrt(distanceSquared + softening * softening);
    
    if (softenedDistance > 20) {
      const acceleration = (G * body.weight) / (softenedDistance * softenedDistance);
      totalAx += acceleration * (dx / softenedDistance);
      totalAy += acceleration * (dy / softenedDistance);
    }
  }
  
  return Math.sqrt(totalAx * totalAx + totalAy * totalAy);
}

/**
 * Finds the nearest gravitational null point (where field strength is minimal)
 * Uses gradient descent with multiple starting points
 * @param {number} startX - Starting X coordinate (probe position)
 * @param {number} startY - Starting Y coordinate (probe position)
 * @param {number} searchRadius - Maximum search radius
 * @returns {Object|null} Null point data or null if not found
 */
function findNearestNullPoint(startX, startY, searchRadius = 500) {
  if (celestialBodies.length < 2) {
    // Need at least 2 bodies for a meaningful null point
    return null;
  }
  
  let bestPoint = null;
  let bestStrength = Infinity;
  
  // Grid search to find candidate regions
  const gridSize = 20;
  const step = searchRadius / gridSize;
  
  for (let i = -gridSize; i <= gridSize; i++) {
    for (let j = -gridSize; j <= gridSize; j++) {
      const testX = startX + i * step;
      const testY = startY + j * step;
      const strength = getFieldStrengthAt(testX, testY);
      
      if (strength < bestStrength) {
        bestStrength = strength;
        bestPoint = { x: testX, y: testY };
      }
    }
  }
  
  if (!bestPoint) return null;
  
  // Refine with gradient descent from best grid point
  let currentX = bestPoint.x;
  let currentY = bestPoint.y;
  let currentStrength = bestStrength;
  let stepSize = step / 2;
  
  for (let iteration = 0; iteration < 50; iteration++) {
    // Check 8 directions plus current
    const directions = [
      [0, 0], [1, 0], [-1, 0], [0, 1], [0, -1],
      [1, 1], [1, -1], [-1, 1], [-1, -1]
    ];
    
    let improved = false;
    for (const [dx, dy] of directions) {
      const testX = currentX + dx * stepSize;
      const testY = currentY + dy * stepSize;
      const strength = getFieldStrengthAt(testX, testY);
      
      if (strength < currentStrength) {
        currentStrength = strength;
        currentX = testX;
        currentY = testY;
        improved = true;
      }
    }
    
    if (!improved) {
      stepSize *= 0.5;
      if (stepSize < 0.1) break;
    }
  }
  
  // Calculate distance from probe
  const distanceFromProbe = Math.sqrt(
    (currentX - startX) * (currentX - startX) + 
    (currentY - startY) * (currentY - startY)
  );
  
  // Determine stability classification
  let stability = 'Unstable';
  if (currentStrength < 0.0001) {
    stability = 'Strong Null';
  } else if (currentStrength < 0.001) {
    stability = 'Weak Null';
  } else if (currentStrength < 0.01) {
    stability = 'Near Null';
  } else {
    stability = 'Local Minimum';
  }
  
  return {
    x: currentX,
    y: currentY,
    fieldStrength: currentStrength,
    distanceFromProbe,
    stability
  };
}

/**
 * Calculates gravitational data at a specific point in space
 * @param {number} x - X coordinate of the point
 * @param {number} y - Y coordinate of the point
 * @returns {Object} Gravitational data at the point
 */
function calculateGravityAtPoint(x, y) {
  const G = 0.1; // Same gravitational constant as in PhysicsSystem
  const softening = 100; // Same softening parameter
  
  let totalAx = 0;
  let totalAy = 0;
  let totalPotential = 0;
  let nearestBody = null;
  let nearestDistance = Infinity;
  let dominantBody = null;
  let maxContribution = 0;
  
  for (const body of celestialBodies) {
    const dx = body.x - x;
    const dy = body.y - y;
    const distanceSquared = dx * dx + dy * dy;
    const distance = Math.sqrt(distanceSquared);
    const softenedDistance = Math.sqrt(distanceSquared + softening * softening);
    
    // Track nearest body
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestBody = body;
    }
    
    // Calculate gravitational acceleration contribution
    if (softenedDistance > 20) { // Minimum distance check
      const acceleration = (G * body.weight) / (softenedDistance * softenedDistance);
      const ax = acceleration * (dx / softenedDistance);
      const ay = acceleration * (dy / softenedDistance);
      
      totalAx += ax;
      totalAy += ay;
      
      // Track dominant gravitational source
      if (acceleration > maxContribution) {
        maxContribution = acceleration;
        dominantBody = body;
      }
    }
    
    // Calculate gravitational potential (negative, as convention)
    if (distance > 1) {
      totalPotential -= (G * body.weight) / distance;
    }
  }
  
  const accelerationMagnitude = Math.sqrt(totalAx * totalAx + totalAy * totalAy);
  const accelerationAngle = Math.atan2(totalAy, totalAx);
  
  // Calculate escape velocity at this point (v = sqrt(2 * |potential|))
  const escapeVelocity = Math.sqrt(2 * Math.abs(totalPotential));
  
  // Calculate orbital velocity for circular orbit at nearest body distance
  let orbitalVelocity = 0;
  if (nearestBody && nearestDistance > nearestBody.radius) {
    orbitalVelocity = Math.sqrt(G * nearestBody.weight / nearestDistance);
  }
  
  return {
    ax: totalAx,
    ay: totalAy,
    accelerationMagnitude,
    accelerationAngle,
    potential: totalPotential,
    nearestBody,
    nearestDistance,
    dominantBody,
    escapeVelocity,
    orbitalVelocity,
    fieldStrength: accelerationMagnitude
  };
}

/**
 * Updates probe position during smooth transition
 */
function updateProbeTransition() {
  if (probe && probe.isTransitioning) {
    probe.transitionProgress += probeTransitionSpeed;
    
    if (probe.transitionProgress >= 1) {
      // Reached current target
      probe.transitionProgress = 1;
      probe.x = probe.targetX;
      probe.y = probe.targetY;
      
      // Check if there are more waypoints in the queue
      if (probe.waypoints && probe.waypoints.length > 0) {
        // Start transition to next waypoint
        const nextWaypoint = probe.waypoints.shift();
        probe.startX = probe.x;
        probe.startY = probe.y;
        probe.targetX = nextWaypoint.x;
        probe.targetY = nextWaypoint.y;
        probe.transitionProgress = 0;
        // Keep isTransitioning = true
      } else {
        probe.isTransitioning = false;
      }
    } else {
      // Smooth easing function (ease-in-out)
      const t = probe.transitionProgress;
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      
      // Linear interpolation from start to target using eased progress
      probe.x = probe.startX + (probe.targetX - probe.startX) * ease;
      probe.y = probe.startY + (probe.targetY - probe.startY) * ease;
    }
  }
}

/**
 * Draws the probe and its information panel
 */
function drawProbe() {
  if (!probe) return;
  
  // Update probe transition
  updateProbeTransition();
  
  // Calculate screen position
  const screenX = (probe.x - camera.x) * zoomFactor + canvas.width / 2 * (1 - zoomFactor);
  const screenY = (probe.y - camera.y) * zoomFactor + canvas.height / 2 * (1 - zoomFactor);
  
  // Find null point
  let nullPoint = null;
  if (celestialBodies.length >= 2) {
    nullPoint = findNearestNullPoint(probe.x, probe.y);
  }
  
  // Draw null point marker if found
  if (nullPoint) {
    const nullScreenX = (nullPoint.x - camera.x) * zoomFactor + canvas.width / 2 * (1 - zoomFactor);
    const nullScreenY = (nullPoint.y - camera.y) * zoomFactor + canvas.height / 2 * (1 - zoomFactor);
    
    // Draw line connecting probe to null point
    ctx.setLineDash([3, 6]);
    ctx.strokeStyle = 'rgba(180, 100, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(screenX, screenY);
    ctx.lineTo(nullScreenX, nullScreenY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw null point marker (diamond shape)
    const nullSize = 10;
    ctx.strokeStyle = 'rgba(180, 100, 255, 0.9)';
    ctx.fillStyle = 'rgba(180, 100, 255, 0.3)';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    ctx.moveTo(nullScreenX, nullScreenY - nullSize);
    ctx.lineTo(nullScreenX + nullSize, nullScreenY);
    ctx.lineTo(nullScreenX, nullScreenY + nullSize);
    ctx.lineTo(nullScreenX - nullSize, nullScreenY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Inner glow effect based on stability
    let glowColor = 'rgba(255, 255, 255, 0.8)';
    if (nullPoint.stability === 'Strong Null') {
      glowColor = 'rgba(100, 255, 100, 1)';
    } else if (nullPoint.stability === 'Weak Null') {
      glowColor = 'rgba(200, 255, 100, 1)';
    } else if (nullPoint.stability === 'Near Null') {
      glowColor = 'rgba(255, 255, 100, 1)';
    }
    
    ctx.fillStyle = glowColor;
    ctx.beginPath();
    ctx.arc(nullScreenX, nullScreenY, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Label
    ctx.font = '11px Arial';
    ctx.fillStyle = 'rgba(180, 100, 255, 1)';
    ctx.fillText('NULL', nullScreenX + nullSize + 4, nullScreenY + 4);
  }
  
  // Draw probe marker (crosshair style)
  const probeSize = 12;
  ctx.strokeStyle = 'rgba(0, 255, 255, 0.9)';
  ctx.lineWidth = 2;
  
  // Outer circle
  ctx.beginPath();
  ctx.arc(screenX, screenY, probeSize, 0, Math.PI * 2);
  ctx.stroke();
  
  // Inner crosshair
  ctx.beginPath();
  ctx.moveTo(screenX - probeSize - 5, screenY);
  ctx.lineTo(screenX - probeSize / 2, screenY);
  ctx.moveTo(screenX + probeSize / 2, screenY);
  ctx.lineTo(screenX + probeSize + 5, screenY);
  ctx.moveTo(screenX, screenY - probeSize - 5);
  ctx.lineTo(screenX, screenY - probeSize / 2);
  ctx.moveTo(screenX, screenY + probeSize / 2);
  ctx.lineTo(screenX, screenY + probeSize + 5);
  ctx.stroke();
  
  // Inner dot
  ctx.fillStyle = 'rgba(0, 255, 255, 1)';
  ctx.beginPath();
  ctx.arc(screenX, screenY, 3, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw transition line and queued waypoints if transitioning
  if (probe.isTransitioning || (probe.waypoints && probe.waypoints.length > 0)) {
    let lastX = screenX;
    let lastY = screenY;
    
    // Draw line to current target
    if (probe.isTransitioning) {
      const targetScreenX = (probe.targetX - camera.x) * zoomFactor + canvas.width / 2 * (1 - zoomFactor);
      const targetScreenY = (probe.targetY - camera.y) * zoomFactor + canvas.height / 2 * (1 - zoomFactor);
      
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.moveTo(screenX, screenY);
      ctx.lineTo(targetScreenX, targetScreenY);
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Draw target marker
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.arc(targetScreenX, targetScreenY, probeSize / 2, 0, Math.PI * 2);
      ctx.stroke();
      
      lastX = targetScreenX;
      lastY = targetScreenY;
    }
    
    // Draw queued waypoints
    if (probe.waypoints && probe.waypoints.length > 0) {
      probe.waypoints.forEach((waypoint, index) => {
        const wpScreenX = (waypoint.x - camera.x) * zoomFactor + canvas.width / 2 * (1 - zoomFactor);
        const wpScreenY = (waypoint.y - camera.y) * zoomFactor + canvas.height / 2 * (1 - zoomFactor);
        
        // Draw connecting line (more faded for later waypoints)
        const alpha = Math.max(0.2, 0.5 - index * 0.1);
        ctx.setLineDash([3, 6]);
        ctx.strokeStyle = `rgba(0, 200, 255, ${alpha})`;
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(wpScreenX, wpScreenY);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw waypoint marker (smaller circles with numbers)
        ctx.strokeStyle = `rgba(0, 200, 255, ${alpha + 0.2})`;
        ctx.fillStyle = `rgba(0, 50, 60, 0.7)`;
        ctx.beginPath();
        ctx.arc(wpScreenX, wpScreenY, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Draw waypoint number
        ctx.fillStyle = `rgba(0, 255, 255, ${alpha + 0.3})`;
        ctx.font = '10px Arial';
        ctx.fillText(`${index + 1}`, wpScreenX - 3, wpScreenY + 3);
        
        lastX = wpScreenX;
        lastY = wpScreenY;
      });
    }
  }
  
  // Calculate and draw gravity data if there are celestial bodies
  if (celestialBodies.length > 0) {
    const gravityData = calculateGravityAtPoint(probe.x, probe.y);
    drawProbeInfoPanel(gravityData, nullPoint);
    
    // Draw gravity vector arrow at probe position
    if (gravityData.accelerationMagnitude > 0.0001) {
      const arrowLength = Math.min(50, gravityData.accelerationMagnitude * 500);
      const endX = screenX + Math.cos(gravityData.accelerationAngle) * arrowLength;
      const endY = screenY + Math.sin(gravityData.accelerationAngle) * arrowLength;
      
      // Arrow shaft
      ctx.strokeStyle = 'rgba(255, 100, 50, 0.9)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(screenX, screenY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      
      // Arrow head
      const headSize = 8;
      const angle = gravityData.accelerationAngle;
      ctx.fillStyle = 'rgba(255, 100, 50, 0.9)';
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - headSize * Math.cos(angle - Math.PI / 6),
        endY - headSize * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        endX - headSize * Math.cos(angle + Math.PI / 6),
        endY - headSize * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fill();
    }
  } else {
    // Draw minimal info panel when no bodies exist
    drawProbeInfoPanel(null, null);
  }
}

/**
 * Draws the probe information panel
 * @param {Object|null} gravityData - Gravitational data at probe position
 * @param {Object|null} nullPoint - Nearest null point data
 */
function drawProbeInfoPanel(gravityData, nullPoint) {
  const padding = 15;
  const lineHeight = 18;
  const panelWidth = 250;
  const startX = canvas.width - panelWidth - padding;
  
  // Build info lines
  const infoLines = [
    `Position: (${probe.x.toFixed(1)}, ${probe.y.toFixed(1)})`
  ];
  
  if (gravityData) {
    infoLines.push(`Field Strength: ${gravityData.fieldStrength.toFixed(6)}`);
    infoLines.push(`Grav. Potential: ${gravityData.potential.toFixed(4)}`);
    infoLines.push(`Escape Velocity: ${(gravityData.escapeVelocity * (velocityUnit === 'm/s' ? 1000 : 1)).toFixed(2)} ${velocityUnit}`);
    
    if (gravityData.nearestBody) {
      infoLines.push(`Closest Source: ${gravityData.nearestBody.label}`);
      infoLines.push(`Distance: ${gravityData.nearestDistance.toFixed(2)}`);
      infoLines.push(`Orbital Vel: ${(gravityData.orbitalVelocity * (velocityUnit === 'm/s' ? 1000 : 1)).toFixed(2)} ${velocityUnit}`);
    }
    
    if (gravityData.dominantBody) {
      if (gravityData.dominantBody !== gravityData.nearestBody) {
        infoLines.push(`Dominant Source: ${gravityData.dominantBody.label}`);
      } else {
        infoLines.push(`Dominant Source: (same as closest)`);
      }
    }
    
    // Direction in degrees
    const directionDeg = (gravityData.accelerationAngle * 180 / Math.PI + 360) % 360;
    infoLines.push(`Pull Direction: ${directionDeg.toFixed(1)}°`);
  } else {
    infoLines.push('No bodies in simulation');
  }
  
  // Add null point info
  if (nullPoint) {
    infoLines.push('--- Null Point ---');
    infoLines.push(`Status: ${nullPoint.stability}`);
    infoLines.push(`Distance: ${nullPoint.distanceFromProbe.toFixed(1)}`);
    infoLines.push(`Field: ${nullPoint.fieldStrength.toExponential(2)}`);
  } else if (celestialBodies.length >= 2) {
    infoLines.push('--- Null Point ---');
    infoLines.push('Searching...');
  } else if (celestialBodies.length > 0) {
    infoLines.push('--- Null Point ---');
    infoLines.push('Need 2+ bodies');
  }
  
  if (probe.isTransitioning) {
    const waypointCount = probe.waypoints ? probe.waypoints.length : 0;
    if (waypointCount > 0) {
      infoLines.push(`Transitioning: ${(probe.transitionProgress * 100).toFixed(0)}% (+${waypointCount} queued)`);
    } else {
      infoLines.push(`Transitioning: ${(probe.transitionProgress * 100).toFixed(0)}%`);
    }
  }
  
  const panelHeight = (infoLines.length + 1.5) * lineHeight + padding * 2;
  const startY = canvas.height - panelHeight - padding;
  
  // Draw semi-transparent background
  ctx.fillStyle = 'rgba(0, 30, 40, 0.85)';
  ctx.fillRect(startX - padding, startY - padding, panelWidth, panelHeight);
  
  // Draw border
  ctx.strokeStyle = 'rgba(0, 255, 255, 0.7)';
  ctx.lineWidth = 2;
  ctx.strokeRect(startX - padding, startY - padding, panelWidth, panelHeight);
  
  // Draw title
  ctx.fillStyle = 'rgba(0, 255, 255, 1)';
  ctx.font = 'bold 15px Arial';
  ctx.fillText('Space Probe', startX, startY);
  
  // Draw info lines
  ctx.font = '13px Arial';
  
  infoLines.forEach((line, index) => {
    const y = startY + (index + 1.5) * lineHeight;
    
    // Color coding for different properties
    if (line.startsWith('Field Strength:') || line.startsWith('Field:')) {
      ctx.fillStyle = 'rgba(255, 150, 50, 1)';
    } else if (line.startsWith('Grav. Potential:')) {
      ctx.fillStyle = 'rgba(150, 100, 255, 1)';
    } else if (line.startsWith('Escape Velocity:') || line.startsWith('Orbital Vel:')) {
      ctx.fillStyle = 'rgba(0, 255, 200, 1)';
    } else if (line.startsWith('Closest Source:') || line.startsWith('Dominant Source:')) {
      ctx.fillStyle = 'rgba(255, 255, 100, 1)';
    } else if (line.startsWith('Pull Direction:')) {
      ctx.fillStyle = 'rgba(255, 100, 100, 1)';
    } else if (line.startsWith('Transitioning:')) {
      ctx.fillStyle = 'rgba(100, 200, 255, 1)';
    } else if (line.startsWith('---')) {
      ctx.fillStyle = 'rgba(180, 100, 255, 0.8)';
    } else if (line.startsWith('Status:')) {
      // Color based on null point stability
      if (line.includes('Strong')) {
        ctx.fillStyle = 'rgba(100, 255, 100, 1)';
      } else if (line.includes('Weak')) {
        ctx.fillStyle = 'rgba(200, 255, 100, 1)';
      } else if (line.includes('Near')) {
        ctx.fillStyle = 'rgba(255, 255, 100, 1)';
      } else {
        ctx.fillStyle = 'rgba(255, 180, 100, 1)';
      }
    } else if (line.startsWith('Distance:') && infoLines[index - 1]?.startsWith('Status:')) {
      ctx.fillStyle = 'rgba(180, 100, 255, 1)';
    } else if (line === 'Need 2+ bodies' || line === 'Searching...') {
      ctx.fillStyle = 'rgba(150, 150, 150, 1)';
    } else {
      ctx.fillStyle = 'rgba(200, 200, 200, 1)';
    }
    
    ctx.fillText(line, startX, y);
  });
}

/**
 * Draws detailed information panel for the currently followed body
 * @param {CelestialBody} body - The followed celestial body
 */
function drawFollowedBodyInfo(body) {
  if (!body) return;

  const padding = 15;
  const lineHeight = 20;
  const panelWidth = 220;
  const startX = canvas.width - panelWidth - padding;

  // Calculate gravitational force being exerted on the body
  const accelerationMagnitude = Math.sqrt(body.ax * body.ax + body.ay * body.ay);
  const gravitationalForce = body.weight * accelerationMagnitude;
  
  // Calculate panel height based on content
  const infoLines = [
    `Name: ${body.label}`,
    `Type: ${body.bodyType}`,
    `Mass: ${body.weight.toFixed(2)}`,
    `Radius: ${body.radius.toFixed(2)}`,
    `Density: ${body.density.toFixed(2)}`,
    `Position: (${body.x.toFixed(1)}, ${body.y.toFixed(1)})`,
    `Velocity: ${(Math.sqrt(body.dx * body.dx + body.dy * body.dy)*(velocityUnit === 'm/s' ? 1000 : 1)).toFixed(2)} ${velocityUnit === 'm/s' ? 'm/s' : 'km/s'}`,
    `Grav. Force: ${gravitationalForce.toFixed(3)} N`,
  ];

  const panelHeight = infoLines.length * lineHeight + padding * 2;
  
  // Position at bottom right corner
  const startY = canvas.height - panelHeight - padding;

  // Draw semi-transparent background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(startX - padding, startY - padding, panelWidth, panelHeight);

  // Draw border
  ctx.strokeStyle = body.trailColor || 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 2;
  ctx.strokeRect(startX - padding, startY - padding, panelWidth, panelHeight);

  // Draw title
  ctx.fillStyle = 'rgba(255, 255, 255, 1)';
  ctx.font = 'bold 16px Arial';
  ctx.fillText('Followed Body Info', startX, startY);

  // Draw direction circle with arrow
  const circleRadius = 15;
  const circleX = startX + panelWidth - circleRadius - 20;
  const circleY = startY + 5;
  
  // Calculate direction angle from velocity
  const velocityMagnitude = Math.sqrt(body.dx * body.dx + body.dy * body.dy);
  if (velocityMagnitude > 0.01) { // Only draw if there's significant movement
    const directionAngle = Math.atan2(body.dy, body.dx);
    
    // Draw circle background
    ctx.fillStyle = 'rgba(40, 40, 40, 0.8)';
    ctx.beginPath();
    ctx.arc(circleX, circleY, circleRadius, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw circle border
    ctx.strokeStyle = body.trailColor || 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Draw direction arrow
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 2;
    
    // Arrow body (line from center towards direction)
    const arrowLength = circleRadius * 0.6;
    const arrowEndX = circleX + Math.cos(directionAngle) * arrowLength;
    const arrowEndY = circleY + Math.sin(directionAngle) * arrowLength;
    
    ctx.beginPath();
    ctx.moveTo(circleX, circleY);
    ctx.lineTo(arrowEndX, arrowEndY);
    ctx.stroke();
    
    // Arrow head (triangle)
    const arrowHeadSize = 4;
    const leftAngle = directionAngle + Math.PI * 0.75;
    const rightAngle = directionAngle - Math.PI * 0.75;
    
    ctx.beginPath();
    ctx.moveTo(arrowEndX, arrowEndY);
    ctx.lineTo(arrowEndX + Math.cos(leftAngle) * arrowHeadSize, arrowEndY + Math.sin(leftAngle) * arrowHeadSize);
    ctx.lineTo(arrowEndX + Math.cos(rightAngle) * arrowHeadSize, arrowEndY + Math.sin(rightAngle) * arrowHeadSize);
    ctx.closePath();
    ctx.fill();
  }

  // Draw info lines
  ctx.font = '14px Arial';
  ctx.fillStyle = 'rgba(200, 200, 200, 1)';
  
  infoLines.forEach((line, index) => {
    const y = startY + (index + 1.5) * lineHeight;
    
    // Special coloring for certain properties
    if (line.startsWith('Velocity:')) {
      ctx.fillStyle = 'rgba(0, 255, 255, 1)';
    } else if (line.startsWith('Grav. Force:')) {
      ctx.fillStyle = 'rgba(255, 128, 0, 1)'; // Orange for gravitational force
    } else if (line.startsWith('Type:')) {
      ctx.fillStyle = body.textColor || 'rgba(200, 200, 200, 1)';
    } else {
      ctx.fillStyle = 'rgba(200, 200, 200, 1)';
    }
    
    ctx.fillText(line, startX, y);
  });
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
  showFPSIsON = showFPS.checked = false;
  showVelocitiesIsON = showVelocities.checked = true;
  showLabelsIsON = showLabels.checked = true;
  timeScaleInput.value = timeScale = 1;

  // Reset dev mode settings
  devModeIsON = false;
  document.querySelectorAll('.dev-item').forEach(item => {
    item.style.display = 'none';
  });
  devModeToggle.textContent = 'Enable Dev Mode (~)';
  showBHNodesIsON = showBHNodes.checked = false;
  showBHCenterOfMassIsON = showBHCenterOfMass.checked = false;
  showTrailPointsIsON = showTrailPoints.checked = false;
  
  // Reset probe mode
  probeModeEnabled = false;
  probe = null;

  // Reset gravity field visualization settings
  showGravityGridIsON = showGravityGrid.checked = false;
  showGravityVectorsIsON = showGravityVectors.checked = false;
  showGravityHeatmapIsON = showGravityHeatmap.checked = false;
  showGravityContoursIsON = showGravityContours.checked = false;
  gravityFieldSettings.gridOpacity = gravityGridOpacity.value = 1.0;
  gravityFieldSettings.heatmapOpacity = gravityHeatmapOpacity.value = 0.85;
  gravityFieldSettings.vectorOpacity = gravityVectorOpacity.value = 1.0;
  gravityFieldSettings.contourOpacity = gravityContourOpacity.value = 0.9;
  gravityFieldSettings.warpStrength = gravityWarpStrength.value = 1.0;
  gravityFieldRenderer.updateSettings(gravityFieldSettings);

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
  
  // Clear WebGL canvas
  webglRenderer.clear();
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
    text: "Press P to pin/unpin followed body, Space to pause",
    y: canvas.height - 50,
    vel: 140,
    time: 0.2
  });

  prompt({
    text: "Press 0 for Probe Mode - analyze any point in space",
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