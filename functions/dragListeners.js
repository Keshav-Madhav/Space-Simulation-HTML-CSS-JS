import { screenToWorldCoordinates, findClosestBody } from "./utils.js";
import { CelestialBody } from "../classes/CelestialBodyClass.js";
import { prompt } from "./showPrompts.js";
import { PhysicsSystem } from "../classes/PhysicsSystem.js";

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

function predictFullSystemTrajectory(ghostBody, existingBodies, totalTime = 1000) {
    const ghostTrajectory = [];
    // Use a map to store trajectories for the top 5 bodies, keyed by their IDs
    const closestBodiesTrajectories = new Map();

    // 1. Create simulation bodies
    const simBodies = existingBodies.map(body => new CelestialBody({ ...body }));
    const ghostSimBody = new CelestialBody({ ...ghostBody });
    simBodies.push(ghostSimBody);

    // 2. Find the top 5 closest bodies
    const topClosestBodies = [];
    if (existingBodies.length > 0) {
        const distances = simBodies
            .filter(body => body.id !== ghostSimBody.id)
            .map(body => ({
                body,
                distSq: (body.x - ghostSimBody.x) ** 2 + (body.y - ghostSimBody.y) ** 2
            }));
        
        distances.sort((a, b) => a.distSq - b.distSq);
        const closestFive = distances.slice(0, 5);

        closestFive.forEach(item => {
            topClosestBodies.push(item.body);
            closestBodiesTrajectories.set(item.body.id, []); // Initialize trajectory arrays
        });
    }

    // 3. Run the temporary simulation
    const tempPhysics = new PhysicsSystem();
    let simulatedTime = 0;
    
    while (simulatedTime < totalTime) {
        tempPhysics.update(simBodies, false);

        // Adaptive timestep logic
        let maxForce = 0;
        for (const body of simBodies) {
            const forceMagnitude = Math.sqrt(body.ax ** 2 + body.ay ** 2);
            if (forceMagnitude > maxForce) {
                maxForce = forceMagnitude;
            }
        }
        
        const timeStep = Math.max(0.1, Math.min(5, 1 / (maxForce + 1e-5)));

        // Update positions
        for (const body of simBodies) {
            body.dx += body.ax * timeStep;
            body.dy += body.ay * timeStep;
            body.x += body.dx * timeStep;
            body.y += body.dy * timeStep;
        }

        // 4. Record trajectories
        ghostTrajectory.push({ x: ghostSimBody.x, y: ghostSimBody.y });
        for (const body of topClosestBodies) {
            closestBodiesTrajectories.get(body.id).push({ x: body.x, y: body.y });
        }
        
        simulatedTime += timeStep;
    }

    return { ghostTrajectory, closestBodiesTrajectories };
}


function drawTrajectory(startX, startY, endX, endY) {
  // 1. Always draw the dotted launch indicator line
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

  // 2. Only run the full prediction if there are fewer than 10 bodies
  if (celestialBodies.length < 10) {
    // Calculate launch velocity
    const dx = endX - startX;
    const dy = endY - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const maxSpeed = 50;
    const launchSpeed = Math.min(0.05 * distance, maxSpeed);
    let launchVelocityX = (distance > 0) ? (dx / distance) * launchSpeed : 0;
    let launchVelocityY = (distance > 0) ? (dy / distance) * launchSpeed : 0;

    // Define the "ghost" body
    let bodyType = selectedBody.toLowerCase().replace(' ', '');
    if (bodyType === 'blackhole') bodyType = 'blackHole';
    const ghostBody = {
      bodyType,
      radius: celestialBodyValues[bodyType].radius,
      density: celestialBodyValues[bodyType].density,
      weight: 4 / 3 * Math.PI * Math.pow(celestialBodyValues[bodyType].radius, 3) * celestialBodyValues[bodyType].density,
      x: endX, y: endY, dx: -launchVelocityX, dy: -launchVelocityY, ax: 0, ay: 0,
      color: celestialBodyValues[bodyType].color, label: 'ghost'
    };
    
    // Run the prediction
    const { ghostTrajectory, closestBodiesTrajectories } = predictFullSystemTrajectory(ghostBody, celestialBodies);

    // Draw the ghost body's trajectory
    ctx.beginPath();
    ctx.moveTo(cameraAdjustedEndX, cameraAdjustedEndY);
    ghostTrajectory.forEach(point => {
        ctx.lineTo(point.x - camera.x, point.y - camera.y);
    });
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.stroke();

    // Draw trajectories for the 5 closest bodies with distinct colors
    const colors = [
        'rgba(100, 150, 255, 0.7)', // Blue
        'rgba(100, 255, 150, 0.7)', // Green
        'rgba(255, 150, 100, 0.7)', // Orange
        'rgba(200, 100, 255, 0.7)', // Purple
        'rgba(255, 255, 100, 0.7)'  // Yellow
    ];
    
    let colorIndex = 0;
    for (const trajectory of closestBodiesTrajectories.values()) {
        if (trajectory.length > 0) {
            ctx.beginPath();
            const firstPoint = trajectory[0];
            ctx.moveTo(firstPoint.x - camera.x, firstPoint.y - camera.y);
            trajectory.forEach(point => {
                ctx.lineTo(point.x - camera.x, point.y - camera.y);
            });
            ctx.strokeStyle = colors[colorIndex % colors.length];
            ctx.stroke();
            colorIndex++;
        }
    }
  }
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