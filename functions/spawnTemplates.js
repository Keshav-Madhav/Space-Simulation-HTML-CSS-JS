import { CelestialBody } from "../classes/CelestialBodyClass.js";
import { screenToWorldCoordinates } from "./utils.js";

/** 
 * Sets up a three-body problem with three planets in an equilateral triangle formation.
 * Each planet has a random distance from the center, random velocity, and random mass.
 * The planets are colored red, green, and blue, respectively.
 */
function setupThreeBodyProblem() {
  // Define the center of the screen
  const centerX = camera.x + canvas.width / 2;
  const centerY = camera.y + canvas.height / 2;

  // Define the base distance from the center for each planet
  const baseDistance = 200;

  // Create three planets in an equilateral triangle formation
  const planets = [
    {
      angle: 0,
      color: { r: 255, g: 0, b: 0 },
      label: 'Planet Red'
    },
    {
      angle: 2 * Math.PI / 3,
      color: { r: 0, g: 255, b: 0 },
      label: 'Planet Green'
    },
    {
      angle: 4 * Math.PI / 3,
      color: { r: 0, g: 0, b: 255 },
      label: 'Planet Blue'
    }
  ];

  planets.forEach((planet) => {
    // Add small random variations to distance and angle
    const distance = baseDistance + (Math.random() - 0.5) * 20; // +/- 10 units
    const angleVariation = (Math.random() - 0.5) * 0.1; // +/- 0.05 radians
    const adjustedAngle = planet.angle + angleVariation;

    const x = centerX + distance * Math.cos(adjustedAngle);
    const y = centerY + distance * Math.sin(adjustedAngle);

    // Calculate initial velocity perpendicular to the radius
    const baseSpeed = 1;
    const speedVariation = (Math.random() - 0.5) * 0.2; // +/- 10% speed variation
    const speed = baseSpeed + speedVariation;
    const velocityAngle = adjustedAngle + Math.PI / 2;
    const dx = speed * Math.cos(velocityAngle);
    const dy = speed * Math.sin(velocityAngle);

    // Add small random variations to mass (density)
    const baseDensity = 1;
    const densityVariation = (Math.random() - 0.5) * 0.2; // +/- 10% density variation
    const density = baseDensity + densityVariation;

    celestialBodies.push(
      new CelestialBody({
        bodyType: 'planet',
        radius: 10,
        density: density,
        x: x,
        y: y,
        dx: dx,
        dy: dy,
        color: planet.color,
        label: planet.label
      })
    );
  });
}

/**
 * Spawns a specified number of planets near the mouse cursor.
 * @param {number} numPlanets The number of planets to spawn
 */
function spawnPlanetsNearMouse(numPlanets) {
  const worldCoords = screenToWorldCoordinates(canvas.width / 2, canvas.height / 2);

  for (let i = 0; i < numPlanets; i++) {
    const randomXOffset = (Math.random() - 0.5) * 400 / zoomFactor;
    const randomYOffset = (Math.random() - 0.5) * 400 / zoomFactor;

    const newPlanet = new CelestialBody({
      bodyType: 'planet',
      radius: 4,
      density: 0.5,
      x: worldCoords.x + randomXOffset,
      y: worldCoords.y + randomYOffset,
      dx: Math.random() * 2 - 1,
      dy: Math.random() * 2 - 1,
      color: { r: 255, g: 255, b: 255 },
      label: 'Planet ' + (celestialBodies.length + 1)
    });

    celestialBodies.push(newPlanet);
  }
}

/**
 * Spawns a planet with a velocity ewual to 1/1000th the speed of light.
 */
function spawnPlanetWithLightSpeed() {
  const worldCoords = screenToWorldCoordinates(
    canvas.width * Math.random(),
    canvas.height * Math.random()
  );

  const newPlanet = new CelestialBody({
    bodyType: 'planet',
    radius: 4,
    density: 0.5,
    x: worldCoords.x,
    y: worldCoords.y,
    dx: 299792.458 / 1000,
    dy: 0,
    color: { r: 255, g: 255, b: 255 },
    label: 'Planet ' + (celestialBodies.length + 1)
  });

  celestialBodies.push(newPlanet);
}

/**
 * Spawns a solar system with the Sun and all eight planets.
 */
const spawnSolarSystem = () => {
  celestialBodies.push(
    new CelestialBody({
      bodyType: 'star',
      radius: 100,
      density: 15,
      x: -6000,
      y: 0,
      dx: 0,
      dy: 0,
      color: celestialBodyValues.star.color,
      label: 'Sun'
    })
  );

  celestialBodies.push(
    new CelestialBody({
      bodyType: 'planet',
      radius: 2,
      density: 0.5,
      x: -4500,
      y: 0,
      dx: 0,
      dy: -60,
      color:  { r: 211, g: 211, b: 211 },
      label: 'Mercury'
    })
  );

  celestialBodies.push(
    new CelestialBody({
      bodyType: 'planet',
      radius: 4,
      density: 1.5,
      x: -2500,
      y: 0,
      dx: 0,
      dy: -40,
      color:  { r: 255, g: 174, b: 66 },
      label: 'Venus'
    })
  );

  celestialBodies.push(
    new CelestialBody({
      bodyType: 'planet',
      radius: 4.5,
      density: 1.5,
      x: -0,
      y: 0,
      dx: 0,
      dy: -30,
      color:  { r: 83, g: 196, b: 255 },
      label: 'Earth'
    })
  );

  celestialBodies.push(
    new CelestialBody({
      bodyType: 'planet',
      radius: 5,
      density: 2,
      x: 3000,
      y: 0,
      dx: 0,
      dy: -24,
      color:  { r: 193, g: 68, b: 14 },
      label: 'Mars'
    })
  );

  celestialBodies.push(
    new CelestialBody({
      bodyType: 'planet',
      radius: 40,
      density: 0.1,
      x: 9000,
      y: 0,
      dx: 0,
      dy: -20,
      color:  { r: 245, g: 245, b: 220 },
      label: 'Jupiter'
    })
  );

  celestialBodies.push(
    new CelestialBody({
      bodyType: 'planet',
      radius: 25,
      density: 0.5,
      x: 18000,
      y: 0,
      dx: 0,
      dy: -15,
      color:  { r: 255, g: 198, b: 137 },
      label: 'Saturn'
    })
  );

  celestialBodies.push(
    new CelestialBody({
      bodyType: 'planet',
      radius: 20,
      density: 1,
      x: 30000,
      y: 0,
      dx: 0,
      dy: -12,
      color:  { r: 172, g: 229, b: 238 },
      label: 'Uranus'
    })
  );

  celestialBodies.push(
    new CelestialBody({
      bodyType: 'planet',
      radius: 20,
      density: 1,
      x: 42000,
      y: 0,
      dx: 0,
      dy: -10,
      color:  { r: 0, g: 147, b: 125 },
      label: 'Neptune'
    })
  );

  celestialBodies.push(
    new CelestialBody({
      bodyType: 'planet',
      radius: 1,
      density: 1,
      x: 54000,
      y: 0,
      dx: 0,
      dy: -10,
      color:  { r: 144, g: 144, b: 144 },
      label: 'Pluto'
    })
  );
}

function spawnGalaxy() {
  // Define the center of the galaxy
  const centerX = camera.x + canvas.width / 2;
  const centerY = camera.y + canvas.height / 2;

  // Spawn the black hole
  const blackHole = new CelestialBody({
    bodyType: 'blackHole',
    radius: 17,
    density: 100,
    x: centerX,
    y: centerY,
    dx: 0,
    dy: 0,
    color: celestialBodyValues.blackHole.color,
    trailColor: 'rgba(100, 100, 100, 0.5)',
    textColor: 'rgba(255, 255, 255, 0.9)',
    label: 'Black Hole'
  });
  celestialBodies.push(blackHole);

  // Spawn 100-200 planets orbiting the black hole
  const numPlanets = Math.floor(Math.random() * 10) + 20;
  const baseDistance = 1000; // 1 unit = 1/10,000 scale of the galaxy

  for (let i = 0; i < numPlanets; i++) {
    const angle = Math.random() * 2 * Math.PI;
    const distance = baseDistance + Math.random() * 500; // Random distance from 1000 to 1500
    const x = centerX + distance * Math.cos(angle);
    const y = centerY + distance * Math.sin(angle);

    const speed = 10 + Math.random() * 3; // Random speed between 10 and 15
    const dx = -speed * Math.sin(angle);
    const dy = speed * Math.cos(angle);

    const newPlanet = new CelestialBody({
      bodyType: 'planet',
      radius: 4 + Math.random() * 2, // Random radius between 4 and 6
      density: 0.5 + Math.random() * 0.5, // Random density between 0.5 and 1
      x: x,
      y: y,
      dx: dx,
      dy: dy,
      color: {
        r: Math.floor(Math.random() * 256),
        g: Math.floor(Math.random() * 256),
        b: Math.floor(Math.random() * 256)
      },
      label: `Planet ${i + 1}`
    });

    celestialBodies.push(newPlanet);
  }
}

export { setupThreeBodyProblem, spawnPlanetsNearMouse, spawnPlanetWithLightSpeed, spawnSolarSystem, spawnGalaxy };