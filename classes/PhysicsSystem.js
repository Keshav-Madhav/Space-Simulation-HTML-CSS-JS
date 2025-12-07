import { bodyCollide } from "../functions/collisionAndMassTransfer.js";
import { CelestialBody } from "./CelestialBodyClass.js";

/**
 * Represents a node in the Barnes-Hut quad tree
 */
class BHNode {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.children = [null, null, null, null]; // NW, NE, SW, SE
    this.body = null;
    this.totalMass = 0;
    this.centerOfMassX = 0;
    this.centerOfMassY = 0;
    this.isLeaf = true;
    this.bodyCount = 0;
  }

  /**
   * Checks if a point is within this node's boundaries
   */
  contains(x, y) {
    return (x >= this.x && x < this.x + this.width &&
            y >= this.y && y < this.y + this.height);
  }

  /**
   * Subdivides this node into four quadrants
   */
  subdivide() {
    const halfWidth = this.width / 2;
    const halfHeight = this.height / 2;
    // Add small overlap to prevent edge case issues
    const overlap = Math.min(halfWidth, halfHeight) * 0.001;

    this.children[0] = new BHNode(this.x - overlap, this.y - overlap, 
                                 halfWidth + overlap * 2, halfHeight + overlap * 2);
    this.children[1] = new BHNode(this.x + halfWidth - overlap, this.y - overlap,
                                 halfWidth + overlap * 2, halfHeight + overlap * 2);
    this.children[2] = new BHNode(this.x - overlap, this.y + halfHeight - overlap,
                                 halfWidth + overlap * 2, halfHeight + overlap * 2);
    this.children[3] = new BHNode(this.x + halfWidth - overlap, this.y + halfHeight - overlap,
                                 halfWidth + overlap * 2, halfHeight + overlap * 2);
    
    this.isLeaf = false;
  }

  /**
   * Gets the quadrant index for a point
   */
  getQuadrantIndex(x, y) {
    const midX = this.x + this.width / 2;
    const midY = this.y + this.height / 2;
    
    if (y < midY) {
      return x < midX ? 0 : 1; // NW : NE
    } else {
      return x < midX ? 2 : 3; // SW : SE
    }
  }
}

/**
 * Barnes-Hut tree for efficient gravity calculations
 */
class BarnesHutTree {
  constructor(x, y, size) {
    this.theta = 0.9;
    this.root = new BHNode(x, y, size, size);
    this.minDistance = 20; // Minimum distance for force calculation
    this.softening = 100; // Softening parameter for close encounters
    this.adaptiveTheta = false; // Enable adaptive multipole acceptance
  }

  /**
   * Inserts a celestial body into the tree
   */
  insert(body) {
    this._insertBody(this.root, body);
  }

  _insertBody(node, body) {
    // Update node's mass and center of mass
    const totalMass = node.totalMass + body.weight;
    const centerX = (node.centerOfMassX * node.totalMass + body.x * body.weight) / totalMass;
    const centerY = (node.centerOfMassY * node.totalMass + body.y * body.weight) / totalMass;
    
    node.totalMass = totalMass;
    node.centerOfMassX = centerX;
    node.centerOfMassY = centerY;

    // If node is empty, put the body here
    if (node.totalMass === body.weight) {
      node.body = body;
      return;
    }

    // If this is a leaf node but already contains a body, subdivide
    if (node.isLeaf && node.body !== null) {
      const oldBody = node.body;
      node.body = null;
      node.subdivide();
      this._insertBody(node.children[node.getQuadrantIndex(oldBody.x, oldBody.y)], oldBody);
    }

    // If this is not a leaf node, insert into appropriate quadrant
    if (!node.isLeaf) {
      const quadrantIndex = node.getQuadrantIndex(body.x, body.y);
      this._insertBody(node.children[quadrantIndex], body);
    }
  }

  /**
   * Calculates gravitational forces on a body
   */
  calculateForces(body) {
    return this._calculateForces(this.root, body);
  }

  _calculateForces(node, body) {
    if (node === null || node.totalMass === 0 || node.body === body) {
      return { ax: 0, ay: 0 };
    }

    const dx = node.centerOfMassX - body.x;
    const dy = node.centerOfMassY - body.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Apply softening to prevent numerical instabilities
    const softenedDistance = Math.sqrt(distance * distance + this.softening * this.softening);

    // Adaptive multipole acceptance criterion
    let effectiveTheta = this.theta;
    if (this.adaptiveTheta) {
      // Adjust theta based on the mass ratio and distance
      const massRatio = node.totalMass / body.weight;
      effectiveTheta = this.theta * (1 + Math.log10(massRatio)) / 
                      (1 + Math.abs(Math.log10(distance / this.root.width)));
    }

    if (node.isLeaf || (node.width / softenedDistance) < effectiveTheta) {
      const G = 0.1; // Gravitational constant
      if (softenedDistance < this.minDistance) {
        return { ax: 0, ay: 0 };
      }

      // Use softened force calculation
      const force = (G * body.weight * node.totalMass) / 
                   (softenedDistance * softenedDistance * softenedDistance);

      return {
        ax: force * dx,
        ay: force * dy
      };
    }

    // Recursively calculate forces with improved accuracy
    let totalForce = { ax: 0, ay: 0 };
    for (const child of node.children) {
      const force = this._calculateForces(child, body);
      totalForce.ax += force.ax;
      totalForce.ay += force.ay;
    }

    return totalForce;
  }

  /**
   * Find potential collision candidates within a certain radius
   * @param {CelestialBody} body - The body to check for potential collisions
   * @param {number} searchRadius - Radius to search for potential collisions
   * @returns {Array} Potential collision candidates
   */
  findPotentialCollisions(body, searchRadius) {
    const candidates = [];
    this._findCollisionCandidates(this.root, body, searchRadius, candidates);
    return candidates;
  }

  _findCollisionCandidates(node, body, searchRadius, candidates) {
    if (node === null) return;

    // Check if the node's bounding box intersects with the search area
    const nodeRight = node.x + node.width;
    const nodeBottom = node.y + node.height;
    const bodyRight = body.x + searchRadius;
    const bodyBottom = body.y + searchRadius;

    const intersects = 
      node.x < bodyRight && 
      nodeRight > body.x - searchRadius && 
      node.y < bodyBottom && 
      nodeBottom > body.y - searchRadius;

    if (!intersects) return;

    // If it's a leaf node with a body
    if (node.isLeaf && node.body && node.body !== body) {
      candidates.push(node.body);
      return;
    }

    // Recursively check child nodes
    for (const child of node.children) {
      this._findCollisionCandidates(child, body, searchRadius, candidates);
    }
  }

  /**
   * Clears the tree
   */
  clear() {
    this.root = new BHNode(this.root.x, this.root.y, this.root.width, this.root.height);
  }
}

/**
 * Physics system using Barnes-Hut algorithm
 */
class PhysicsSystem {
  constructor() {
    this.bhTree = null;
  }

  /**
   * Updates physics for all bodies using Barnes-Hut algorithm
   */
  update(bodies, checkCollisions, timeStep = 1.0) {
    // Find bounds of all bodies
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const body of bodies) {
      minX = Math.min(minX, body.x);
      minY = Math.min(minY, body.y);
      maxX = Math.max(maxX, body.x);
      maxY = Math.max(maxY, body.y);
    }

    // Create a square region that encompasses all bodies
    const width = maxX - minX;
    const height = maxY - minY;
    const size = Math.max(width, height) * 1.2; // Increased padding for better boundary handling

    // Create new Barnes-Hut tree instance
    this.bhTree = new BarnesHutTree(
      minX - size * 0.1, 
      minY - size * 0.1, 
      size
    );

    // Batch insert bodies for better performance
    for (const body of bodies) {
      this.bhTree.insert(body);
    }

    // Calculate forces with temporal coherence
    const forces = new Map();
    for (const body of bodies) {
      forces.set(body, this.bhTree.calculateForces(body));
    }

    // Apply forces in a separate pass to maintain consistency
    for (const body of bodies) {
      const force = forces.get(body);
      
      // If body is pinned, don't apply forces to it (but it still exerts forces on others)
      if (body.isPinned) {
        body.ax = 0;
        body.ay = 0;
      } else {
        body.ax = force.ax / body.weight;
        body.ay = force.ay / body.weight;
      }
    }

    // Handle collisions if enabled
    if (checkCollisions) {
      this._handleCollisions(bodies);
    }
  }

  /**
   * Draws the Barnes-Hut tree visualization
   * @param {CanvasRenderingContext2D} ctx - The canvas context
   * @param {Object} camera - The camera object with x, y positions
   * @param {number} zoomFactor - Current zoom level
   * @param {Object} options - Drawing options
   * @param {boolean} options.showNodes - Whether to draw quad boundaries
   * @param {boolean} options.showCenterOfMass - Whether to draw center of mass indicators
   */
  drawTree(ctx, camera, zoomFactor, options = { showNodes: true, showCenterOfMass: true }) {
    if (!this.bhTree || !this.bhTree.root) return;
    if (!options.showNodes && !options.showCenterOfMass) return;
    
    this._drawNode(ctx, this.bhTree.root, camera, zoomFactor, 0, options);
  }

  /**
   * Recursively draws a node and its children
   * @param {CanvasRenderingContext2D} ctx - The canvas context
   * @param {BHNode} node - The current node to draw
   * @param {Object} camera - The camera object
   * @param {number} zoomFactor - Current zoom level
   * @param {number} depth - Current tree depth for coloring
   * @param {Object} options - Drawing options
   */
  _drawNode(ctx, node, camera, zoomFactor, depth, options) {
    if (!node) return;

    // Calculate screen position with camera offset
    const screenX = (node.x - camera.x) * zoomFactor + ctx.canvas.width / 2 * (1 - zoomFactor);
    const screenY = (node.y - camera.y) * zoomFactor + ctx.canvas.height / 2 * (1 - zoomFactor);
    const screenWidth = node.width * zoomFactor;
    const screenHeight = node.height * zoomFactor;

    // Color based on depth - creates a nice gradient effect
    const hue = (depth * 40) % 360;
    const saturation = 70;
    const lightness = 50 + (node.isLeaf ? 10 : 0);
    
    // Draw quad boundary if enabled
    if (options.showNodes) {
      ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.6)`;
      ctx.lineWidth = 1;
      ctx.strokeRect(screenX, screenY, screenWidth, screenHeight);
    }

    // Draw center of mass if node has mass and option is enabled
    if (options.showCenterOfMass && node.totalMass > 0) {
      const comScreenX = (node.centerOfMassX - camera.x) * zoomFactor + ctx.canvas.width / 2 * (1 - zoomFactor);
      const comScreenY = (node.centerOfMassY - camera.y) * zoomFactor + ctx.canvas.height / 2 * (1 - zoomFactor);
      
      // Size based on depth (larger for higher-level nodes) and mass
      // Higher level nodes (lower depth) are bigger, leaf nodes are smallest
      const depthFactor = Math.max(1, 8 - depth); // 8 at root, decreases with depth
      const massFactor = Math.log10(node.totalMass + 1) * 0.5;
      const comSize = node.isLeaf ? 2 : Math.max(3, Math.min(12, depthFactor + massFactor));
      
      // Draw center of mass point
      ctx.fillStyle = node.isLeaf 
        ? `hsla(${hue}, 90%, 70%, 0.9)` 
        : `hsla(0, 0%, 100%, 0.8)`;
      ctx.beginPath();
      ctx.arc(comScreenX, comScreenY, comSize, 0, Math.PI * 2);
      ctx.fill();

      // Draw small cross at center of mass for better visibility (non-leaf nodes only)
      if (!node.isLeaf) {
        ctx.strokeStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.8)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(comScreenX - comSize - 2, comScreenY);
        ctx.lineTo(comScreenX + comSize + 2, comScreenY);
        ctx.moveTo(comScreenX, comScreenY - comSize - 2);
        ctx.lineTo(comScreenX, comScreenY + comSize + 2);
        ctx.stroke();
      }
    }

    // Recursively draw children
    if (!node.isLeaf) {
      for (const child of node.children) {
        this._drawNode(ctx, child, camera, zoomFactor, depth + 1, options);
      }
    }
  }

  /**
   * Handles collision detection using Barnes-Hut tree
   */
  _handleCollisions(bodies) {
    const collisionChecked = new Set();

    for (const body of bodies) {
      const searchRadius = body.radius * 2; // Search radius based on body size

      // Find potential collision candidates
      const candidates = this.bhTree.findPotentialCollisions(body, searchRadius);

      // Check actual collisions only for candidates
      for (const otherBody of candidates) {
        const collisionPair = [body.id, otherBody.id].sort().join('-');
        if (collisionChecked.has(collisionPair)) continue;

        const dx = body.x - otherBody.x;
        const dy = body.y - otherBody.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < body.radius + otherBody.radius) {
          bodyCollide(body, otherBody);
          collisionChecked.add(collisionPair);
        }
      }
    }
  }
}


export { PhysicsSystem };