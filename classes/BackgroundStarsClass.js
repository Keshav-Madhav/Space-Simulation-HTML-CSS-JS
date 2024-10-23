class BackgroundStar {
  constructor() {
    this.x = Math.random() * window.innerWidth;
    this.y = Math.random() * window.innerHeight;
    this.z = Math.random() * 5 + 1;
    this.opacity = Math.random() * 0.5;
    this.speed = Math.random() * 2 + 0.5;
  }

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

    starCtx.beginPath();
    starCtx.arc(adjustedX, adjustedY, this.z/3, 0, Math.PI * 2);
    starCtx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
    starCtx.fill();
    starCtx.closePath();
  }
}

export { BackgroundStar };