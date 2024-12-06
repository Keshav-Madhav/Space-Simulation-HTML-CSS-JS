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
  update(bodies) {
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
      body.ax = force.ax / body.weight;
      body.ay = force.ay / body.weight;
    }
  }
}


export { PhysicsSystem };