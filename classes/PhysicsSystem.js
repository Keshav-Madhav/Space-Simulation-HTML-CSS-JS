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

  reset(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.children[0] = this.children[1] = this.children[2] = this.children[3] = null;
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
  subdivide(nodeAllocator) {
    const halfWidth = this.width / 2;
    const halfHeight = this.height / 2;
    // Add small overlap to prevent edge case issues
    const overlap = Math.min(halfWidth, halfHeight) * 0.001;
    this.children[0] = nodeAllocator(this.x - overlap, this.y - overlap, halfWidth + overlap * 2, halfHeight + overlap * 2);
    this.children[1] = nodeAllocator(this.x + halfWidth - overlap, this.y - overlap, halfWidth + overlap * 2, halfHeight + overlap * 2);
    this.children[2] = nodeAllocator(this.x - overlap, this.y + halfHeight - overlap, halfWidth + overlap * 2, halfHeight + overlap * 2);
    this.children[3] = nodeAllocator(this.x + halfWidth - overlap, this.y + halfHeight - overlap, halfWidth + overlap * 2, halfHeight + overlap * 2);
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
    this.minDistance = 20; // Minimum distance for force calculation
    this.minDistanceSq = this.minDistance * this.minDistance;
    this.softening = 100; // Softening parameter for close encounters
    this.softeningSq = this.softening * this.softening;
    this.adaptiveTheta = false; // Enable adaptive multipole acceptance
    this.nodePool = [];
    this.poolIndex = 0;
    this.root = this._getNode(x, y, size, size);
  }

  _getNode(x, y, w, h) {
    let node = this.nodePool[this.poolIndex];
    if (node) {
      node.reset(x, y, w, h);
    } else {
      node = new BHNode(x, y, w, h);
      this.nodePool.push(node);
    }
    this.poolIndex++;
    return node;
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
      node.subdivide(this._getNode.bind(this));
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
    const distSqRaw = dx * dx + dy * dy;
    if (distSqRaw < this.minDistanceSq) {
      return { ax: 0, ay: 0 };
    }
    const distSq = distSqRaw + this.softeningSq;
    const invDist = 1 / Math.sqrt(distSq);
    const invDist3 = invDist * invDist * invDist;

    // Adaptive multipole acceptance criterion
    let effectiveTheta = this.theta;
    if (this.adaptiveTheta) {
      // Adjust theta based on the mass ratio and distance
      const massRatio = node.totalMass / body.weight;
      const distance = 1 / invDist; // actual softened distance
      effectiveTheta = this.theta * (1 + Math.log10(massRatio)) / (1 + Math.abs(Math.log10(distance / this.root.width)));
    }
    if (node.isLeaf || (node.width * invDist) < effectiveTheta) {
      const G = 0.1; // Gravitational constant
      const scalar = G * body.weight * node.totalMass * invDist3;
      return { ax: scalar * dx, ay: scalar * dy };
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
    this.poolIndex = 0; // reuse nodes
    this.root = this._getNode(this.root.x, this.root.y, this.root.width, this.root.height);
  }
}

/**
 * Physics system using Barnes-Hut algorithm
 */
class PhysicsSystem {
  constructor() {
    this.bhTree = null;
    this.frameCounter = 0;
    this.rebuildInterval = 1; // can be tuned dynamically
    this.prevBounds = { minX: 0, minY: 0, maxX: 0, maxY: 0, size: 0 };
  }

  /**
   * Updates physics for all bodies using Barnes-Hut algorithm
   */
  update(bodies, checkCollisions) {
    if (!bodies || bodies.length === 0) return;
    this.frameCounter++;
    const rebuild = (this.frameCounter % this.rebuildInterval) === 0 || !this.bhTree;

    if (rebuild) {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (let i = 0; i < bodies.length; i++) {
        const b = bodies[i];
        if (b.x < minX) minX = b.x;
        if (b.y < minY) minY = b.y;
        if (b.x > maxX) maxX = b.x;
        if (b.y > maxY) maxY = b.y;
      }
      const width = maxX - minX;
      const height = maxY - minY;
      const size = Math.max(width, height) * 1.2;
      if (!this.bhTree) {
        this.bhTree = new BarnesHutTree(minX - size * 0.1, minY - size * 0.1, size);
      } else {
        this.bhTree.clear();
        this.bhTree.root.reset(minX - size * 0.1, minY - size * 0.1, size, size);
      }
      this.prevBounds = { minX, minY, maxX, maxY, size };
      for (let i = 0; i < bodies.length; i++) this.bhTree.insert(bodies[i]);
    }

    // Directly assign forces
    for (let i = 0; i < bodies.length; i++) {
      const body = bodies[i];
      const force = this.bhTree.calculateForces(body);
      body.ax = force.ax / body.weight;
      body.ay = force.ay / body.weight;
    }

    if (checkCollisions && rebuild) {
      this._handleCollisions(bodies);
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