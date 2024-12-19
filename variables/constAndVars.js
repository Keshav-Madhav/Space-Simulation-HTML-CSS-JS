let startDrag = null;
var endDrag = null;
let cameraFollowingIndex = 0;
let cameraFollow = false;
let collideIsON = true;
let camSpeed = 5; 
let showTrailsIsON = true;
let showStarsIsON = true;
let showVelocitiesIsON = true;
let showLabelsIsON = true;
let showFPSIsON = false;
let showDebugPoints = false;
let velocityUnit = 'm/s';
let zoomFactor = 0.85;
let zoomSpeed = 0.1;
let isCameraLockedOn = false;
let smoothedSpeed = 0;
let selectedBody = '';
let isPaused = false;

const cameraMoveSpeed = 1;

/** @type {BackgroundStar[]} */
const backgroundStars = [];

/** @type {CelestialBody[]} */
const celestialBodies = [];

/** 
 * @typedef {Object} Camera
 * @property {number} x - Current x position of the camera
 * @property {number} y - Current y position of the camera
 * @property {number} prevX - Previous x position of the camera
 * @property {number} prevY - Previous y position of the camera
 * @property {number} lastMouseX - Last recorded x position of the mouse
 * @property {number} lastMouseY - Last recorded y position of the mouse
 */
const camera = {
  x: 0,
  y: 0,
  prevX: 0,
  prevY: 0,
  lastMouseX: 0,
  lastMouseY: 0
};

/** 
 * @typedef {Object} TargetCamera
 * @property {number} x - Target x position for camera movement
 * @property {number} y - Target y position for camera movement
 */
let targetCamera = { x: 0, y: 0 };

/**
 * @typedef {Object} KeyState
 * @property {boolean} ArrowUp - State of the up arrow key
 * @property {boolean} ArrowDown - State of the down arrow key
 * @property {boolean} ArrowLeft - State of the left arrow key
 * @property {boolean} ArrowRight - State of the right arrow key
*/
const keys = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false
};

/**
 * @typedef {Object} CelestialBodyType
 * @property {number} radius - Default radius for this type
 * @property {number} density - Default density for this type
 * @property {Object} color - Default color for this type
 * @property {number} color.r - Red component (0-255)
 * @property {number} color.g - Green component (0-255)
 * @property {number} color.b - Blue component (0-255)
 */
const celestialBodyValues = {
  planet: {
    radius: 4,
    density: 1.5,
    color: { r: 255, g: 255, b: 255 }
  },
  star: {
    radius: 10,
    density: 15,
    color: { r: 255, g: 165, b: 0 }
  },
  blackHole: {
    radius: 15,
    density: 360,
    color: { r: 0, g: 0, b: 0 }
  }
};