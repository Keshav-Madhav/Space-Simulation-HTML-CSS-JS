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
    const randomXOffset = (Math.random() - 0.5) * 800 / zoomFactor;
    const randomYOffset = (Math.random() - 0.5) * 600 / zoomFactor;

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

/**
 * Spawns a binary star system with two stars orbiting each other in a stable, drift-free orbit,
 * and adds five planets orbiting the binary star system.
 */
function spawnBinaryStarSystem() {
  // Define the center of the binary star system
  const centerX = camera.x + canvas.width / 2;
  const centerY = camera.y + canvas.height / 2;

  // Set distance between the stars and the center
  const distanceFromCenter = 100;
  const orbitalSpeed = 5.8;
  
  // Set the mass and radius of each star
  const mass = 30;
  const radius = 10;

  // Define properties for each star
  const starProperties = [
    {
      label: 'Star A',
      color: { r: 255, g: 223, b: 0 }, // Yellow-ish color for Star A
      angle: 0
    },
    {
      label: 'Star B',
      color: { r: 0, g: 191, b: 255 }, // Blue color for Star B
      angle: Math.PI
    }
  ];

  starProperties.forEach((star) => {
    // Position each star at the specified distance from the center
    const x = centerX + distanceFromCenter * Math.cos(star.angle);
    const y = centerY + distanceFromCenter * Math.sin(star.angle);

    // Set the velocity perpendicular to the radius (90 degrees offset)
    const velocityAngle = star.angle + Math.PI / 2;
    const dx = orbitalSpeed * Math.cos(velocityAngle);
    const dy = orbitalSpeed * Math.sin(velocityAngle);

    // Create and add the star to the celestialBodies array
    celestialBodies.push(
      new CelestialBody({
        bodyType: 'star',
        radius: radius,
        density: mass,
        x: x,
        y: y,
        dx: dx,
        dy: dy,
        color: star.color,
        label: star.label
      })
    );
  });

  // Add five planets orbiting the binary star system
  const numPlanets = 5;
  const distance = 1500;
  const speed = 4.1;

  for (let i = 0; i < numPlanets; i++) {
    const angle = (i * 2 * Math.PI) / numPlanets; // Evenly distribute planets around the center

    // Calculate planet position
    const planetX = centerX + distance * Math.cos(angle);
    const planetY = centerY + distance * Math.sin(angle);

    const velocityAngle = angle + Math.PI / 2;
    const dx = speed * Math.cos(velocityAngle);
    const dy = speed * Math.sin(velocityAngle);

    // Create and add each planet to the celestialBodies array
    celestialBodies.push(
      new CelestialBody({
        bodyType: 'planet',
        radius: 5, // Increment radius for variety
        density: 1,
        x: planetX,
        y: planetY,
        dx: dx,
        dy: dy,
        color: { r: 100 + i * 30, g: 200 - i * 20, b: 255 - i * 10 }, // Vary color for each planet
        label: `Planet ${i + 1}`
      })
    );
  }
}

/**
 * Spawns a meteor shower with small meteors moving toward the center of the screen.
 * Each meteor has a random starting point off-screen, trajectory, speed, and color.
 */
function spawnMeteorShower() {
  // Define the target point (center of the screen)
  const targetX = camera.x + canvas.width / 2;
  const targetY = camera.y + canvas.height / 2;

  // Number of meteors in the shower
  const numMeteors = 50;

  for (let i = 0; i < numMeteors; i++) {
    const startX = (Math.random() < 0.5 ? -100 : canvas.width + 100) + camera.x;
    const startY = (Math.random() * canvas.height * 1.5) + camera.y;

    // Calculate the angle and velocity to move toward the target point
    const angle = Math.atan2(targetY - startY, targetX - startX);
    const speed = 10 + Math.random() * 5; // Random speed between 10 and 15
    const dx = speed * Math.cos(angle);
    const dy = speed * Math.sin(angle);

    // Random color for each meteor, giving a fiery appearance
    const color = {
      r: 255,
      g: Math.floor(Math.random() * 156), // Random green component for variety
      b: 0
    };

    // Create each meteor with a small radius and high density
    const meteor = new CelestialBody({
      bodyType: 'meteor',
      radius: 1 + Math.random(), // Radius range 2-5
      density: 2, // High density to simulate meteors
      x: startX,
      y: startY,
      dx: dx,
      dy: dy,
      color: color,
      label: `Meteor ${i + 1}`
    });

    celestialBodies.push(meteor);
  }
}

export { setupThreeBodyProblem, spawnPlanetsNearMouse, spawnPlanetWithLightSpeed, spawnSolarSystem, spawnGalaxy, spawnMeteorShower, spawnBinaryStarSystem };