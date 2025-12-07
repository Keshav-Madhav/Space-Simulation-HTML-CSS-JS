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
    this.trailColor = trailColor || `rgba(${color.r}, ${color.g}, ${color.b}, 0.65)`;
    this.textColor = textColor || `rgba(${color.r}, ${color.g}, ${color.b}, 0.9)`;
    this.elasticity = bodyType === 'planet' ? 0.8 : bodyType === 'star' ? 0.1 : bodyType === 'blackHole' ? 0.001 : 0.8;
    this.label = label;
    this.prevX = x;
    this.prevY = y;
    
    // Initialize acceleration components for physics system
    this.ax = 0;
    this.ay = 0;
    
    // Pinning functionality
    this.isPinned = false;
    this.pinnedX = null;
    this.pinnedY = null;
    
    // Generate a unique ID for this body
    this.id = crypto.randomUUID();

    // Cached Path2D for body circle; rebuilt if radius changes
    this._cachedRadius = null;
    this._circlePath = null;
    
    // Cached accretion disk gradients for black holes
    this._accretionDiskGradient = null;
    this._cachedAccretionRadius = null;
  }

  /**
   * Draws the accretion disk for black holes with 3D effect.
   * The disk is rendered in two parts - back and front - to create depth.
   */
  drawAccretionDisk() {
    if (this.bodyType !== 'blackHole') return;
    
    const diskRadius = this.radius * 4;
    const diskHeight = this.radius * 0.8;
    
    // Create or update cached gradient if radius changed
    if (this._cachedAccretionRadius !== this.radius || !this._accretionDiskGradient) {
      this._accretionDiskGradient = ctx.createRadialGradient(0, 0, this.radius * 1.2, 0, 0, diskRadius);
      this._accretionDiskGradient.addColorStop(0, 'rgba(255, 140, 0, 0)'); // Transparent center
      this._accretionDiskGradient.addColorStop(0.3, 'rgba(255, 140, 0, 0.8)'); // Orange glow
      this._accretionDiskGradient.addColorStop(0.6, 'rgba(255, 80, 0, 0.6)'); // Red-orange
      this._accretionDiskGradient.addColorStop(0.8, 'rgba(120, 40, 0, 0.4)'); // Dark red
      this._accretionDiskGradient.addColorStop(1, 'rgba(60, 20, 0, 0.1)'); // Very dark edge
      this._cachedAccretionRadius = this.radius;
    }
    
    ctx.save();
    
    // Draw back part of the disk (behind black hole) - bottom half
    ctx.scale(1, diskHeight / diskRadius); // Flatten to create oval
    ctx.fillStyle = this._accretionDiskGradient;
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.ellipse(0, 0, diskRadius, diskRadius, 0, 0, Math.PI); // Bottom semicircle
    ctx.fill();
    
    ctx.restore();
  }
  
  /**
   * Draws the front part of the accretion disk (in front of black hole).
   */
  drawAccretionDiskFront() {
    if (this.bodyType !== 'blackHole') return;
    
    const diskRadius = this.radius * 4;
    const diskHeight = this.radius * 0.8;
    
    ctx.save();
    
    // Draw front part of the disk (in front of black hole) - top half
    ctx.scale(1, diskHeight / diskRadius); // Flatten to create oval
    ctx.fillStyle = this._accretionDiskGradient;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.ellipse(0, 0, diskRadius, diskRadius, 0, Math.PI, Math.PI * 2); // Top semicircle
    ctx.fill();
    
    ctx.restore();
  }

  /**
   * Draws the celestial body text labels and UI elements on the 2D canvas.
   * The main body rendering is now handled by WebGL.
   * @param {boolean} isFollowed - Whether this body is currently being followed by the camera
   */
  drawLabels(isFollowed = false) {
    // Always show labels for followed body, otherwise check global setting
    if (showLabelsIsON || isFollowed) {
      ctx.fillStyle = isFollowed ? 'rgba(255, 255, 255, 1)' : this.textColor; // Bright white for followed body
      const fontSize = zoomFactor > 0.5 ? 14 / zoomFactor : 14 * 0.6/ zoomFactor;
      ctx.font = `${fontSize}px Arial`;
      const textWidth = ctx.measureText(this.label).width;
      ctx.fillText(this.label, this.x - camera.x - textWidth / 2, this.y - camera.y + this.radius + (16/zoomFactor));
    }
  
    // Always show velocities for followed body, otherwise check global setting
    if (showVelocitiesIsON || isFollowed) {
      // Calculate magnitude of velocity from dx and dy properties for a stable reading
      const velocityMagnitude = Math.sqrt(this.dx ** 2 + this.dy ** 2);
      const velocityKMPS = `${(velocityMagnitude).toFixed(2)}km/s`;
      const velocityMPS = `${(velocityMagnitude * 1000).toFixed(2)}m/s`;
    
      // Display the magnitude of velocity
      const velocityText = velocityUnit === 'm/s' ? velocityMPS : velocityKMPS;
      const velocityTextWidth = ctx.measureText(velocityText).width;
      const fontSize = zoomFactor > 0.5 ? 12 / zoomFactor : 12 * 0.6/ zoomFactor;
      ctx.font = `${fontSize}px Arial`;
      ctx.fillStyle = isFollowed ? 'rgba(0, 255, 255, 1)' : this.textColor; // Cyan for followed body velocity
      ctx.fillText(
        velocityText,
        this.x - camera.x - velocityTextWidth / 2, 
        this.y - camera.y - this.radius - (6/zoomFactor)
      );
    }
  
    // Update previous position for the next frame
    this.prevX = this.x;
    this.prevY = this.y;
  }

  /**
   * Legacy draw method for fallback to Canvas 2D rendering.
   * @deprecated Use WebGL rendering instead with drawLabels for UI elements.
   */
  draw() {
    // Check if this body is currently being followed
    const isFollowed = cameraFollow && cameraFollowingIndex !== -1 && 
                      celestialBodies[cameraFollowingIndex] === this;
    // Build path cache if needed (radius change or first draw)
    if (this._cachedRadius !== this.radius || !this._circlePath) {
      this._circlePath = new Path2D();
      this._circlePath.arc(0, 0, this.radius, 0, Math.PI * 2);
      this._cachedRadius = this.radius;
    }

    ctx.save();
    ctx.translate(this.x - camera.x, this.y - camera.y);
    
    // Draw back part of accretion disk for black holes (behind the body)
    this.drawAccretionDisk();
    
    // Add glow effect for followed body or stars
    if (isFollowed) {
      ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
      ctx.shadowBlur = 15 / zoomFactor;
    } else if (this.bodyType === 'star') {
      // Add much stronger glow to all stars
      ctx.shadowColor = this.color.replace('1)', '0.9)'); // Use star color with higher opacity
      ctx.shadowBlur = this.radius * 2.5 / zoomFactor; // Much larger glow radius
    }
    
    ctx.fillStyle = this.color;
    
    ctx.fill(this._circlePath);
    
    // Reset shadow for other elements
    if (isFollowed || this.bodyType === 'star') {
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
    }
    
    // Draw front part of accretion disk for black holes (in front of the body)
    this.drawAccretionDiskFront();
    
    if (this.color === 'rgba(0, 0, 0, 1)') {
      ctx.strokeStyle = this.trailColor;
      ctx.lineWidth = 2;
      ctx.stroke(this._circlePath);
    }
    
    // Draw pin indicator if body is pinned
    if (this.isPinned) {
      ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
      ctx.lineWidth = 3 / zoomFactor;
      ctx.stroke(this._circlePath);
      
      // Draw pin symbol (a small line with a circle at the top)
      const pinHeight = this.radius * 1.5;
      const pinRadius = this.radius * 0.3;
      
      ctx.strokeStyle = 'rgba(255, 255, 0, 1)';
      ctx.lineWidth = 2 / zoomFactor;
      ctx.beginPath();
      // Pin shaft
      ctx.moveTo(0, -this.radius - pinHeight);
      ctx.lineTo(0, -this.radius);
      ctx.stroke();
      
      // Pin head
      ctx.fillStyle = 'rgba(255, 255, 0, 1)';
      ctx.beginPath();
      ctx.arc(0, -this.radius - pinHeight, pinRadius, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  
    // Draw labels using the new method
    this.drawLabels(isFollowed);
  }

  pin() {
    this.isPinned = true;
    this.pinnedX = this.x;
    this.pinnedY = this.y;
    // Reset velocity when pinned
    this.dx = 0;
    this.dy = 0;
  }

  unpin() {
    this.isPinned = false;
    this.pinnedX = null;
    this.pinnedY = null;
  }

  togglePin() {
    if (this.isPinned) {
      this.unpin();
    } else {
      this.pin();
    }
  }

  /**
   * Updates the celestial body's position and velocity based on gravitational forces.
   * Uses Leapfrog integration for energy conservation and orbital stability.
   * @param {number} dt - Time step for integration (accounts for frame rate and time scaling)
   */
  update(dt = 1.0) {
    // If pinned, maintain position and reset velocities
    if (this.isPinned) {
      this.x = this.pinnedX;
      this.y = this.pinnedY;
      this.dx = 0;
      this.dy = 0;
      return;
    }

    // Leapfrog integration method for energy conservation
    // This method is symplectic and maintains orbital stability much better than Euler
    // Now properly scaled by delta time for frame rate independence
    
    // Update velocity first using current acceleration
    this.dx += this.ax * dt;
    this.dy += this.ay * dt;
    
    // Then update position using the new velocity
    this.x += this.dx * dt;
    this.y += this.dy * dt;
  }
}

export { CelestialBody };