// Trail manager for handling all celestial body trails
class TrailManager {
  /**
   * Creates a trail manager that handles trails for all bodies
   * @param {Object} params Configuration parameters
   * @param {CanvasRenderingContext2D} params.context canvas context to draw on
   */
  constructor({ context }) {
    this.context = context;
    
    // Constants for trail capacity
    this.MAX_POINTS = 200_000; // 1 million points per trail
    
    /**
     * @type {Map<string, {
     *   positions: Float32Array,
     *   head: number,      // Index where next point will be written
     *   isFull: boolean,   // Whether buffer has wrapped around
     *   color: string
     * }>} trails
     */
    this.trails = new Map();
  }

  /**
   * Initializes or gets a trail for a celestial body
   * @param {string} bodyId Unique identifier for the body
   * @param {string} trailColor Color of the trail
   */
  initializeTrail(bodyId, trailColor) {
    if (!this.trails.has(bodyId)) {
      this.trails.set(bodyId, {
        positions: new Float32Array(this.MAX_POINTS * 2), // x,y pairs
        head: 0,
        isFull: false,
        color: trailColor
      });
    }
  }

  /**
   * Updates the trail for a specific body using circular buffer
   * @param {string} bodyId Unique identifier for the body
   * @param {number} x Current x position
   * @param {number} y Current y position
   * @param {number} dx Current x velocity
   * @param {number} dy Current y velocity
   * @param {number} [threshold] Threshold for slight curves
   */
  updateTrail(bodyId, x, y, dx, dy, threshold = 0.2) {
    const trail = this.trails.get(bodyId);
    if (!trail) return;

    // Only update if the body is moving
    if (dx !== 0 || dy !== 0) {
      const positions = trail.positions;
      
      // Get previous point indices for curve checking
      let prevIdx = (trail.head - 2 + positions.length) % positions.length;
      let prevPrevIdx = (trail.head - 4 + positions.length) % positions.length;

      // Check if we have enough points to perform curve optimization
      if (trail.isFull || trail.head >= 4) {
        const p1x = positions[prevPrevIdx];
        const p1y = positions[prevPrevIdx + 1];
        const p2x = positions[prevIdx];
        const p2y = positions[prevIdx + 1];

        // Calculate the area of the triangle formed by the points
        const area = Math.abs((p2x - p1x) * (y - p1y) - (x - p1x) * (p2y - p1y));

        // If points form a near-straight line, overwrite the middle point
        if (area < threshold) {
          positions[prevIdx] = x;
          positions[prevIdx + 1] = y;
          return;
        }
      }

      // Add new point
      positions[trail.head] = x;
      positions[trail.head + 1] = y;
      
      // Update head position
      trail.head = (trail.head + 2) % positions.length;
      
      // Mark as full if we've wrapped around
      if (trail.head === 0) {
        trail.isFull = true;
      }
    }
  }

  /**
   * Draws all trails
   * @param {Object} camera Camera position
   */
  drawTrails(camera) {
    this.context.clearRect(0, 0, canvas.width, canvas.height);
    
    if (!showTrailsIsON) return;

    this.context.save();
    this.context.translate(canvas.width / 2, canvas.height / 2);
    this.context.scale(zoomFactor, zoomFactor);
    this.context.translate(-canvas.width / 2, -canvas.height / 2);

    // Set common line properties
    this.context.setLineDash([6, 2]);
    this.context.lineWidth = 1;

    this.trails.forEach(trail => {
      const positions = trail.positions;
      
      // Calculate number of points to draw
      const numPoints = trail.isFull ? positions.length : trail.head;
      if (numPoints < 4) return; // Need at least 2 points (4 values) to draw

      this.context.strokeStyle = trail.color;
      this.context.beginPath();

      // Start from oldest point if buffer is full
      let startIdx = trail.isFull ? trail.head : 0;
      
      // Move to first point
      this.context.moveTo(
        positions[startIdx] - camera.x,
        positions[startIdx + 1] - camera.y
      );

      // Draw the trail in chronological order
      for (let i = 2; i < numPoints; i += 2) {
        const idx = (startIdx + i) % positions.length;
        this.context.lineTo(
          positions[idx] - camera.x,
          positions[idx + 1] - camera.y
        );
      }

      this.context.stroke();
    });

    this.context.setLineDash([]);
    this.context.restore();
  }

  /**
   * Clears trail for a specific body
   * @param {string} bodyId Unique identifier for the body
   */
  clearTrail(bodyId) {
    this.trails.delete(bodyId);
  }

  /**
   * Clears all trails
   */
  clearAllTrails() {
    this.trails.clear();
  }
}

export { TrailManager };