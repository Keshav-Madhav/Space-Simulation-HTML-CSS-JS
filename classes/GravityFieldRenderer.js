class GravityFieldRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl2', { 
      antialias: true, 
      alpha: true,
      premultipliedAlpha: false 
    });
    
    if (!this.gl) {
      this.gl = canvas.getContext('webgl', { 
        antialias: true, 
        alpha: true,
        premultipliedAlpha: false 
      });
      this.isWebGL2 = false;
    } else {
      this.isWebGL2 = true;
    }
    
    this.settings = {
      gridOpacity: 1.0,
      heatmapOpacity: 0.85,
      vectorOpacity: 1.0,
      contourOpacity: 0.9,
      gridSpacing: 35,
      vectorSpacing: 30,
      contourLevels: 30,
      contourLineWidth: 2.0,
      maxWarpDistance: 40,
      warpStrength: 1.0
    };
    
    this.G = 1000;
    
    this._initShaders();
    this._initBuffers();
    
    this.projectionMatrix = new Float32Array(16);
    this.viewMatrix = new Float32Array(16);
    
    this._updateProjectionMatrix();
  }
  
  _initShaders() {
    const gl = this.gl;
    
    const lineVertexSource = this.isWebGL2 ? `#version 300 es
      in vec2 a_position;
      in vec4 a_color;
      uniform mat4 u_projection;
      uniform mat4 u_view;
      out vec4 v_color;
      void main() {
        gl_Position = u_projection * u_view * vec4(a_position, 0.0, 1.0);
        v_color = a_color;
      }
    ` : `
      attribute vec2 a_position;
      attribute vec4 a_color;
      uniform mat4 u_projection;
      uniform mat4 u_view;
      varying vec4 v_color;
      void main() {
        gl_Position = u_projection * u_view * vec4(a_position, 0.0, 1.0);
        v_color = a_color;
      }
    `;
    
    const lineFragmentSource = this.isWebGL2 ? `#version 300 es
      precision mediump float;
      in vec4 v_color;
      out vec4 fragColor;
      void main() {
        fragColor = v_color;
      }
    ` : `
      precision mediump float;
      varying vec4 v_color;
      void main() {
        gl_FragColor = v_color;
      }
    `;
    
    const heatmapVertexSource = this.isWebGL2 ? `#version 300 es
      in vec2 a_position;
      in vec2 a_texCoord;
      uniform mat4 u_projection;
      uniform mat4 u_view;
      out vec2 v_texCoord;
      void main() {
        gl_Position = u_projection * u_view * vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    ` : `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      uniform mat4 u_projection;
      uniform mat4 u_view;
      varying vec2 v_texCoord;
      void main() {
        gl_Position = u_projection * u_view * vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `;
    
    const heatmapFragmentSource = this.isWebGL2 ? `#version 300 es
      precision mediump float;
      in vec2 v_texCoord;
      out vec4 fragColor;
      uniform sampler2D u_heatmapTexture;
      uniform float u_opacity;
      void main() {
        vec4 color = texture(u_heatmapTexture, v_texCoord);
        fragColor = vec4(color.rgb, color.a * u_opacity);
      }
    ` : `
      precision mediump float;
      varying vec2 v_texCoord;
      uniform sampler2D u_heatmapTexture;
      uniform float u_opacity;
      void main() {
        vec4 color = texture2D(u_heatmapTexture, v_texCoord);
        gl_FragColor = vec4(color.rgb, color.a * u_opacity);
      }
    `;
    
    this.lineProgram = this._createProgram(gl, lineVertexSource, lineFragmentSource);
    this.heatmapProgram = this._createProgram(gl, heatmapVertexSource, heatmapFragmentSource);
    
    this.lineAttribs = {
      position: gl.getAttribLocation(this.lineProgram, 'a_position'),
      color: gl.getAttribLocation(this.lineProgram, 'a_color')
    };
    this.lineUniforms = {
      projection: gl.getUniformLocation(this.lineProgram, 'u_projection'),
      view: gl.getUniformLocation(this.lineProgram, 'u_view')
    };
    
    this.heatmapAttribs = {
      position: gl.getAttribLocation(this.heatmapProgram, 'a_position'),
      texCoord: gl.getAttribLocation(this.heatmapProgram, 'a_texCoord')
    };
    this.heatmapUniforms = {
      projection: gl.getUniformLocation(this.heatmapProgram, 'u_projection'),
      view: gl.getUniformLocation(this.heatmapProgram, 'u_view'),
      texture: gl.getUniformLocation(this.heatmapProgram, 'u_heatmapTexture'),
      opacity: gl.getUniformLocation(this.heatmapProgram, 'u_opacity')
    };
  }
  
  _createProgram(gl, vertexSource, fragmentSource) {
    const vertexShader = this._compileShader(gl, gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = this._compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    if (!vertexShader || !fragmentShader) return null;
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link failed:', gl.getProgramInfoLog(program));
      return null;
    }
    return program;
  }
  
  _compileShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile failed:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }
  
  _initBuffers() {
    const gl = this.gl;
    this.linePositionBuffer = gl.createBuffer();
    this.lineColorBuffer = gl.createBuffer();
    this.heatmapPositionBuffer = gl.createBuffer();
    this.heatmapTexCoordBuffer = gl.createBuffer();
    this.heatmapTexture = gl.createTexture();
    this.heatmapTextureSize = 256;
    this.heatmapData = new Uint8Array(this.heatmapTextureSize * this.heatmapTextureSize * 4);
    gl.bindTexture(gl.TEXTURE_2D, this.heatmapTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.maxLineVertices = 300000;
    this.linePositions = new Float32Array(this.maxLineVertices * 2);
    this.lineColors = new Float32Array(this.maxLineVertices * 4);
  }
  
  resize(width, height) {
    this._updateProjectionMatrix();
  }
  
  _updateProjectionMatrix() {
    const width = this.canvas.width;
    const height = this.canvas.height;
    this.projectionMatrix = new Float32Array([
      2 / width, 0, 0, 0,
      0, -2 / height, 0, 0,
      0, 0, -1, 0,
      -1, 1, 0, 1
    ]);
  }
  
  setCamera(cameraX, cameraY, zoom) {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    this.viewMatrix = new Float32Array([
      zoom, 0, 0, 0,
      0, zoom, 0, 0,
      0, 0, 1, 0,
      centerX - (centerX + cameraX) * zoom, centerY - (centerY + cameraY) * zoom, 0, 1
    ]);
    this.currentZoom = zoom;
    this.cameraX = cameraX;
    this.cameraY = cameraY;
  }
  
  calculatePotential(x, y, bodies) {
    let potential = 0;
    for (const body of bodies) {
      const dx = x - body.x;
      const dy = y - body.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const softening = body.radius * 0.5;
      const effectiveDist = Math.max(dist, softening);
      potential -= this.G * body.weight / effectiveDist;
    }
    return potential;
  }
  
  calculateField(x, y, bodies) {
    let ax = 0;
    let ay = 0;
    for (const body of bodies) {
      const dx = body.x - x;
      const dy = body.y - y;
      const distSq = dx * dx + dy * dy;
      const dist = Math.sqrt(distSq);
      if (dist < body.radius * 0.5) continue;
      const forceMag = this.G * body.weight / (distSq + 1);
      ax += forceMag * dx / dist;
      ay += forceMag * dy / dist;
    }
    const magnitude = Math.sqrt(ax * ax + ay * ay);
    return { ax, ay, magnitude };
  }
  
  calculateWarpDisplacement(x, y, bodies, maxDisplacement) {
    let totalDx = 0;
    let totalDy = 0;
    
    for (const body of bodies) {
      const dx = body.x - x;
      const dy = body.y - y;
      const distSq = dx * dx + dy * dy;
      const dist = Math.sqrt(distSq);
      
      // Softening parameter - controls how smooth the well is near the center
      // Larger = smoother/wider well, smaller = sharper well
      const softening = body.radius * 3;
      
      // Softened distance: sqrt(r² + a²)
      // This naturally limits displacement at center without any hard cutoffs
      const softenedDist = Math.sqrt(distSq + softening * softening);
      
      // Calculate direction to body (use softened dist to smooth direction near center too)
      const dirX = dx / softenedDist;
      const dirY = dy / softenedDist;
      
      // Gravitational well strength - creates smooth 1/r profile that saturates near center
      // At r=0: displacement = strength/softening (finite maximum)
      // At large r: displacement ≈ strength/r (standard falloff)
      const strength = body.weight * 0.8;
      const displacement = strength / softenedDist;
      
      totalDx += dirX * displacement;
      totalDy += dirY * displacement;
    }
    
    // Soft clamp using tanh for smooth limiting at max displacement
    const totalMag = Math.sqrt(totalDx * totalDx + totalDy * totalDy);
    if (totalMag > 0.001) {
      const clampedMag = maxDisplacement * Math.tanh(totalMag / maxDisplacement);
      const scale = clampedMag / totalMag;
      totalDx *= scale;
      totalDy *= scale;
    }
    
    return { dx: totalDx, dy: totalDy };
  }
  
  drawWarpedGrid(bodies, viewBounds, options = {}) {
    if (bodies.length === 0) return;
    
    const gl = this.gl;
    const { opacity = this.settings.gridOpacity } = options;
    
    // Grid spacing that gets denser when zoomed out
    // When zoomed out (zoom < 1), we want MORE lines (smaller spacing)
    // When zoomed in (zoom > 1), we want fewer lines (larger spacing) to avoid clutter
    let spacing;
    if (this.currentZoom < 1) {
      // Zoomed out: use fixed small spacing for dense grid
      // The further out, the denser (more context visible = more grid lines needed)
      spacing = this.settings.gridSpacing * 0.7;
    } else {
      // Zoomed in: scale spacing with zoom to keep consistent visual density
      spacing = this.settings.gridSpacing / this.currentZoom;
    }
    // Clamp to reasonable bounds
    spacing = Math.max(12, Math.min(spacing, 100));
    
    const margin = spacing * 2;
    const minX = Math.floor((viewBounds.minX - margin) / spacing) * spacing;
    const maxX = Math.ceil((viewBounds.maxX + margin) / spacing) * spacing;
    const minY = Math.floor((viewBounds.minY - margin) / spacing) * spacing;
    const maxY = Math.ceil((viewBounds.maxY + margin) / spacing) * spacing;
    
    const maxWarp = this.settings.maxWarpDistance / this.currentZoom * this.settings.warpStrength;
    
    const gridCols = Math.ceil((maxX - minX) / spacing) + 1;
    const gridRows = Math.ceil((maxY - minY) / spacing) + 1;
    
    const maxGrid = 100;
    const stepX = Math.max(1, Math.floor(gridCols / maxGrid));
    const stepY = Math.max(1, Math.floor(gridRows / maxGrid));
    
    const warpedPoints = new Map();
    
    for (let row = 0; row <= gridRows; row += stepY) {
      for (let col = 0; col <= gridCols; col += stepX) {
        const x = minX + col * spacing;
        const y = minY + row * spacing;
        const key = `${col},${row}`;
        const warp = this.calculateWarpDisplacement(x, y, bodies, maxWarp);
        warpedPoints.set(key, { x: x + warp.dx, y: y + warp.dy });
      }
    }
    
    let vertexCount = 0;
    const r = 0.0, g = 0.8, b = 0.9, a = opacity * 0.7;
    
    for (let row = 0; row <= gridRows; row += stepY) {
      for (let col = 0; col < gridCols; col += stepX) {
        const p1 = warpedPoints.get(`${col},${row}`);
        const p2 = warpedPoints.get(`${col + stepX},${row}`);
        if (p1 && p2 && vertexCount < this.maxLineVertices - 2) {
          const baseIdx = vertexCount * 2;
          const colorIdx = vertexCount * 4;
          this.linePositions[baseIdx] = p1.x;
          this.linePositions[baseIdx + 1] = p1.y;
          this.linePositions[baseIdx + 2] = p2.x;
          this.linePositions[baseIdx + 3] = p2.y;
          this.lineColors[colorIdx] = r; this.lineColors[colorIdx + 1] = g; this.lineColors[colorIdx + 2] = b; this.lineColors[colorIdx + 3] = a;
          this.lineColors[colorIdx + 4] = r; this.lineColors[colorIdx + 5] = g; this.lineColors[colorIdx + 6] = b; this.lineColors[colorIdx + 7] = a;
          vertexCount += 2;
        }
      }
    }
    
    for (let col = 0; col <= gridCols; col += stepX) {
      for (let row = 0; row < gridRows; row += stepY) {
        const p1 = warpedPoints.get(`${col},${row}`);
        const p2 = warpedPoints.get(`${col},${row + stepY}`);
        if (p1 && p2 && vertexCount < this.maxLineVertices - 2) {
          const baseIdx = vertexCount * 2;
          const colorIdx = vertexCount * 4;
          this.linePositions[baseIdx] = p1.x;
          this.linePositions[baseIdx + 1] = p1.y;
          this.linePositions[baseIdx + 2] = p2.x;
          this.linePositions[baseIdx + 3] = p2.y;
          this.lineColors[colorIdx] = r; this.lineColors[colorIdx + 1] = g; this.lineColors[colorIdx + 2] = b; this.lineColors[colorIdx + 3] = a;
          this.lineColors[colorIdx + 4] = r; this.lineColors[colorIdx + 5] = g; this.lineColors[colorIdx + 6] = b; this.lineColors[colorIdx + 7] = a;
          vertexCount += 2;
        }
      }
    }
    
    if (vertexCount === 0) return;
    
    gl.useProgram(this.lineProgram);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.linePositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.linePositions.subarray(0, vertexCount * 2), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(this.lineAttribs.position);
    gl.vertexAttribPointer(this.lineAttribs.position, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.lineColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.lineColors.subarray(0, vertexCount * 4), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(this.lineAttribs.color);
    gl.vertexAttribPointer(this.lineAttribs.color, 4, gl.FLOAT, false, 0, 0);
    gl.uniformMatrix4fv(this.lineUniforms.projection, false, this.projectionMatrix);
    gl.uniformMatrix4fv(this.lineUniforms.view, false, this.viewMatrix);
    gl.drawArrays(gl.LINES, 0, vertexCount);
  }
  
  drawFieldVectors(bodies, viewBounds, options = {}) {
    if (bodies.length === 0) return;
    
    const gl = this.gl;
    const { opacity = this.settings.vectorOpacity } = options;
    
    const spacing = this.settings.vectorSpacing / this.currentZoom;
    const baseArrowLength = spacing * 0.55;
    const baseHeadSize = spacing * 0.12;
    
    const margin = spacing;
    const minX = Math.floor((viewBounds.minX - margin) / spacing) * spacing;
    const maxX = Math.ceil((viewBounds.maxX + margin) / spacing) * spacing;
    const minY = Math.floor((viewBounds.minY - margin) / spacing) * spacing;
    const maxY = Math.ceil((viewBounds.maxY + margin) / spacing) * spacing;
    
    let vertexCount = 0;
    let minFieldMag = Infinity;
    let maxFieldMag = 0;
    
    const fieldData = [];
    
    for (let y = minY; y <= maxY; y += spacing) {
      for (let x = minX; x <= maxX; x += spacing) {
        let insideBody = false;
        for (const body of bodies) {
          const dx = x - body.x;
          const dy = y - body.y;
          if (dx * dx + dy * dy < body.radius * body.radius * 2.5) {
            insideBody = true;
            break;
          }
        }
        if (insideBody) continue;
        
        const field = this.calculateField(x, y, bodies);
        // Skip vectors with extremely small magnitudes - they're essentially zero
        if (field.magnitude < 0.1) continue;
        
        fieldData.push({ x, y, field });
        if (field.magnitude > maxFieldMag) maxFieldMag = field.magnitude;
        if (field.magnitude < minFieldMag) minFieldMag = field.magnitude;
      }
    }
    
    if (fieldData.length === 0) return;
    if (maxFieldMag < 0.1) maxFieldMag = 1;
    if (minFieldMag < 0.1) minFieldMag = 0.1;
    
    const logMin = Math.log(minFieldMag);
    const logMax = Math.log(maxFieldMag);
    const logRange = logMax - logMin;
    
    for (const { x, y, field } of fieldData) {
      const logMag = Math.log(field.magnitude);
      const t = logRange > 0.001 ? (logMag - logMin) / logRange : 0.5;
      const normalizedT = Math.max(0, Math.min(1, t));
      
      const scale = 0.3 + normalizedT * 0.7;
      const length = baseArrowLength * scale;
      const headSize = baseHeadSize * scale;
      
      const dirX = field.ax / field.magnitude;
      const dirY = field.ay / field.magnitude;
      const endX = x + dirX * length;
      const endY = y + dirY * length;
      
      const color = this._vectorColor(normalizedT);
      const a = opacity * (0.7 + normalizedT * 0.3);
      
      if (vertexCount < this.maxLineVertices - 6) {
        const baseIdx = vertexCount * 2;
        const colorIdx = vertexCount * 4;
        
        this.linePositions[baseIdx] = x;
        this.linePositions[baseIdx + 1] = y;
        this.linePositions[baseIdx + 2] = endX;
        this.linePositions[baseIdx + 3] = endY;
        
        const headAngle1 = Math.atan2(dirY, dirX) + Math.PI * 0.75;
        const headAngle2 = Math.atan2(dirY, dirX) - Math.PI * 0.75;
        
        this.linePositions[baseIdx + 4] = endX;
        this.linePositions[baseIdx + 5] = endY;
        this.linePositions[baseIdx + 6] = endX + Math.cos(headAngle1) * headSize;
        this.linePositions[baseIdx + 7] = endY + Math.sin(headAngle1) * headSize;
        
        this.linePositions[baseIdx + 8] = endX;
        this.linePositions[baseIdx + 9] = endY;
        this.linePositions[baseIdx + 10] = endX + Math.cos(headAngle2) * headSize;
        this.linePositions[baseIdx + 11] = endY + Math.sin(headAngle2) * headSize;
        
        for (let i = 0; i < 6; i++) {
          this.lineColors[colorIdx + i * 4] = color.r;
          this.lineColors[colorIdx + i * 4 + 1] = color.g;
          this.lineColors[colorIdx + i * 4 + 2] = color.b;
          this.lineColors[colorIdx + i * 4 + 3] = a;
        }
        
        vertexCount += 6;
      }
    }
    
    if (vertexCount === 0) return;
    
    gl.useProgram(this.lineProgram);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.linePositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.linePositions.subarray(0, vertexCount * 2), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(this.lineAttribs.position);
    gl.vertexAttribPointer(this.lineAttribs.position, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.lineColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.lineColors.subarray(0, vertexCount * 4), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(this.lineAttribs.color);
    gl.vertexAttribPointer(this.lineAttribs.color, 4, gl.FLOAT, false, 0, 0);
    gl.uniformMatrix4fv(this.lineUniforms.projection, false, this.projectionMatrix);
    gl.uniformMatrix4fv(this.lineUniforms.view, false, this.viewMatrix);
    gl.drawArrays(gl.LINES, 0, vertexCount);
  }
  
  _vectorColor(t) {
    t = Math.max(0, Math.min(1, t));
    if (t < 0.2) {
      const s = t / 0.2;
      return { r: 0.1, g: 0.2 + s * 0.4, b: 0.8 + s * 0.2 };
    } else if (t < 0.4) {
      const s = (t - 0.2) / 0.2;
      return { r: 0.1 + s * 0.2, g: 0.6 + s * 0.3, b: 1.0 - s * 0.3 };
    } else if (t < 0.6) {
      const s = (t - 0.4) / 0.2;
      return { r: 0.3 + s * 0.4, g: 0.9 - s * 0.1, b: 0.7 - s * 0.5 };
    } else if (t < 0.8) {
      const s = (t - 0.6) / 0.2;
      return { r: 0.7 + s * 0.3, g: 0.8 - s * 0.3, b: 0.2 - s * 0.1 };
    } else {
      const s = (t - 0.8) / 0.2;
      return { r: 1.0, g: 0.5 - s * 0.3, b: 0.1 };
    }
  }
  
  drawHeatmap(bodies, viewBounds, options = {}) {
    if (bodies.length === 0) return;
    
    const gl = this.gl;
    const { opacity = this.settings.heatmapOpacity } = options;
    
    const size = this.heatmapTextureSize;
    const width = viewBounds.maxX - viewBounds.minX;
    const height = viewBounds.maxY - viewBounds.minY;
    const startX = viewBounds.minX;
    const startY = viewBounds.minY;
    
    let minPotential = 0;
    let maxPotential = -Infinity;
    const potentials = new Float32Array(size * size);
    
    for (let j = 0; j < size; j++) {
      for (let i = 0; i < size; i++) {
        const x = startX + (i / (size - 1)) * width;
        const y = startY + (j / (size - 1)) * height;
        const potential = this.calculatePotential(x, y, bodies);
        potentials[j * size + i] = potential;
        if (potential > maxPotential) maxPotential = potential;
        if (potential < minPotential) minPotential = potential;
      }
    }
    
    let refMinPotential = 0;
    for (const body of bodies) {
      const surfacePotential = -this.G * body.weight / (body.radius * 0.5);
      if (surfacePotential < refMinPotential) refMinPotential = surfacePotential;
    }
    minPotential = Math.min(minPotential, refMinPotential * 0.8);
    
    for (let j = 0; j < size; j++) {
      for (let i = 0; i < size; i++) {
        const potential = potentials[j * size + i];
        const idx = (j * size + i) * 4;
        
        const safeMinPot = Math.min(minPotential, -1);
        const safeMaxPot = Math.max(maxPotential, safeMinPot + 0.1);
        
        const logPot = -Math.log(-potential + 1);
        const logMin = -Math.log(-safeMinPot + 1);
        const logMax = -Math.log(-safeMaxPot + 1);
        
        let t = 0;
        const logRange = logMax - logMin;
        if (Math.abs(logRange) > 0.0001) t = (logPot - logMin) / logRange;
        t = Math.max(0, Math.min(1, t));
        
        const color = this._heatmapColor(t);
        this.heatmapData[idx] = Math.floor(color.r * 255);
        this.heatmapData[idx + 1] = Math.floor(color.g * 255);
        this.heatmapData[idx + 2] = Math.floor(color.b * 255);
        this.heatmapData[idx + 3] = Math.floor(color.a * 255);
      }
    }
    
    gl.bindTexture(gl.TEXTURE_2D, this.heatmapTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, this.heatmapData);
    
    const positions = new Float32Array([
      startX, startY, startX + width, startY, startX, startY + height, startX + width, startY + height
    ]);
    const texCoords = new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]);
    
    gl.useProgram(this.heatmapProgram);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.heatmapPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(this.heatmapAttribs.position);
    gl.vertexAttribPointer(this.heatmapAttribs.position, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.heatmapTexCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(this.heatmapAttribs.texCoord);
    gl.vertexAttribPointer(this.heatmapAttribs.texCoord, 2, gl.FLOAT, false, 0, 0);
    gl.uniformMatrix4fv(this.heatmapUniforms.projection, false, this.projectionMatrix);
    gl.uniformMatrix4fv(this.heatmapUniforms.view, false, this.viewMatrix);
    gl.uniform1i(this.heatmapUniforms.texture, 0);
    gl.uniform1f(this.heatmapUniforms.opacity, opacity);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.heatmapTexture);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  
  _heatmapColor(t) {
    t = Math.max(0, Math.min(1, t));
    const stops = [
      { t: 0.0, r: 0.05, g: 0.0, b: 0.2, a: 0.9 },
      { t: 0.15, r: 0.1, g: 0.1, b: 0.6, a: 0.85 },
      { t: 0.3, r: 0.0, g: 0.5, b: 0.8, a: 0.8 },
      { t: 0.45, r: 0.0, g: 0.7, b: 0.3, a: 0.75 },
      { t: 0.6, r: 0.5, g: 0.8, b: 0.0, a: 0.7 },
      { t: 0.75, r: 0.9, g: 0.7, b: 0.0, a: 0.75 },
      { t: 0.9, r: 1.0, g: 0.3, b: 0.0, a: 0.8 },
      { t: 1.0, r: 1.0, g: 0.0, b: 0.0, a: 0.9 }
    ];
    let lower = stops[0];
    let upper = stops[stops.length - 1];
    for (let i = 0; i < stops.length - 1; i++) {
      if (t >= stops[i].t && t <= stops[i + 1].t) {
        lower = stops[i];
        upper = stops[i + 1];
        break;
      }
    }
    const range = upper.t - lower.t;
    const localT = range > 0 ? (t - lower.t) / range : 0;
    return {
      r: lower.r + (upper.r - lower.r) * localT,
      g: lower.g + (upper.g - lower.g) * localT,
      b: lower.b + (upper.b - lower.b) * localT,
      a: lower.a + (upper.a - lower.a) * localT
    };
  }
  
  drawContours(bodies, viewBounds, options = {}) {
    if (bodies.length === 0) return;
    
    const gl = this.gl;
    const { opacity = this.settings.contourOpacity } = options;
    
    // Grid resolution for contour calculation
    const gridSize = 128;
    const width = viewBounds.maxX - viewBounds.minX;
    const height = viewBounds.maxY - viewBounds.minY;
    const cellWidth = width / (gridSize - 1);
    const cellHeight = height / (gridSize - 1);
    
    // Calculate potential field on grid
    const potentials = new Float32Array(gridSize * gridSize);
    
    for (let j = 0; j < gridSize; j++) {
      for (let i = 0; i < gridSize; i++) {
        const x = viewBounds.minX + (i / (gridSize - 1)) * width;
        const y = viewBounds.minY + (j / (gridSize - 1)) * height;
        const potential = this.calculatePotential(x, y, bodies);
        potentials[j * gridSize + i] = potential;
      }
    }
    
    // Calculate STABLE contour levels based on body properties (not view)
    // This prevents flickering when zooming
    const numLevels = this.settings.contourLevels;
    const levels = [];
    
    // Find the strongest potential (closest to bodies) and a reference far potential
    // based on actual body properties
    let totalMass = 0;
    let maxBodyPotential = 0;
    
    for (const body of bodies) {
      totalMass += body.weight;
      // Potential at body surface
      const surfacePotential = this.G * body.weight / (body.radius * 0.5);
      if (surfacePotential > maxBodyPotential) {
        maxBodyPotential = surfacePotential;
      }
    }
    
    // Create fixed logarithmic levels based on body properties
    // These don't change with zoom, only with body configuration
    const minPotentialRef = -maxBodyPotential * 1.5; // Near bodies
    const maxPotentialRef = -this.G * totalMass / 10000; // Far from bodies (reference distance)
    
    const logMin = Math.log(-minPotentialRef + 1);
    const logMax = Math.log(-maxPotentialRef + 1);
    
    for (let i = 1; i < numLevels; i++) {
      const t = i / numLevels;
      const logVal = logMin + (logMax - logMin) * t;
      const level = -(Math.exp(logVal) - 1);
      levels.push(level);
    }
    
    let vertexCount = 0;
    
    // Marching squares for each contour level
    for (let levelIdx = 0; levelIdx < levels.length; levelIdx++) {
      const level = levels[levelIdx];
      const t = levelIdx / (levels.length - 1);
      const color = this._contourColor(t);
      
      // Process each cell in the grid
      for (let j = 0; j < gridSize - 1; j++) {
        for (let i = 0; i < gridSize - 1; i++) {
          // Get corner potentials
          const p00 = potentials[j * gridSize + i];
          const p10 = potentials[j * gridSize + i + 1];
          const p01 = potentials[(j + 1) * gridSize + i];
          const p11 = potentials[(j + 1) * gridSize + i + 1];
          
          // Calculate marching squares case
          let caseIndex = 0;
          if (p00 >= level) caseIndex |= 1;
          if (p10 >= level) caseIndex |= 2;
          if (p11 >= level) caseIndex |= 4;
          if (p01 >= level) caseIndex |= 8;
          
          // Skip if all corners are same side of contour
          if (caseIndex === 0 || caseIndex === 15) continue;
          
          // Cell world coordinates
          const x0 = viewBounds.minX + i * cellWidth;
          const y0 = viewBounds.minY + j * cellHeight;
          const x1 = x0 + cellWidth;
          const y1 = y0 + cellHeight;
          
          // Interpolation helper
          const lerp = (v0, v1, p0, p1) => {
            if (Math.abs(p1 - p0) < 0.0001) return 0.5;
            return (level - p0) / (p1 - p0);
          };
          
          // Edge midpoints with interpolation
          const bottom = { x: x0 + lerp(x0, x1, p00, p10) * cellWidth, y: y0 };
          const top = { x: x0 + lerp(x0, x1, p01, p11) * cellWidth, y: y1 };
          const left = { x: x0, y: y0 + lerp(y0, y1, p00, p01) * cellHeight };
          const right = { x: x1, y: y0 + lerp(y0, y1, p10, p11) * cellHeight };
          
          // Draw line segments based on case
          const segments = this._getMarchingSquaresSegments(caseIndex, bottom, right, top, left);
          
          for (const seg of segments) {
            if (vertexCount >= this.maxLineVertices - 2) break;
            
            const baseIdx = vertexCount * 2;
            const colorIdx = vertexCount * 4;
            
            this.linePositions[baseIdx] = seg.x1;
            this.linePositions[baseIdx + 1] = seg.y1;
            this.linePositions[baseIdx + 2] = seg.x2;
            this.linePositions[baseIdx + 3] = seg.y2;
            
            this.lineColors[colorIdx] = color.r;
            this.lineColors[colorIdx + 1] = color.g;
            this.lineColors[colorIdx + 2] = color.b;
            this.lineColors[colorIdx + 3] = opacity * color.a;
            this.lineColors[colorIdx + 4] = color.r;
            this.lineColors[colorIdx + 5] = color.g;
            this.lineColors[colorIdx + 6] = color.b;
            this.lineColors[colorIdx + 7] = opacity * color.a;
            
            vertexCount += 2;
          }
        }
      }
    }
    
    if (vertexCount === 0) return;
    
    gl.useProgram(this.lineProgram);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
    // Set line width for thicker contours (may not work on all platforms)
    const lineWidth = this.settings.contourLineWidth || 2.0;
    gl.lineWidth(lineWidth);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.linePositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.linePositions.subarray(0, vertexCount * 2), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(this.lineAttribs.position);
    gl.vertexAttribPointer(this.lineAttribs.position, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.lineColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.lineColors.subarray(0, vertexCount * 4), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(this.lineAttribs.color);
    gl.vertexAttribPointer(this.lineAttribs.color, 4, gl.FLOAT, false, 0, 0);
    gl.uniformMatrix4fv(this.lineUniforms.projection, false, this.projectionMatrix);
    gl.uniformMatrix4fv(this.lineUniforms.view, false, this.viewMatrix);
    gl.drawArrays(gl.LINES, 0, vertexCount);
    
    // Reset line width to default
    gl.lineWidth(1.0);
  }
  
  _getMarchingSquaresSegments(caseIndex, bottom, right, top, left) {
    // Returns line segments for each marching squares case
    const segments = [];
    
    switch (caseIndex) {
      case 1: case 14:
        segments.push({ x1: bottom.x, y1: bottom.y, x2: left.x, y2: left.y });
        break;
      case 2: case 13:
        segments.push({ x1: bottom.x, y1: bottom.y, x2: right.x, y2: right.y });
        break;
      case 3: case 12:
        segments.push({ x1: left.x, y1: left.y, x2: right.x, y2: right.y });
        break;
      case 4: case 11:
        segments.push({ x1: right.x, y1: right.y, x2: top.x, y2: top.y });
        break;
      case 5:
        segments.push({ x1: bottom.x, y1: bottom.y, x2: right.x, y2: right.y });
        segments.push({ x1: left.x, y1: left.y, x2: top.x, y2: top.y });
        break;
      case 6: case 9:
        segments.push({ x1: bottom.x, y1: bottom.y, x2: top.x, y2: top.y });
        break;
      case 7: case 8:
        segments.push({ x1: left.x, y1: left.y, x2: top.x, y2: top.y });
        break;
      case 10:
        segments.push({ x1: bottom.x, y1: bottom.y, x2: left.x, y2: left.y });
        segments.push({ x1: right.x, y1: right.y, x2: top.x, y2: top.y });
        break;
    }
    
    return segments;
  }
  
  _contourColor(t) {
    // Color gradient from cyan (far) to magenta (near body)
    t = Math.max(0, Math.min(1, t));
    
    if (t < 0.33) {
      // Cyan to green
      const s = t / 0.33;
      return { r: 0.0, g: 0.8 + s * 0.2, b: 1.0 - s * 0.5, a: 0.6 + s * 0.2 };
    } else if (t < 0.66) {
      // Green to yellow
      const s = (t - 0.33) / 0.33;
      return { r: s * 1.0, g: 1.0, b: 0.5 - s * 0.5, a: 0.8 };
    } else {
      // Yellow to magenta/pink
      const s = (t - 0.66) / 0.34;
      return { r: 1.0, g: 1.0 - s * 0.6, b: s * 0.8, a: 0.8 + s * 0.2 };
    }
  }
  
  updateSettings(newSettings) {
    Object.assign(this.settings, newSettings);
  }
}

export { GravityFieldRenderer };
