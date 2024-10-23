// Class to represent a celestial body
class CelestialBody {
  constructor(
    {
      bodyType,
      radius,
      density,
      weight,
      x,
      y,
      dx,
      dy,
      color,
      label,
      trailColor,
      textColor
    }
  ) {
    this.bodyType = bodyType;
    this.radius = radius || (weight ? Math.cbrt(weight / (4 / 3 * Math.PI * density)) : 4);
    this.density = density;
    this.weight = weight || 4 / 3 * Math.PI * radius * radius * radius * density;
    this.x = x;
    this.y = y;
    this.dx = dx;
    // this.dx = 2997.92458 * 1;
    this.dy = dy;
    this.color = `rgba(${color.r}, ${color.g}, ${color.b}, 1)`;
    this.trailColor = trailColor || `rgba(${color.r}, ${color.g}, ${color.b}, 0.5)`;
    this.textColor = textColor || `rgba(${color.r}, ${color.g}, ${color.b}, 0.9)`
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
    if(showTrailsIsON) {
      this.drawTrajectory();
      this.updateTrajectory();
    }
  
    if (showLabelsIsON) {
      ctx.fillStyle = this.textColor;
      ctx.font = `14px Arial`;
      const textWidth = ctx.measureText(this.label).width;
      ctx.fillText(this.label, this.x - camera.x - textWidth / 2, this.y - camera.y + this.radius + 16);
    }
  
    if (showVelocitiesIsON) {
      // Calculate magnitude of velocity
      const displacementX = this.x - this.prevX;
      const displacementY = this.y - this.prevY;
      const velocityMagnitude = Math.sqrt(displacementX ** 2 + displacementY ** 2);
      const velocityKMPS = `${(velocityMagnitude).toFixed(2)}km/s`;
      const velocityMPS = `${(velocityMagnitude * 1000).toFixed(2)}m/s`;
    
      // Display the magnitude of velocity
      const velocityTextWidth = ctx.measureText(velocityUnit === 'm/s' ? velocityMPS : velocityKMPS).width;
      ctx.font = `12px Arial`;
      ctx.fillStyle = this.textColor;
      ctx.fillText(
        velocityUnit === 'm/s' ? velocityMPS : velocityKMPS,
        this.x - camera.x - velocityTextWidth / 2, 
        this.y - camera.y - this.radius - 6
      );
    }
  
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

export { CelestialBody };