
// Trail manager for handling all celestial body trails
class TrailManager {
  /**
   * Creates a trail manager that handles trails for all bodies
   * @param {Object} params Configuration parameters
   * @param {CanvasRenderingContext2D} params.context canvas context to draw on
   */
  constructor({ context }) {
    this.context = context;
    
    /**
     * @type {Map<string, {points: {x: number, y: number}[], color: string}>} trails
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
        points: [],
        color: trailColor
      });
    }
  }

  /**
   * Updates the trail for a specific body
   * @param {string} bodyId Unique identifier for the body
   * @param {number} x Current x position
   * @param {number} y Current y position
   * @param {number} dx Current x velocity
   * @param {number} dy Current y velocity
   */
  updateTrail(bodyId, x, y, dx, dy) {
    const trail = this.trails.get(bodyId);
    if (!trail) return;

    // Only update if the body is moving
    if (dx !== 0 || dy !== 0) {
      trail.points.push({ x, y });
    }
  }

  /**
   * Draws all trails
   * @param {Object} camera Camera position
   */
  drawTrails(camera) {
    trailctx.clearRect(0, 0, canvas.width, canvas.height);  
    
    trailctx.save();
    trailctx.translate(canvas.width / 2, canvas.height / 2);
    trailctx.scale(zoomFactor, zoomFactor);
    trailctx.translate(-canvas.width / 2, -canvas.height / 2);

    if (!showTrailsIsON) return;

    this.trails.forEach(trail => {
      if (trail.points.length < 2) return;

      this.context.setLineDash([6, 2]);
      this.context.strokeStyle = trail.color;
      this.context.beginPath();

      trail.points.forEach((point, index) => {
        const cameraAdjustedX = point.x - camera.x;
        const cameraAdjustedY = point.y - camera.y;

        if (index === 0) {
          this.context.moveTo(cameraAdjustedX, cameraAdjustedY);
        } else {
          this.context.lineTo(cameraAdjustedX, cameraAdjustedY);
        }
      });

      this.context.stroke();
      this.context.setLineDash([]);
    });

    
    trailctx.restore();
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