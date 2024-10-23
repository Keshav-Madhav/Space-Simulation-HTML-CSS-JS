import { CelestialBody } from "../classes/CelestialBodyClass.js";

/**
 * Handles elastic collision physics between two celestial bodies, including velocity calculations,
 * overlap resolution, and mass transfer effects.
 * @param {CelestialBody} body1 - First celestial body in the collision
 * @param {CelestialBody} body2 - Second celestial body in the collision
 * @returns {void}
 */
const bodyCollide = (body1, body2) => {
  // Calculate the distance between the bodys
  var dx = body1.x - body2.x;
  var dy = body1.y - body2.y;
  var distance = Math.sqrt(dx * dx + dy * dy);

  // Calculate the angle of the collision
  var angle = Math.atan2(dy, dx);

  // Calculate the components of the velocity of each body
  var velocity1 = Math.sqrt(body1.dx * body1.dx + body1.dy * body1.dy);
  var velocity2 = Math.sqrt(body2.dx * body2.dx + body2.dy * body2.dy);

  // Calculate the direction of each body
  var direction1 = Math.atan2(body1.dy, body1.dx);
  var direction2 = Math.atan2(body2.dy, body2.dx);

  // Calculate the new velocity of each body
  var velocity1x = velocity1 * Math.cos(direction1 - angle);
  var velocity1y = velocity1 * Math.sin(direction1 - angle);
  var velocity2x = velocity2 * Math.cos(direction2 - angle);
  var velocity2y = velocity2 * Math.sin(direction2 - angle);

  // The final velocities after collision are calculated considering the mass and elasticity
  var finalVelocity1x = ((body1.weight - body2.weight) * velocity1x + 2 * body2.weight * velocity2x) / (body1.weight + body2.weight) * body1.elasticity;
  var finalVelocity2x = ((body2.weight - body1.weight) * velocity2x + 2 * body1.weight * velocity1x) / (body1.weight + body2.weight) * body2.elasticity;

  // Convert velocities back to vectors
  body1.dx = Math.cos(angle) * finalVelocity1x + Math.cos(angle + Math.PI/2) * velocity1y;
  body1.dy = Math.sin(angle) * finalVelocity1x + Math.sin(angle + Math.PI/2) * velocity1y;
  body2.dx = Math.cos(angle) * finalVelocity2x + Math.cos(angle + Math.PI/2) * velocity2y;
  body2.dy = Math.sin(angle) * finalVelocity2x + Math.sin(angle + Math.PI/2) * velocity2y;

  if (distance < body1.radius + body2.radius) {
      var overlap = body1.radius + body2.radius - distance;
      var angle = Math.atan2(body2.y - body1.y, body2.x - body1.x);
      body1.x -= overlap * Math.cos(angle) / 2;
      body1.y -= overlap * Math.sin(angle) / 2;
      body2.x += overlap * Math.cos(angle) / 2;
      body2.y += overlap * Math.sin(angle) / 2;
  } else {
      // If bodys are not overlapping, they should not be moving towards each other
      var relativeVelocityX = body2.dx - body1.dx;
      var relativeVelocityY = body2.dy - body1.dy;
      var relativeVelocityDotProduct = dx * relativeVelocityX + dy * relativeVelocityY;
      if (relativeVelocityDotProduct > 0) {
          return;  // Balls are moving apart, not colliding
      }
  }

  massTransfer(body1, body2);
}

/**
 * Handles mass transfer and transformation effects when celestial bodies collide.
 * Different rules apply based on the types of bodies involved:
 * - Black holes absorb other bodies completely
 * - Stars absorb planets
 * - Star-star collisions may create black holes
 * - Planet-planet collisions result in mass transfer or absorption
 * 
 * @param {CelestialBody} body1 - First celestial body in the collision
 * @param {CelestialBody} body2 - Second celestial body in the collision
 */
function massTransfer(body1, body2) {
  if (body1.bodyType === 'blackHole' || body2.bodyType === 'blackHole') {
    // Case: Black hole collides with another body (including another black hole)
    // Remove the other body from the array and add its mass to the black hole

    const nonBlackHole = body1.bodyType === 'blackHole' ? body2 : body1;
    celestialBodies.splice(celestialBodies.indexOf(nonBlackHole), 1);
    const blackHole = body1.bodyType === 'blackHole' ? body1 : body2;
    blackHole.radius = calculateNewRadius(blackHole.weight + nonBlackHole.weight, blackHole.radius, blackHole.weight);
    blackHole.weight += nonBlackHole.weight;
    blackHole.dx /= 100;
    blackHole.dy /= 100;
  } 
  
  else if ((body1.bodyType === 'star' && body2.bodyType === 'planet') ||
            (body1.bodyType === 'planet' && body2.bodyType === 'star')) {
    // Case: Star and planet collide
    // Remove the planet and add its mass to the star
    
    const star = body1.bodyType === 'star' ? body1 : body2;
    const planet = body1.bodyType === 'planet' ? body1 : body2;
    celestialBodies.splice(celestialBodies.indexOf(planet), 1);
    star.radius = calculateNewRadius(star.weight + planet.weight, star.radius, star.weight);
    star.weight += planet.weight;
  } 
  
  else if (body1.bodyType === 'star' && body2.bodyType === 'star') {
    // Case: Star collides with star
    // There is a very small chance of becoming a black hole, otherwise, one gains mass and the other is removed

    const chanceOfBlackHole = 0.05;
    if (Math.random() < chanceOfBlackHole) {
      celestialBodies.splice(celestialBodies.indexOf(body1), 1);
      celestialBodies.splice(celestialBodies.indexOf(body2), 1);
      celestialBodies.push(
        new CelestialBody({
          bodyType: 'blackHole',
          density: 30,
          x: (body1.x + body2.x) / 2,
          y: (body1.y + body2.y) / 2,
          dx: (body1.dx + body2.dx) / 2,
          dy: (body1.dy + body2.dy) / 2,
          color: { r: 0, g: 0, b: 0 },
          label: 'Black Hole ' + (celestialBodies.length + 1),
          trailColor: 'rgba(100, 100, 100, 0.5)',
          textColor: 'rgba(255, 255, 255, 0.9)'
        })
      );
    } 
    
    else {
      const survivor = body1.weight >= body2.weight ? body1 : body2;
      const removed = body1.weight < body2.weight ? body1 : body2;
      if(removed.weight > survivor.weight/10) {
        survivor.radius = calculateNewRadius(survivor.weight + removed.weight, survivor.radius, survivor.weight);
        survivor.weight += removed.weight/2;
        removed.radius = calculateNewRadius(removed.weight/2, removed.radius, removed.weight);
        removed.weight = removed.weight/2;
      }
      else {
        survivor.radius = calculateNewRadius(survivor.weight + removed.weight, survivor.radius, survivor.weight);
        survivor.weight += removed.weight;
        celestialBodies.splice(celestialBodies.indexOf(removed), 1);
      }
    }
  } 
  
  else if (body1.bodyType === 'planet' && body2.bodyType === 'planet') {
    // Case: Planet collides with a planet
    // Remove one planet and add its mass to the other

    const survivor = body1.weight >= body2.weight ? body1 : body2;
    const removed = body1.weight < body2.weight ? body1 : body2;
    if (removed.weight > survivor.weight / 10) {
      survivor.radius = calculateNewRadius(survivor.weight + removed.weight, survivor.radius, survivor.weight);
      survivor.weight += removed.weight / 2;
      removed.radius = calculateNewRadius(removed.weight / 2, removed.radius, removed.weight);
      removed.weight = removed.weight / 2;
    }
    else {
      survivor.radius = calculateNewRadius(survivor.weight + removed.weight, survivor.radius, survivor.weight);
      survivor.weight += removed.weight;
      celestialBodies.splice(celestialBodies.indexOf(removed), 1);
    }
  }
}

/**
 * Calculates the new radius of a celestial body after a mass change,
 * maintaining the appropriate density relationship.
 * @param {number} newWeight - The new mass of the body after collision
 * @param {number} originalRadius - The original radius before collision
 * @param {number} originalWeight - The original mass before collision
 * @returns {number} The new radius of the celestial body
 */
function calculateNewRadius(newWeight, originalRadius, originalWeight) {
  const constant = originalWeight / (originalRadius * originalRadius * originalRadius);
  return Math.cbrt(newWeight / constant);
}

export { bodyCollide };