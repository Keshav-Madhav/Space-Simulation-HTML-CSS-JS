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

export { setupThreeBodyProblem, spawnPlanetsNearMouse, spawnPlanetWithLightSpeed };