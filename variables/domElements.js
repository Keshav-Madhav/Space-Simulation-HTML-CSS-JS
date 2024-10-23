const PlanetRadius = document.getElementById('PlanetRadius');
const PlanetDensity = document.getElementById('PlanetDensity');
const PlanetColor = document.getElementById('PlanetColor');
const StarRadius = document.getElementById('StarRadius');
const StarDensity = document.getElementById('StarDensity');
const StarColor = document.getElementById('StarColor');
const BlackHoleRadius = document.getElementById('BlackHoleRadius');
const BlackHoleDensity = document.getElementById('BlackHoleDensity');
const BlackHoleColor = document.getElementById('BlackHoleColor');

const followCam = document.getElementById('followCam');
const camSpeedElement = document.getElementById('camSpeed');
const prev = document.getElementById('prev');
const next = document.getElementById('next');
const centerMass = document.getElementById('centerMass');

const collision = document.getElementById('collision');
const showTrails = document.getElementById('showTrails');
const showStars = document.getElementById('showStars');
const showVelocities = document.getElementById('showVelocities');
const showLabels = document.getElementById('showLabels');
const showFPS = document.getElementById('showFPS');
const veloctyUnit = document.getElementById('velocityUnit');

const threeBody = document.getElementById('threeBody');
const cluster = document.getElementById('cluster');
const lightSpeedP = document.getElementById('lightSpeedP');
const reset = document.getElementById('reset');

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const starCanvas = document.getElementById('canvas2');
const starCtx = starCanvas.getContext('2d');

const trailCanvas = document.getElementById('canvas3');
const trailctx = trailCanvas.getContext('2d');