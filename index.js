const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const celestialBodies = [];

class CelestialBody {
  constructor(radius, x, y, dx, dy, color) {
    this.radius = radius;
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.color = color;
    this.weight = radius * radius * Math.PI;
    this.elasticity = 0.8;
    this.trajectory = [];
    this.maxTrajectoryPoints = 10000;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x - camera.x, this.y - camera.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.closePath();
    this.drawTrajectory();
    this.updateTrajectory();
  }

  updateTrajectory() {
    this.trajectory.push({ x: this.x, y: this.y });

    if (this.trajectory.length > this.maxTrajectoryPoints) {
      this.trajectory.shift();
    }
  }

  drawTrajectory() {
    ctx.setLineDash([6, 2]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
  
    this.trajectory.forEach((point, index) => {
      // Subtract camera position from trajectory points
      const cameraAdjustedX = point.x - camera.x;
      const cameraAdjustedY = point.y - camera.y;
  
      if (index === 0) {
        ctx.moveTo(cameraAdjustedX, cameraAdjustedY);
      } else {
        ctx.lineTo(cameraAdjustedX, cameraAdjustedY);
      }
    });
  
    ctx.stroke();
    ctx.setLineDash([]);
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

let lastPressedKey = null;
let startDrag = null;
var endDrag = null;
let cameraFollowingIndex = 0;
let cameraFollow = true;

//resize canvas
window.addEventListener('resize', resizeCanvas);
function resizeCanvas() {
  canvas.width = window.innerWidth - 10;
  canvas.height = window.innerHeight - 5;
}
resizeCanvas();

document.addEventListener('keydown', function (event) {
  if (event.key === 'p' || event.key === 's') {
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
});

function startDragHandler(e) {
  e.preventDefault();
  startDrag = { x: e.clientX + camera.x, y: e.clientY + camera.y };
  canvas.addEventListener('mousemove', dragHandler);
  canvas.addEventListener('mouseup', endDragHandler);
}

function dragHandler(e) {
  e.preventDefault();
  drawTrajectory(startDrag.x, startDrag.y, e.clientX + camera.x, e.clientY + camera.y);
  endDrag = { x: e.clientX + camera.x, y: e.clientY + camera.y };
}


function drawTrajectory(startX, startY, endX, endY) {
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.stroke();
  ctx.setLineDash([]);
}

function endDragHandler(e) {
  e.preventDefault();
  if (startDrag) {
    if (endDrag === null) { // Check if endDrag is not set
      endDrag = { x: e.clientX, y: e.clientY };
    }
    
    const dx = endDrag.x - startDrag.x;
    const dy = endDrag.y - startDrag.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    console.log(distance);

    const launchVelocity = 0.05 * distance;
    const launchVelocityX = dx / distance * launchVelocity; // Corrected calculation
    const launchVelocityY = dy / distance * launchVelocity; // Corrected calculation

    if (lastPressedKey === 'p') {
      if(launchVelocity){
        celestialBodies.push(new CelestialBody(4, endDrag.x, endDrag.y, -launchVelocityX, -launchVelocityY, 'white'));
      }
      else{
        celestialBodies.push(new CelestialBody(4, endDrag.x, endDrag.y, 0, 0, 'white'));
      }
    } else if (lastPressedKey === 's') {
      if(launchVelocity){
        celestialBodies.push(new CelestialBody(50, endDrag.x, endDrag.y, -launchVelocityX, -launchVelocityY, 'orange'));
      }
      else{
        celestialBodies.push(new CelestialBody(50, endDrag.x, endDrag.y, 0, 0, 'orange'));
      }
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

const camera = {
  x: 0,
  y: 0
};

const keys = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false
};

window.addEventListener('keydown', function(e) {
  if (keys.hasOwnProperty(e.key)) {
    keys[e.key] = true;
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
    camera.x = followedBody.x - canvas.width / 2;
    camera.y = followedBody.y - canvas.height / 2;
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
}