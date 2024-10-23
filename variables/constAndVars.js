let lastPressedKey = null;
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
let showFPSIsON = true;
let velocityUnit = 'm/s';
let zoomFactor = 1;
const zoomSpeed = 0.1;


const backgroundStars = [];
const celestialBodies = [];

// Add a variable to store the target camera position
let targetCamera = { x: 0, y: 0 };

// Modify the camera movement speed (adjust as needed)
let cameraMoveSpeed = 1;

const camera = {
  x: 0,
  y: 0,
  prevX: 0,
  prevY: 0
};

const keys = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false
};

const celestialBodyValues = {
  planet: {
    radius: 4,
    density: 0.5,
    color: { r: 255, g: 255, b: 255 }
  },
  star: {
    radius: 10,
    density: 2,
    color: { r: 255, g: 165, b: 0 }
  },
  blackHole: {
    radius: 15,
    density: 30,
    color: { r: 0, g: 0, b: 0 }
  }
}
