import { CelestialBody } from "../classes/CelestialBodyClass.js";

/**
 * Function to smoothly follow a target position with the camera.
 * Using a smoothed speed value to avoid jerky camera movement.
 * @param {number} targetX The target x position to follow
 * @param {number} targetY The target y position to follow
 * @param {CelestialBody} targetBody The target body to follow
 */
function smoothFollow(targetX, targetY, targetBody) {
  const targetDX = -targetBody.dx;
  const targetDY = -targetBody.dy;
  const targetSpeed = Math.sqrt(targetDX * targetDX + targetDY * targetDY);

  // Smooth the target speed to avoid jerky camera movement
  const smoothFactor = 0.1; // Lower value for smoother (slower) transitions
  smoothedSpeed = smoothedSpeed * (1 - smoothFactor) + targetSpeed * smoothFactor;

  // Calculate distance between camera and target
  const distanceX = targetX - camera.x;
  const distanceY = targetY - camera.y;
  const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

  // Adjust speed based on both smoothed target speed and distance
  const speed = Math.min(distance * 0.01 + smoothedSpeed * 2, distance);

  const distanceThreshold = 0;
  const lockDistance = smoothedSpeed * 1.5;

  if (isCameraLockedOn || distance <= lockDistance) {
    // Follow exactly if locked or very close
    camera.x = targetX;
    camera.y = targetY;
    isCameraLockedOn = true;
  } else {
    // Smoothly move camera toward the target
    camera.x += distanceX * (speed / distance);
    camera.y += distanceY * (speed / distance);

    // Lock if within locking distance
    if (distance <= lockDistance) {
      isCameraLockedOn = true;
    }
  }

  // Unlock if the distance grows beyond a threshold
  if (distance > distanceThreshold) {
    isCameraLockedOn = false;
  }
}


/**
 * Update the camera position to follow the center of mass of all celestial bodies.
 * @returns {void}
 */
function updateCameraToFollowCenterOfMass() {
  if (celestialBodies.length === 0) return;

  let totalMass = 0;
  let centerX = 0;
  let centerY = 0;

  celestialBodies.forEach(body => {
    totalMass += body.weight;
    centerX += body.x * body.weight;
    centerY += body.y * body.weight;
  });

  centerX /= totalMass;
  centerY /= totalMass;

  // Set the target camera position
  targetCamera.x = centerX - canvas.width / 2;
  targetCamera.y = centerY - canvas.height / 2;

  // Smoothly move the camera towards the target
  camera.x += (targetCamera.x - camera.x) * cameraMoveSpeed;
  camera.y += (targetCamera.y - camera.y) * cameraMoveSpeed;
}

export { smoothFollow, updateCameraToFollowCenterOfMass };