// Trail manager for handling all celestial body trails
import { screenToWorldCoordinates, worldToScreenCoordinates } from "../functions/utils.js";

// Trail manager for handling all celestial body trails with view culling & Path2D batching
class TrailManager {
  /**
   * Creates a trail manager that handles trails for all bodies
   * @param {Object} params Configuration parameters
   * @param {CanvasRenderingContext2D} params.context canvas context to draw on
   */
  constructor({ context }) {
    this.context = context;
    
    // Constants for trail capacity
    this.MAX_POINTS = 500_000; // 500,000 points per trail
    
    /**
     * @type {Map<string, {
     * positions: Float32Array,
     * head: number,      // Index where next point will be written
     * isFull: boolean,   // Whether buffer has wrapped around
     * color: string
     * }>} trails
     */
  this.trails = new Map();

  // Track previous head positions for change detection (bodyId -> lastHeadIndex)
  this._lastHeads = new Map();

    // Throttling state
    this._lastRenderTime = 0; // ms timestamp of last trail draw
    this._baseRenderInterval = 100; // default 10Hz
    this._renderInterval = this._baseRenderInterval;
    this._lastCameraX = null;
    this._lastCameraY = null;

    // Adaptive decimation configuration
    this._minPixelSeg = 2;      // Minimum on-screen pixel distance between rendered trail vertices
    this._maxDecimation = 8;    // Hard cap on skipping factor
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
        color: trailColor,
        lastDrawnHead: -1 // for point-change detection
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
   */
  updateTrail(bodyId, x, y, dx, dy) {
    const trail = this.trails.get(bodyId);
    if (!trail) return;

    const positions = trail.positions;
    
    // Calculate speed and set dynamic threshold
    const speed = Math.sqrt(dx * dx + dy * dy);
    const threshold = Math.min(speed * 0.1, 1); // Adjust multiplier for desired sensitivity

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

  /**
   * Draws all trails
   * @param {Object} camera Camera position
   */
  drawTrails(camera) {
    if (!showTrailsIsON) return;

    // Decide dynamic render interval based on zoom & body/trail count
    const bodyCount = celestialBodies.length || 1;
    // More bodies or high zoom => lower interval (more frequent updates)
    const zoomWeight = Math.min(zoomFactor, 2); // clamp influence
    const densityFactor = Math.min(bodyCount / 200, 1); // saturate at 200 bodies
    // Interpolate between 30ms (≈33fps) and base interval * 2 depending on zoom & density
    const fastBound = 30;
    const slowBound = this._baseRenderInterval * 2; // allow slower than base if far out & sparse
    // When zoomed in & dense -> fastBound, else approach slowBound
    const blend = 1 - ((zoomWeight / 2) * 0.6 + densityFactor * 0.4); // 0..1
    this._renderInterval = fastBound + (slowBound - fastBound) * Math.min(Math.max(blend, 0), 1);

    const now = performance.now();
    const cameraMoved = this._lastCameraX !== camera.x || this._lastCameraY !== camera.y;

    // Determine if any trail had new points since last draw (point change detection)
    let trailsChanged = false;
    this.trails.forEach((trail, id) => {
      const last = this._lastHeads.get(id);
      if (last !== trail.head) {
        trailsChanged = true;
      }
    });

    this._lastRenderTime = now;
    this._lastCameraX = camera.x;
    this._lastCameraY = camera.y;

    // Prepare world-space visible rectangle with margin
    const topLeftWorld = screenToWorldCoordinates(0, 0);
    const bottomRightWorld = screenToWorldCoordinates(canvas.width, canvas.height);
    const margin = 120 / zoomFactor;
    const visMinX = topLeftWorld.x - margin;
    const visMinY = topLeftWorld.y - margin;
    const visMaxX = bottomRightWorld.x + margin;
    const visMaxY = bottomRightWorld.y + margin;

    this.context.clearRect(0, 0, canvas.width, canvas.height);
    this.context.save();
    this.context.setLineDash([6, 2]);
    this.context.lineWidth = 1;

    // Adaptive decimation: compute skip factor so that successive vertices are at least _minPixelSeg apart
    const decimationBase = Math.max(1, Math.round(1 / Math.max(zoomFactor, 0.0001))); // more skip when zoomed out

    this.trails.forEach((trail, id) => {
      const positions = trail.positions;
      const total = trail.isFull ? positions.length : trail.head;
      if (total < 4) { this._lastHeads.set(id, trail.head); return; }
      const startIdx = trail.isFull ? trail.head : 0;

      const path = new Path2D();
      let drawing = false;
      let lastScreenX = 0, lastScreenY = 0;
      let skipAccumulator = 0;
      let lastPlottedSX = null, lastPlottedSY = null;

      // Dynamic decimation factor refined by on-screen segment length
      const maxSkip = this._maxDecimation;
      const decimation = Math.min(decimationBase, maxSkip);

      for (let i = 0; i < total; i += 2) {
        // Apply coarse decimation first
        if (decimation > 1 && ((i/2) % decimation) !== 0) continue;
        const idx = (startIdx + i) % positions.length;
        const wx = positions[idx];
        const wy = positions[idx + 1];
        const inView = wx >= visMinX && wx <= visMaxX && wy >= visMinY && wy <= visMaxY;
        if (!inView) { drawing = false; continue; }
        const { x: sx, y: sy } = worldToScreenCoordinates(wx, wy);
        if (lastPlottedSX !== null) {
          const dx = sx - lastPlottedSX;
          const dy = sy - lastPlottedSY;
          const distSq = dx*dx + dy*dy;
          if (distSq < this._minPixelSeg * this._minPixelSeg) {
            // Too close on screen; skip to avoid oversampling
            continue;
          }
        }
        if (!drawing) { path.moveTo(sx, sy); drawing = true; }
        else { path.lineTo(sx, sy); }
        lastPlottedSX = sx; lastPlottedSY = sy;
        lastScreenX = sx; lastScreenY = sy;
      }

      this.context.strokeStyle = trail.color;
      this.context.stroke(path);
      this._lastHeads.set(id, trail.head);

      if (showDebugPoints) {
        this.context.fillStyle = trail.color;
        for (let i = 0; i < total; i += 4) {
          const idx = (startIdx + i) % positions.length;
          const wx = positions[idx];
          const wy = positions[idx + 1];
          if (wx < visMinX || wx > visMaxX || wy < visMinY || wy > visMaxY) continue;
          const { x: sx, y: sy } = worldToScreenCoordinates(wx, wy);
          this.context.beginPath();
          this.context.arc(sx, sy, 2, 0, Math.PI * 2);
          this.context.fill();
        }
      }
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