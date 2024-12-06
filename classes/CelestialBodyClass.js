/**
 * Represents a celestial body in a space simulation with physical properties and rendering capabilities.
 * @class
 * @property {string} bodyType - The type of celestial body ('planet', 'star', 'blackHole')
 * @property {number} radius - The radius of the celestial body
 * @property {number} density - The density of the celestial body
 * @property {number} weight - The weight/mass of the celestial body
 * @property {number} x - Current x position
 * @property {number} y - Current y position
 * @property {number} dx - Velocity in x direction
 * @property {number} dy - Velocity in y direction
 * @property {number} ax - Acceleration in x direction
 * @property {number} ay - Acceleration in y direction
 * @property {string} color - RGB color string in rgba format
 * @property {string} trailColor - Color used for trajectory trail
 * @property {string} textColor - Color used for labels and text
 * @property {number} elasticity - Bounce elasticity coefficient
 * @property {string} label - Display label for the celestial body
 * @property {number} prevX - Previous x position
 * @property {number} prevY - Previous y position
 */
class CelestialBody {
  /**
   * Creates a new celestial body.
   * @param {Object} params - The celestial body parameters
   * @param {string} params.bodyType - Type of celestial body
   * @param {number} [params.radius] - Radius (calculated from weight if not provided)
   * @param {number} params.density - Density of the body
   * @param {number} [params.weight] - Weight (calculated from radius if not provided)
   * @param {number} params.x - Initial x position
   * @param {number} params.y - Initial y position
   * @param {number} params.dx - Initial velocity in x direction
   * @param {number} params.dy - Initial velocity in y direction
   * @param {Object} params.color - RGB color object
   * @param {number} params.color.r - Red component (0-255)
   * @param {number} params.color.g - Green component (0-255)
   * @param {number} params.color.b - Blue component (0-255)
   * @param {string} [params.label] - Display label
   * @param {string} [params.trailColor] - Color for trajectory trail
   * @param {string} [params.textColor] - Color for labels and text
   */
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
    this.textColor = textColor || `rgba(${color.r}, ${color.g}, ${color.b}, 0.9)`;
    this.elasticity = bodyType === 'planet' ? 0.8 : bodyType === 'star' ? 0.1 : bodyType === 'blackHole' ? 0.001 : 0.8;
    this.label = label;
    this.prevX = x;
    this.prevY = y;
    
    // Generate a unique ID for this body
    this.id = crypto.randomUUID();
  }

  /**
   * Draws the celestial body on the canvas.
   * Includes body, trajectory (if enabled), labels (if enabled), and velocity indicators (if enabled).
   */
  draw() {
    ctx.beginPath();
    ctx.arc(this.x - camera.x, this.y - camera.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    
    if (this.color === 'rgba(0, 0, 0, 1)') {
      ctx.strokeStyle = this.trailColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  
    ctx.closePath();
  
    if (showLabelsIsON) {
      ctx.fillStyle = this.textColor;
      const fontSize = zoomFactor > 0.5 ? 14 / zoomFactor : 14 * 0.6/ zoomFactor;
      ctx.font = `${fontSize}px Arial`;
      const textWidth = ctx.measureText(this.label).width;
      ctx.fillText(this.label, this.x - camera.x - textWidth / 2, this.y - camera.y + this.radius + (16/zoomFactor));
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
      const fontSize = zoomFactor > 0.5 ? 12 / zoomFactor : 12 * 0.6/ zoomFactor;
      ctx.font = `${fontSize}px Arial`;
      ctx.fillStyle = this.textColor;
      ctx.fillText(
        velocityUnit === 'm/s' ? velocityMPS : velocityKMPS,
        this.x - camera.x - velocityTextWidth / 2, 
        this.y - camera.y - this.radius - (6/zoomFactor)
      );
    }
  
    // Update previous position for the next frame
    this.prevX = this.x;
    this.prevY = this.y;
  }

  /**
   * Updates the celestial body's position and velocity based on gravitational forces.
   */
  update() {
    // Update position based on velocity
    this.x += this.dx;
    this.y += this.dy;

    // Update velocity based on acceleration
    this.dx += this.ax;
    this.dy += this.ay;
  }
}

export { CelestialBody };