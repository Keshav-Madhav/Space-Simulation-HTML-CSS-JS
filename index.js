const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const starCanvas = document.getElementById('canvas2');
const starCtx = starCanvas.getContext('2d');

const trailCanvas = document.getElementById('canvas3');
const trailctx = trailCanvas.getContext('2d');

let lastPressedKey = null;
let startDrag = null;
var endDrag = null;
let cameraFollowingIndex = 0;
let cameraFollow = false;
let collideIsON = true;

//resize canvas
window.addEventListener('resize', resizeCanvas);
function resizeCanvas() {
  canvas.width = window.innerWidth - 10;
  canvas.height = window.innerHeight - 5;
  starCanvas.width = window.innerWidth - 10;
  starCanvas.height = window.innerHeight - 5;
  trailCanvas.width = window.innerWidth - 10;
  trailCanvas.height = window.innerHeight - 5;
}
resizeCanvas();

const celestialBodies = [];

// Add a variable to store the target camera position
let targetCamera = { x: 0, y: 0 };

// Modify the camera movement speed (adjust as needed)
const cameraMoveSpeed = 1;

const camera = {
  x: 0,
  y: 0,
  prevX: 0,
  prevY: 0
};

const keys = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false
};

class CelestialBody {
  constructor(bodyType, radius, x, y, dx, dy, color, label, weight, trailColor, textColor) {
    this.bodyType = bodyType;
    this.radius = radius;
    this.x = x;
    this.y = y;
    this.dx = dx;
    // this.dx = 2997.92458 * 1;
    this.dy = dy;
    this.color = `rgba(${color.r}, ${color.g}, ${color.b}, 1)`;
    this.trailColor = trailColor || `rgba(${color.r}, ${color.g}, ${color.b}, 0.5)`;
    this.textColor = textColor || `rgba(${color.r}, ${color.g}, ${color.b}, 0.9)`
    this.weight = weight || radius * radius * Math.PI;
    this.elasticity = 0.6;
    this.trajectory = [];
    this.maxTrajectoryPoints = 3000;
    this.label = label;
    this.prevX = x;
    this.prevY = y;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x - camera.x, this.y - camera.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    
    // Draw a stroke around the black hole
    if (this.color === 'rgba(0, 0, 0, 1)') {
      ctx.strokeStyle = this.trailColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  
    ctx.closePath();
    this.drawTrajectory();
    this.updateTrajectory();
  
    ctx.fillStyle = this.textColor;
    ctx.font = `20px Arial`;
    const textWidth = ctx.measureText(this.label).width;
    ctx.fillText(this.label, this.x - camera.x - textWidth / 2, this.y - camera.y + this.radius + 22);
  
    // Calculate magnitude of velocity
    const displacementX = this.x - this.prevX;
    const displacementY = this.y - this.prevY;
    const velocityMagnitude = Math.sqrt(displacementX ** 2 + displacementY ** 2);
    const velocityText = `${(velocityMagnitude * 10).toFixed(2)}km/s`;
  
    // Display the magnitude of velocity
    const velocityTextWidth = ctx.measureText(velocityText).width;
    ctx.font = `14px Arial`;
    ctx.fillStyle = this.textColor;
    ctx.fillText(velocityText, this.x - camera.x - velocityTextWidth / 2, this.y - camera.y - this.radius - 10);
  
    // Update previous position for the next frame
    this.prevX = this.x;
    this.prevY = this.y;
  }
  

  updateTrajectory() {
    this.trajectory.push({ x: this.x, y: this.y });
  }

  drawTrajectory() {
    if (this.dx !== 0 || this.dy !== 0) {
      trailctx.setLineDash([6, 2]);
      trailctx.strokeStyle = this.trailColor;
      trailctx.beginPath();

      this.trajectory.forEach((point, index) => {
        const cameraAdjustedX = point.x - camera.x;
        const cameraAdjustedY = point.y - camera.y;

        if (index === 0) {
          trailctx.moveTo(cameraAdjustedX, cameraAdjustedY);
        } else {
          trailctx.lineTo(cameraAdjustedX, cameraAdjustedY);
        }
      });

      trailctx.stroke();
      trailctx.setLineDash([]);
    }
  }

  update() {
    // Update position based on velocity
    this.x += this.dx;
    this.y += this.dy;

    // Update velocity based on gravitational forces
    this.updateGravity(celestialBodies);

    // Update velocity based on acceleration
    this.dx += this.ax;
    this.dy += this.ay;
  }

  calculateGravitationalForce(otherBody) {
    const G = 0.1; // Gravitational constant (you can adjust this value)
    
    const dx = otherBody.x - this.x;
    const dy = otherBody.y - this.y;
    const distanceSquared = dx * dx + dy * dy;
    const distance = Math.sqrt(distanceSquared);

    // Avoid division by zero and very close interactions
    if (distance < 1) return { fx: 0, fy: 0 };

    const force = (G * this.weight * otherBody.weight) / distanceSquared;

    // Calculate acceleration components
    const accelerationX = force * (dx / distance) / this.weight;
    const accelerationY = force * (dy / distance) / this.weight;

    return { ax: accelerationX, ay: accelerationY };
  }

  updateGravity(celestialBodies) {
    // Reset acceleration
    this.ax = 0;
    this.ay = 0;

    // Calculate gravitational forces from other celestial bodies
    celestialBodies.forEach((body) => {
      if (body !== this) {
        const { ax, ay } = this.calculateGravitationalForce(body);
        this.ax += ax;
        this.ay += ay;
      }
    });
  }
}

class BackgroundStar {
  constructor() {
    this.x = Math.random() * window.innerWidth;
    this.y = Math.random() * window.innerHeight;
    this.z = Math.random() * 10 + 1;
    this.opacity = Math.random() * 0.5;
    this.speed = Math.random() * 2 + 0.5;
  }

  draw() {
    let adjustedX = this.x - (camera.x / (this.z*4));
    let adjustedY = this.y - (camera.y / (this.z*4));

    if (adjustedX < 0) {
      adjustedX = window.innerWidth;
      this.x = adjustedX + (camera.x / (this.z*4));
    }
    if (adjustedX > window.innerWidth) {
      adjustedX = 0;
      this.x = adjustedX + (camera.x / (this.z*4));
    }
    if (adjustedY < 0) {
      adjustedY = window.innerHeight;
      this.y = adjustedY + (camera.y / (this.z*4));
    }
    if (adjustedY > window.innerHeight) {
      adjustedY = 0;
      this.y = adjustedY + (camera.y / (this.z*4));
    }

    starCtx.beginPath();
    starCtx.arc(adjustedX, adjustedY, this.z/3, 0, Math.PI * 2);
    starCtx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
    starCtx.fill();
    starCtx.closePath();
  }
}

const backgroundStars = [];

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
    celestialBodies.length = 0; // Clear the array
    console.log('All celestial bodies removed.');
  }

  if (event.key === 'k') {
    spawnPlanetsNearMouse(15);
  }

  if(event.key === 'x'){
    collideIsON = !collideIsON;
  }
});

function startDragHandler(e) {
  e.preventDefault();
  startDrag = { x: e.clientX + camera.x, y: e.clientY + camera.y };
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
  drawTrajectory(startDrag.x, startDrag.y, e.clientX + camera.x, e.clientY + camera.y);
  endDrag = { x: e.clientX + camera.x, y: e.clientY + camera.y };
}


function endDragHandler(e) {
  e.preventDefault();
  if (startDrag) {
    endDrag = { x: e.clientX + camera.x, y: e.clientY + camera.y };

    const dx = endDrag.x - startDrag.x;
    const dy = endDrag.y - startDrag.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const maxSpeed = 50;
    const launchSpeed = Math.min(0.05 * distance, maxSpeed);

    let launchVelocityX = 0;
    let launchVelocityY = 0;

    if (launchSpeed > 0 ){
      launchVelocityX = (dx / distance) * launchSpeed;
      launchVelocityY = (dy / distance) * launchSpeed;
    }

    if (lastPressedKey === 'p') {
      celestialBodies.push(
        new CelestialBody(
          'planet',
          8,
          endDrag.x,
          endDrag.y,
          -launchVelocityX,
          -launchVelocityY,
          { r: 255, g: 255, b: 255 },
          'Planet ' + (celestialBodies.length + 1)
        )
      );
    } else if (lastPressedKey === 's') {
      celestialBodies.push(
        new CelestialBody(
          'star',
          70,
          endDrag.x,
          endDrag.y,
          -launchVelocityX,
          -launchVelocityY,
          { r: 255, g: 165, b: 0 },
          'Star ' + (celestialBodies.length + 1)
        )
      );
    }else if (lastPressedKey === 'b') {
      celestialBodies.push(
        new CelestialBody(
          'blackHole',
          60,
          endDrag.x,
          endDrag.y,
          -launchVelocityX,
          -launchVelocityY,
          { r: 0, g: 0, b: 0 },
          'Black Hole ' + (celestialBodies.length + 1),
          1000000,
          'rgba(100, 100, 100, 0.5)',
          'rgba(255, 255, 255, 0.9)'
        )
      );
    }

    console.log(celestialBodies);

    startDrag = null;
    endDrag = null;

    canvas.removeEventListener('mousemove', dragHandler);
    canvas.removeEventListener('mouseup', endDragHandler);
    canvas.removeEventListener('mousedown', startDragHandler);
    lastPressedKey = null;
  }
}

window.addEventListener('keydown', function(e) {
  if (keys.hasOwnProperty(e.key)) {
    keys[e.key] = true;
  }
  if (e.key === ' '){
    camera.x = 0;
    camera.y = 0;
  }
}); 

window.addEventListener('keyup', function(e) {
  if (keys.hasOwnProperty(e.key)) {
    keys[e.key] = false;
  }
});

function draw() {
  ctx.fillStyle = 'black';
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const speed = 5; // adjust as needed
  if (keys.ArrowUp) camera.y -= speed;
  if (keys.ArrowDown) camera.y += speed;
  if (keys.ArrowLeft) camera.x -= speed;
  if (keys.ArrowRight) camera.x += speed;

  if (celestialBodies.length > 0 && cameraFollowingIndex < celestialBodies.length && cameraFollow) {
    const followedBody = celestialBodies[cameraFollowingIndex];

    // Set the target camera position
    targetCamera.x = followedBody.x - canvas.width / 2;
    targetCamera.y = followedBody.y - canvas.height / 2;

    // Smoothly move the camera towards the target
    camera.x += (targetCamera.x - camera.x) * cameraMoveSpeed;
    camera.y += (targetCamera.y - camera.y) * cameraMoveSpeed;
  }

  if (camera.prevX !== camera.x || camera.prevY !== camera.y) {
    starCtx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackgroundStars();
  }
  
  trailctx.clearRect(0, 0, canvas.width, canvas.height);  

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

  // Update last camera position
  camera.prevX = camera.x;
  camera.prevY = camera.y;

  drawFPS(ctx);

  requestAnimationFrame(draw);
}

draw();

function bodyCollide(body1, body2) {
  // Calculate the distance between the bodys
  var dx = body1.x - body2.x;
  var dy = body1.y - body2.y;
  var distance = Math.sqrt(dx * dx + dy * dy);

  // Calculate the angle of the collision
  var angle = Math.atan2(dy, dx);

  // Calculate the components of the velocity of each body
  var velocity1 = Math.sqrt(body1.dx * body1.dx + body1.dy * body1.dy);
  var velocity2 = Math.sqrt(body2.dx * body2.dx + body2.dy * body2.dy);

  // Calculate the direction of each body
  var direction1 = Math.atan2(body1.dy, body1.dx);
  var direction2 = Math.atan2(body2.dy, body2.dx);

  // Calculate the new velocity of each body
  var velocity1x = velocity1 * Math.cos(direction1 - angle);
  var velocity1y = velocity1 * Math.sin(direction1 - angle);
  var velocity2x = velocity2 * Math.cos(direction2 - angle);
  var velocity2y = velocity2 * Math.sin(direction2 - angle);

  // The final velocities after collision are calculated considering the mass and elasticity
  var finalVelocity1x = ((body1.weight - body2.weight) * velocity1x + 2 * body2.weight * velocity2x) / (body1.weight + body2.weight) * body1.elasticity;
  var finalVelocity2x = ((body2.weight - body1.weight) * velocity2x + 2 * body1.weight * velocity1x) / (body1.weight + body2.weight) * body2.elasticity;

  // Convert velocities back to vectors
  body1.dx = Math.cos(angle) * finalVelocity1x + Math.cos(angle + Math.PI/2) * velocity1y;
  body1.dy = Math.sin(angle) * finalVelocity1x + Math.sin(angle + Math.PI/2) * velocity1y;
  body2.dx = Math.cos(angle) * finalVelocity2x + Math.cos(angle + Math.PI/2) * velocity2y;
  body2.dy = Math.sin(angle) * finalVelocity2x + Math.sin(angle + Math.PI/2) * velocity2y;

  if (distance < body1.radius + body2.radius) {
      var overlap = body1.radius + body2.radius - distance;
      var angle = Math.atan2(body2.y - body1.y, body2.x - body1.x);
      body1.x -= overlap * Math.cos(angle) / 2;
      body1.y -= overlap * Math.sin(angle) / 2;
      body2.x += overlap * Math.cos(angle) / 2;
      body2.y += overlap * Math.sin(angle) / 2;
  } else {
      // If bodys are not overlapping, they should not be moving towards each other
      var relativeVelocityX = body2.dx - body1.dx;
      var relativeVelocityY = body2.dy - body1.dy;
      var relativeVelocityDotProduct = dx * relativeVelocityX + dy * relativeVelocityY;
      if (relativeVelocityDotProduct > 0) {
          return;  // Balls are moving apart, not colliding
      }
  }

  massTransfer(body1, body2);
}

function massTransfer(body1, body2) {
  if (body1.bodyType === 'blackHole' || body2.bodyType === 'blackHole') {
    // Case: Black hole collides with another body (including another black hole)
    // Remove the other body from the array and add its mass to the black hole

    const nonBlackHole = body1.bodyType === 'blackHole' ? body2 : body1;
    celestialBodies.splice(celestialBodies.indexOf(nonBlackHole), 1);
    const blackHole = body1.bodyType === 'blackHole' ? body1 : body2;
    blackHole.weight += nonBlackHole.weight;
    blackHole.radius += Math.sqrt(nonBlackHole.weight / Math.PI) /10;
    blackHole.dx /= 100;
    blackHole.dy /= 100;
  } 
  
  else if ((body1.bodyType === 'star' && body2.bodyType === 'planet') ||
            (body1.bodyType === 'planet' && body2.bodyType === 'star')) {
    // Case: Star and planet collide
    // Remove the planet and add its mass to the star
    
    const star = body1.bodyType === 'star' ? body1 : body2;
    const planet = body1.bodyType === 'planet' ? body1 : body2;
    celestialBodies.splice(celestialBodies.indexOf(planet), 1);
    star.weight += planet.weight;
    star.radius = Math.sqrt(star.weight / Math.PI);
  } 
  
  else if (body1.bodyType === 'star' && body2.bodyType === 'star') {
    // Case: Star collides with star
    // There is a very small chance of becoming a black hole, otherwise, one gains mass and the other is removed

    const chanceOfBlackHole = 0.05;
    if (Math.random() < chanceOfBlackHole) {
      celestialBodies.splice(celestialBodies.indexOf(body1), 1);
      celestialBodies.splice(celestialBodies.indexOf(body2), 1);
      celestialBodies.push(
        new CelestialBody(
          'blackHole',
          60,
          (body1.x + body2.x) / 2,
          (body1.y + body2.y) / 2,
          (body1.dx + body2.dx) / 2,
          (body1.dy + body2.dy) / 2,
          { r: 0, g: 0, b: 0 },
          'Black Hole ' + (celestialBodies.length + 1),
          (body1.weight + body2.weight)*2,
          'rgba(100, 100, 100, 0.5)',
          'rgba(255, 255, 255, 0.9)'
        )
      );
    } 
    
    else {
      const survivor = body1.weight >= body2.weight ? body1 : body2;
      const removed = body1.weight < body2.weight ? body1 : body2;
      if(removed.weight > survivor.weight/10) {
        survivor.weight += removed.weight/2;
        survivor.radius = Math.sqrt(survivor.weight / Math.PI);
        removed.weight = removed.weight/2;
        removed.radius = Math.sqrt(removed.weight / Math.PI);
      }
      else {
        survivor.weight += removed.weight;
        survivor.radius = Math.sqrt(survivor.weight / Math.PI);
        celestialBodies.splice(celestialBodies.indexOf(removed), 1);
      }
    }
  } 
  
  else if (body1.bodyType === 'planet' && body2.bodyType === 'planet') {
    // Case: Planet collides with a planet
    // Remove one planet and add its mass to the other

    const survivor = body1.weight >= body2.weight ? body1 : body2;
    const removed = body1.weight < body2.weight ? body1 : body2;
    if (removed.weight > survivor.weight / 10) {
      survivor.weight += removed.weight / 2;
      survivor.radius = Math.sqrt(survivor.weight / Math.PI);
      removed.weight = removed.weight / 2;
      removed.radius = Math.sqrt(removed.weight / Math.PI);
    }
    else {
      survivor.weight += removed.weight;
      survivor.radius = Math.sqrt(survivor.weight / Math.PI);
      celestialBodies.splice(celestialBodies.indexOf(removed), 1);
    }
  }
}

function spawnPlanetsNearMouse(numPlanets) {
  const mousePosition = { x: camera.x + canvas.width / 2, y: camera.y + canvas.height / 2 };

  for (let i = 0; i < numPlanets; i++) {
    const randomXOffset = Math.random() * 400 ; // Adjust the range as needed
    const randomYOffset = Math.random() * 400 ; // Adjust the range as needed

    const newPlanet = new CelestialBody(
      'planet',
      8,
      mousePosition.x + randomXOffset,
      mousePosition.y + randomYOffset,
      Math.random() * 2 - 1, // Random velocity in x direction
      Math.random() * 2 - 1, // Random velocity in y direction
      { r: 255, g: 255, b: 255 },
      'Planet ' + (celestialBodies.length + 1)
    );

    celestialBodies.push(newPlanet);
  }
}
