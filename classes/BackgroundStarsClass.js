/**
 * Represents a background star in the space simulation with parallax scrolling effect.
 * @class
 * @property {number} x - The x coordinate of the star
 * @property {number} y - The y coordinate of the star
 * @property {number} z - The z-depth of the star (affects size and parallax movement)
 * @property {number} opacity - The opacity of the star (0-0.5)
 * @property {number} speed - The movement speed of the star
 */
class BackgroundStar {
  /**
   * Creates a new background star with random position, depth, opacity, and speed.
   * Star's initial position is randomly placed within the window dimensions.
   * @constructor
   */
  constructor() {
    this.x = Math.random() * window.innerWidth;
    this.y = Math.random() * window.innerHeight;
    this.z = Math.random() * 5 + 1;
    this.opacity = Math.random() * 0.5;
    this.speed = Math.random() * 2 + 0.5;
    this._cachedZ = null;
    this._starPath = null;
  }

  /**
   * Draws the star on the star canvas with parallax effect based on camera position.
   * Handles wrapping of stars when they move outside the viewport.
   * Star size is determined by its z-depth value.
   */
  draw() {
    let adjustedX = this.x - (camera.x / (this.z*8));
    let adjustedY = this.y - (camera.y / (this.z*8));

    if (adjustedX < 0) {
      adjustedX = window.innerWidth;
      this.x = adjustedX + (camera.x / (this.z*8));
    }
    if (adjustedX > window.innerWidth) {
      adjustedX = 0;
      this.x = adjustedX + (camera.x / (this.z*8));
    }
    if (adjustedY < 0) {
      adjustedY = window.innerHeight;
      this.y = adjustedY + (camera.y / (this.z*8));
    }
    if (adjustedY > window.innerHeight) {
      adjustedY = 0;
      this.y = adjustedY + (camera.y / (this.z*8));
    }

    // Build path cache if z (size) changed or not built
    if (this._cachedZ !== this.z) {
      this._starPath = new Path2D();
      this._starPath.arc(0, 0, this.z/3, 0, Math.PI * 2);
      this._cachedZ = this.z;
    }
    starCtx.save();
    starCtx.translate(adjustedX, adjustedY);
    starCtx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
    starCtx.fill(this._starPath);
    starCtx.restore();
  }
}

export { BackgroundStar };