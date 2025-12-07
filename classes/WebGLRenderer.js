/**
 * WebGL2 Renderer for celestial bodies using instanced rendering.
 * Draws ALL bodies in a single draw call for maximum performance.
 */
class WebGLRenderer {
  /**
   * Creates a WebGL renderer
   * @param {HTMLCanvasElement} canvas - The canvas element to render to
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl2', { 
      antialias: true, 
      alpha: true,
      premultipliedAlpha: false 
    });
    
    if (!this.gl) {
      console.warn('WebGL2 not supported, falling back to WebGL1');
      this.gl = canvas.getContext('webgl', { 
        antialias: true, 
        alpha: true,
        premultipliedAlpha: false 
      });
      this.isWebGL2 = false;
    } else {
      this.isWebGL2 = true;
    }
    
    if (!this.gl) {
      throw new Error('WebGL not supported');
    }
    
    this.gl.enable(this.gl.BLEND);
    this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA);
    
    // Maximum instances we can render at once
    this.maxInstances = 10000;
    
    // Typed arrays for instance data (reused each frame)
    this.instancePositions = new Float32Array(this.maxInstances * 2);
    this.instanceColors = new Float32Array(this.maxInstances * 4);
    this.instanceRadii = new Float32Array(this.maxInstances);
    this.instanceGlowIntensities = new Float32Array(this.maxInstances);
    this.instanceGlowColors = new Float32Array(this.maxInstances * 4);
    
    // Trail rendering - max vertices for all trails combined
    // Each line segment = 6 vertices (2 triangles forming a quad)
    this.maxTrailVertices = 600000; // ~100k line segments
    this.trailPositions = new Float32Array(this.maxTrailVertices * 2);
    this.trailColors = new Float32Array(this.maxTrailVertices * 4);
    
    // Initialize shaders and buffers
    this._initShaders();
    this._initBuffers();
    
    // Transformation matrices
    this.projectionMatrix = new Float32Array(16);
    this.viewMatrix = new Float32Array(16);
    
    // Initialize projection matrix with current canvas size
    this._updateProjectionMatrix();
    
    // Set initial viewport
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }
  
  /**
   * Initialize WebGL shaders for instanced rendering
   */
  _initShaders() {
    const gl = this.gl;
    
    // Instanced vertex shader - processes per-instance data
    const instancedVertexShaderSource = this.isWebGL2 ? `#version 300 es
      in vec2 a_position;
      in vec2 a_texCoord;
      
      // Per-instance attributes
      in vec2 a_instancePosition;
      in vec4 a_instanceColor;
      in float a_instanceRadius;
      in float a_instanceGlowIntensity;
      in vec4 a_instanceGlowColor;
      
      uniform mat4 u_projection;
      uniform mat4 u_view;
      
      out vec2 v_texCoord;
      out vec4 v_color;
      out float v_glowIntensity;
      out vec4 v_glowColor;
      out float v_bodyRadiusRatio; // Ratio of body radius to expanded radius
      
      void main() {
        // Expand radius to include glow
        float expandedRadius = a_instanceGlowIntensity > 0.0 ? 
          a_instanceRadius * (1.0 + a_instanceGlowIntensity) : a_instanceRadius;
        
        vec2 scaledPos = a_position * expandedRadius;
        vec2 worldPos = scaledPos + a_instancePosition;
        gl_Position = u_projection * u_view * vec4(worldPos, 0.0, 1.0);
        
        v_texCoord = a_texCoord;
        v_color = a_instanceColor;
        v_glowIntensity = a_instanceGlowIntensity;
        v_glowColor = a_instanceGlowColor;
        // Calculate the ratio: where does the body end within the expanded quad
        v_bodyRadiusRatio = a_instanceGlowIntensity > 0.0 ? 
          1.0 / (1.0 + a_instanceGlowIntensity) : 1.0;
      }
    ` : `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      
      uniform mat4 u_projection;
      uniform mat4 u_view;
      uniform vec2 u_translation;
      uniform float u_radius;
      uniform float u_glowIntensity;
      
      varying vec2 v_texCoord;
      varying float v_bodyRadiusRatio;
      
      void main() {
        float expandedRadius = u_glowIntensity > 0.0 ? u_radius * (1.0 + u_glowIntensity) : u_radius;
        vec2 scaledPos = a_position * expandedRadius;
        vec2 worldPos = scaledPos + u_translation;
        gl_Position = u_projection * u_view * vec4(worldPos, 0.0, 1.0);
        v_texCoord = a_texCoord;
        v_bodyRadiusRatio = u_glowIntensity > 0.0 ? 1.0 / (1.0 + u_glowIntensity) : 1.0;
      }
    `;
    
    // Instanced fragment shader
    const instancedFragmentShaderSource = this.isWebGL2 ? `#version 300 es
      precision mediump float;
      
      in vec2 v_texCoord;
      in vec4 v_color;
      in float v_glowIntensity;
      in vec4 v_glowColor;
      in float v_bodyRadiusRatio;
      
      out vec4 fragColor;
      
      void main() {
        vec2 center = vec2(0.5, 0.5);
        float dist = distance(v_texCoord, center) * 2.0;
        
        // Body ends at v_bodyRadiusRatio, glow extends from there to 1.0
        float bodyEdge = v_bodyRadiusRatio;
        
        if (dist > 1.0) {
          // Outside the quad entirely
          discard;
        } else if (dist > bodyEdge) {
          // Glow region (between body edge and quad edge)
          if (v_glowIntensity > 0.0) {
            float glowDist = (dist - bodyEdge) / (1.0 - bodyEdge);
            float glowAlpha = pow(max(0.0, 1.0 - glowDist), 2.0) * v_glowColor.a;
            fragColor = vec4(v_glowColor.rgb, glowAlpha * 0.6);
          } else {
            discard;
          }
        } else {
          // Body region - smooth edge
          float edgeSoftness = 0.02 / bodyEdge;
          float alpha = 1.0 - smoothstep(bodyEdge - edgeSoftness, bodyEdge, dist);
          fragColor = vec4(v_color.rgb, v_color.a * alpha);
        }
      }
    ` : `
      precision mediump float;
      
      uniform vec4 u_color;
      uniform float u_glowIntensity;
      uniform vec4 u_glowColor;
      
      varying vec2 v_texCoord;
      varying float v_bodyRadiusRatio;
      
      void main() {
        vec2 center = vec2(0.5, 0.5);
        float dist = distance(v_texCoord, center) * 2.0;
        
        float bodyEdge = v_bodyRadiusRatio;
        
        if (dist > 1.0) {
          discard;
        } else if (dist > bodyEdge) {
          if (u_glowIntensity > 0.0) {
            float glowDist = (dist - bodyEdge) / (1.0 - bodyEdge);
            float glowAlpha = pow(max(0.0, 1.0 - glowDist), 2.0) * u_glowColor.a;
            gl_FragColor = vec4(u_glowColor.rgb, glowAlpha * 0.6);
          } else {
            discard;
          }
        } else {
          float edgeSoftness = 0.02 / bodyEdge;
          float alpha = 1.0 - smoothstep(bodyEdge - edgeSoftness, bodyEdge, dist);
          gl_FragColor = vec4(u_color.rgb, u_color.a * alpha);
        }
      }
    `;
    
    // Accretion disk shader (still individual for complexity)
    const accretionVertexShaderSource = this.isWebGL2 ? `#version 300 es
      in vec2 a_position;
      in vec2 a_texCoord;
      
      uniform mat4 u_projection;
      uniform mat4 u_view;
      uniform vec2 u_translation;
      uniform float u_radius;
      
      out vec2 v_texCoord;
      
      void main() {
        vec2 scaledPos = a_position * u_radius;
        vec2 worldPos = scaledPos + u_translation;
        gl_Position = u_projection * u_view * vec4(worldPos, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    ` : `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      
      uniform mat4 u_projection;
      uniform mat4 u_view;
      uniform vec2 u_translation;
      uniform float u_radius;
      
      varying vec2 v_texCoord;
      
      void main() {
        vec2 scaledPos = a_position * u_radius;
        vec2 worldPos = scaledPos + u_translation;
        gl_Position = u_projection * u_view * vec4(worldPos, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `;
    
    const accretionFragmentShaderSource = this.isWebGL2 ? `#version 300 es
      precision mediump float;
      
      uniform float u_innerRadius;
      uniform float u_diskHeight;
      uniform int u_isBack;
      
      in vec2 v_texCoord;
      out vec4 fragColor;
      
      void main() {
        vec2 center = vec2(0.5, 0.5);
        vec2 pos = (v_texCoord - center) * 2.0;
        
        float scaledY = pos.y / u_diskHeight;
        float dist = sqrt(pos.x * pos.x + scaledY * scaledY);
        
        if (dist < u_innerRadius || dist > 1.0) {
          discard;
        }
        
        if (u_isBack == 1 && pos.y < 0.0) {
          discard;
        }
        if (u_isBack == 0 && pos.y > 0.0) {
          discard;
        }
        
        float t = (dist - u_innerRadius) / (1.0 - u_innerRadius);
        
        vec4 innerColor = vec4(1.0, 0.55, 0.0, 0.8);
        vec4 midColor1 = vec4(1.0, 0.31, 0.0, 0.6);
        vec4 midColor2 = vec4(0.47, 0.16, 0.0, 0.4);
        vec4 outerColor = vec4(0.24, 0.08, 0.0, 0.1);
        
        vec4 color;
        if (t < 0.3) {
          color = mix(innerColor, midColor1, t / 0.3);
        } else if (t < 0.6) {
          color = mix(midColor1, midColor2, (t - 0.3) / 0.3);
        } else {
          color = mix(midColor2, outerColor, (t - 0.6) / 0.4);
        }
        
        fragColor = vec4(color.rgb, color.a * 0.9);
      }
    ` : `
      precision mediump float;
      
      uniform float u_innerRadius;
      uniform float u_diskHeight;
      uniform int u_isBack;
      
      varying vec2 v_texCoord;
      
      void main() {
        vec2 center = vec2(0.5, 0.5);
        vec2 pos = (v_texCoord - center) * 2.0;
        
        float scaledY = pos.y / u_diskHeight;
        float dist = sqrt(pos.x * pos.x + scaledY * scaledY);
        
        if (dist < u_innerRadius || dist > 1.0) discard;
        if (u_isBack == 1 && pos.y < 0.0) discard;
        if (u_isBack == 0 && pos.y > 0.0) discard;
        
        float t = (dist - u_innerRadius) / (1.0 - u_innerRadius);
        
        vec4 innerColor = vec4(1.0, 0.55, 0.0, 0.8);
        vec4 midColor1 = vec4(1.0, 0.31, 0.0, 0.6);
        vec4 midColor2 = vec4(0.47, 0.16, 0.0, 0.4);
        vec4 outerColor = vec4(0.24, 0.08, 0.0, 0.1);
        
        vec4 color;
        if (t < 0.3) color = mix(innerColor, midColor1, t / 0.3);
        else if (t < 0.6) color = mix(midColor1, midColor2, (t - 0.3) / 0.3);
        else color = mix(midColor2, outerColor, (t - 0.6) / 0.4);
        
        gl_FragColor = vec4(color.rgb, color.a * 0.9);
      }
    `;
    
    // Line shader for trails - simple vertex coloring
    const lineVertexShaderSource = this.isWebGL2 ? `#version 300 es
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
    
    const lineFragmentShaderSource = this.isWebGL2 ? `#version 300 es
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
    
    // Ring shader for strokes and pin indicators
    const ringFragmentShaderSource = this.isWebGL2 ? `#version 300 es
      precision mediump float;
      
      uniform vec4 u_color;
      uniform float u_thickness;
      
      in vec2 v_texCoord;
      out vec4 fragColor;
      
      void main() {
        vec2 center = vec2(0.5, 0.5);
        float dist = distance(v_texCoord, center) * 2.0;
        float innerRadius = 1.0 - u_thickness;
        
        if (dist > 1.0 || dist < innerRadius) {
          discard;
        }
        
        fragColor = u_color;
      }
    ` : `
      precision mediump float;
      
      uniform vec4 u_color;
      uniform float u_thickness;
      
      varying vec2 v_texCoord;
      
      void main() {
        vec2 center = vec2(0.5, 0.5);
        float dist = distance(v_texCoord, center) * 2.0;
        float innerRadius = 1.0 - u_thickness;
        
        if (dist > 1.0 || dist < innerRadius) discard;
        gl_FragColor = u_color;
      }
    `;
    
    // Compile programs
    this.instancedProgram = this._createProgram(gl, instancedVertexShaderSource, instancedFragmentShaderSource);
    this.accretionProgram = this._createProgram(gl, accretionVertexShaderSource, accretionFragmentShaderSource);
    this.ringProgram = this._createProgram(gl, accretionVertexShaderSource, ringFragmentShaderSource);
    this.lineProgram = this._createProgram(gl, lineVertexShaderSource, lineFragmentShaderSource);
    
    // Get locations for instanced program
    if (this.isWebGL2) {
      this.instancedAttribLocations = {
        position: gl.getAttribLocation(this.instancedProgram, 'a_position'),
        texCoord: gl.getAttribLocation(this.instancedProgram, 'a_texCoord'),
        instancePosition: gl.getAttribLocation(this.instancedProgram, 'a_instancePosition'),
        instanceColor: gl.getAttribLocation(this.instancedProgram, 'a_instanceColor'),
        instanceRadius: gl.getAttribLocation(this.instancedProgram, 'a_instanceRadius'),
        instanceGlowIntensity: gl.getAttribLocation(this.instancedProgram, 'a_instanceGlowIntensity'),
        instanceGlowColor: gl.getAttribLocation(this.instancedProgram, 'a_instanceGlowColor')
      };
    } else {
      this.instancedAttribLocations = {
        position: gl.getAttribLocation(this.instancedProgram, 'a_position'),
        texCoord: gl.getAttribLocation(this.instancedProgram, 'a_texCoord')
      };
    }
    
    this.instancedUniformLocations = {
      projection: gl.getUniformLocation(this.instancedProgram, 'u_projection'),
      view: gl.getUniformLocation(this.instancedProgram, 'u_view'),
      // For WebGL1 fallback
      translation: gl.getUniformLocation(this.instancedProgram, 'u_translation'),
      radius: gl.getUniformLocation(this.instancedProgram, 'u_radius'),
      color: gl.getUniformLocation(this.instancedProgram, 'u_color'),
      glowIntensity: gl.getUniformLocation(this.instancedProgram, 'u_glowIntensity'),
      glowColor: gl.getUniformLocation(this.instancedProgram, 'u_glowColor')
    };
    
    // Accretion program locations
    this.accretionAttribLocations = {
      position: gl.getAttribLocation(this.accretionProgram, 'a_position'),
      texCoord: gl.getAttribLocation(this.accretionProgram, 'a_texCoord')
    };
    this.accretionUniformLocations = {
      projection: gl.getUniformLocation(this.accretionProgram, 'u_projection'),
      view: gl.getUniformLocation(this.accretionProgram, 'u_view'),
      translation: gl.getUniformLocation(this.accretionProgram, 'u_translation'),
      radius: gl.getUniformLocation(this.accretionProgram, 'u_radius'),
      innerRadius: gl.getUniformLocation(this.accretionProgram, 'u_innerRadius'),
      diskHeight: gl.getUniformLocation(this.accretionProgram, 'u_diskHeight'),
      isBack: gl.getUniformLocation(this.accretionProgram, 'u_isBack')
    };
    
    // Ring program locations
    this.ringAttribLocations = {
      position: gl.getAttribLocation(this.ringProgram, 'a_position'),
      texCoord: gl.getAttribLocation(this.ringProgram, 'a_texCoord')
    };
    this.ringUniformLocations = {
      projection: gl.getUniformLocation(this.ringProgram, 'u_projection'),
      view: gl.getUniformLocation(this.ringProgram, 'u_view'),
      translation: gl.getUniformLocation(this.ringProgram, 'u_translation'),
      radius: gl.getUniformLocation(this.ringProgram, 'u_radius'),
      color: gl.getUniformLocation(this.ringProgram, 'u_color'),
      thickness: gl.getUniformLocation(this.ringProgram, 'u_thickness')
    };
    
    // Line program locations (for trails)
    this.lineAttribLocations = {
      position: gl.getAttribLocation(this.lineProgram, 'a_position'),
      color: gl.getAttribLocation(this.lineProgram, 'a_color')
    };
    this.lineUniformLocations = {
      projection: gl.getUniformLocation(this.lineProgram, 'u_projection'),
      view: gl.getUniformLocation(this.lineProgram, 'u_view')
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
    
    // Quad geometry for all circles
    const quadPositions = new Float32Array([
      -1, -1, 1, -1, -1, 1, 1, 1
    ]);
    const quadTexCoords = new Float32Array([
      0, 0, 1, 0, 0, 1, 1, 1
    ]);
    
    this.quadPositionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, quadPositions, gl.STATIC_DRAW);
    
    this.quadTexCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadTexCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, quadTexCoords, gl.STATIC_DRAW);
    
    // Instance data buffers (for WebGL2 instancing)
    if (this.isWebGL2) {
      this.instancePositionBuffer = gl.createBuffer();
      this.instanceColorBuffer = gl.createBuffer();
      this.instanceRadiusBuffer = gl.createBuffer();
      this.instanceGlowIntensityBuffer = gl.createBuffer();
      this.instanceGlowColorBuffer = gl.createBuffer();
    }
    
    // Trail line buffers
    this.trailPositionBuffer = gl.createBuffer();
    this.trailColorBuffer = gl.createBuffer();
  }
  
  resize(width, height) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.gl.viewport(0, 0, width, height);
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
  
  clear() {
    const gl = this.gl;
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
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
  }
  
  _parseColor(colorStr) {
    const match = colorStr.match(/rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/);
    if (match) {
      return [
        parseFloat(match[1]) / 255,
        parseFloat(match[2]) / 255,
        parseFloat(match[3]) / 255,
        match[4] ? parseFloat(match[4]) : 1.0
      ];
    }
    return [1, 1, 1, 1];
  }
  
  /**
   * Draw all celestial bodies in a single batched draw call (WebGL2)
   * or multiple optimized calls (WebGL1 fallback)
   * @param {Array} bodies - Array of celestial body objects
   * @param {Object} options - Rendering options
   */
  drawAllBodies(bodies, options = {}) {
    if (bodies.length === 0) return;
    
    const { followedBodyIndex = -1, zoomFactor = 1 } = options;
    const gl = this.gl;
    
    // Separate bodies by type for proper layering
    const blackHoles = [];
    const regularBodies = [];
    
    for (let i = 0; i < bodies.length; i++) {
      const body = bodies[i];
      if (body.bodyType === 'blackHole') {
        blackHoles.push({ body, index: i });
      } else {
        regularBodies.push({ body, index: i });
      }
    }
    
    // Draw accretion disk backs first (behind everything)
    for (const { body } of blackHoles) {
      this._drawAccretionDisk(body.x, body.y, body.radius, false);
    }
    
    // Draw all regular bodies in one batch
    if (this.isWebGL2) {
      this._drawBodiesBatchedWebGL2(regularBodies, followedBodyIndex, zoomFactor);
      this._drawBodiesBatchedWebGL2(blackHoles, followedBodyIndex, zoomFactor);
    } else {
      this._drawBodiesFallback(regularBodies, followedBodyIndex, zoomFactor);
      this._drawBodiesFallback(blackHoles, followedBodyIndex, zoomFactor);
    }
    
    // Draw accretion disk fronts last (in front of black holes)
    for (const { body } of blackHoles) {
      this._drawAccretionDisk(body.x, body.y, body.radius, true);
    }
    
    // Draw pin indicators for pinned bodies
    for (let i = 0; i < bodies.length; i++) {
      const body = bodies[i];
      if (body.isPinned) {
        this._drawPinIndicator(body, zoomFactor);
      }
    }
  }
  
  /**
   * Batched rendering using WebGL2 instancing - draws ALL bodies in ONE draw call
   */
  _drawBodiesBatchedWebGL2(bodyData, followedBodyIndex, zoomFactor) {
    if (bodyData.length === 0) return;
    
    const gl = this.gl;
    const count = Math.min(bodyData.length, this.maxInstances);
    
    // Fill instance arrays
    for (let i = 0; i < count; i++) {
      const { body, index } = bodyData[i];
      const isFollowed = index === followedBodyIndex;
      
      // Position
      this.instancePositions[i * 2] = body.x;
      this.instancePositions[i * 2 + 1] = body.y;
      
      // Color
      const color = this._parseColor(body.color);
      this.instanceColors[i * 4] = color[0];
      this.instanceColors[i * 4 + 1] = color[1];
      this.instanceColors[i * 4 + 2] = color[2];
      this.instanceColors[i * 4 + 3] = color[3];
      
      // Radius
      this.instanceRadii[i] = body.radius;
      
      // Glow settings
      let glowIntensity = 0;
      let glowColor = [1, 1, 1, 0.8];
      
      if (isFollowed) {
        glowIntensity = 0.5 / zoomFactor;
        glowColor = [1, 1, 1, 0.8];
      } else if (body.bodyType === 'star') {
        glowIntensity = 2.5 / zoomFactor;
        glowColor = this._parseColor(body.color.replace('1)', '0.9)'));
      }
      
      this.instanceGlowIntensities[i] = glowIntensity;
      this.instanceGlowColors[i * 4] = glowColor[0];
      this.instanceGlowColors[i * 4 + 1] = glowColor[1];
      this.instanceGlowColors[i * 4 + 2] = glowColor[2];
      this.instanceGlowColors[i * 4 + 3] = glowColor[3];
    }
    
    // Use instanced program
    gl.useProgram(this.instancedProgram);
    
    // Set up static quad attributes
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadPositionBuffer);
    gl.enableVertexAttribArray(this.instancedAttribLocations.position);
    gl.vertexAttribPointer(this.instancedAttribLocations.position, 2, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadTexCoordBuffer);
    gl.enableVertexAttribArray(this.instancedAttribLocations.texCoord);
    gl.vertexAttribPointer(this.instancedAttribLocations.texCoord, 2, gl.FLOAT, false, 0, 0);
    
    // Upload and bind instance position data
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instancePositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.instancePositions.subarray(0, count * 2), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(this.instancedAttribLocations.instancePosition);
    gl.vertexAttribPointer(this.instancedAttribLocations.instancePosition, 2, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(this.instancedAttribLocations.instancePosition, 1);
    
    // Upload and bind instance color data
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.instanceColors.subarray(0, count * 4), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(this.instancedAttribLocations.instanceColor);
    gl.vertexAttribPointer(this.instancedAttribLocations.instanceColor, 4, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(this.instancedAttribLocations.instanceColor, 1);
    
    // Upload and bind instance radius data
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceRadiusBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.instanceRadii.subarray(0, count), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(this.instancedAttribLocations.instanceRadius);
    gl.vertexAttribPointer(this.instancedAttribLocations.instanceRadius, 1, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(this.instancedAttribLocations.instanceRadius, 1);
    
    // Upload and bind instance glow intensity data
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceGlowIntensityBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.instanceGlowIntensities.subarray(0, count), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(this.instancedAttribLocations.instanceGlowIntensity);
    gl.vertexAttribPointer(this.instancedAttribLocations.instanceGlowIntensity, 1, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(this.instancedAttribLocations.instanceGlowIntensity, 1);
    
    // Upload and bind instance glow color data
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceGlowColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.instanceGlowColors.subarray(0, count * 4), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(this.instancedAttribLocations.instanceGlowColor);
    gl.vertexAttribPointer(this.instancedAttribLocations.instanceGlowColor, 4, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(this.instancedAttribLocations.instanceGlowColor, 1);
    
    // Set uniforms
    gl.uniformMatrix4fv(this.instancedUniformLocations.projection, false, this.projectionMatrix);
    gl.uniformMatrix4fv(this.instancedUniformLocations.view, false, this.viewMatrix);
    
    // Draw ALL bodies in ONE call!
    gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count);
    
    // Reset divisors
    gl.vertexAttribDivisor(this.instancedAttribLocations.instancePosition, 0);
    gl.vertexAttribDivisor(this.instancedAttribLocations.instanceColor, 0);
    gl.vertexAttribDivisor(this.instancedAttribLocations.instanceRadius, 0);
    gl.vertexAttribDivisor(this.instancedAttribLocations.instanceGlowIntensity, 0);
    gl.vertexAttribDivisor(this.instancedAttribLocations.instanceGlowColor, 0);
  }
  
  /**
   * WebGL1 fallback - individual draw calls (still optimized)
   */
  _drawBodiesFallback(bodyData, followedBodyIndex, zoomFactor) {
    const gl = this.gl;
    
    gl.useProgram(this.instancedProgram);
    
    // Set up quad attributes once
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadPositionBuffer);
    gl.enableVertexAttribArray(this.instancedAttribLocations.position);
    gl.vertexAttribPointer(this.instancedAttribLocations.position, 2, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadTexCoordBuffer);
    gl.enableVertexAttribArray(this.instancedAttribLocations.texCoord);
    gl.vertexAttribPointer(this.instancedAttribLocations.texCoord, 2, gl.FLOAT, false, 0, 0);
    
    // Set uniforms once
    gl.uniformMatrix4fv(this.instancedUniformLocations.projection, false, this.projectionMatrix);
    gl.uniformMatrix4fv(this.instancedUniformLocations.view, false, this.viewMatrix);
    
    for (const { body, index } of bodyData) {
      const isFollowed = index === followedBodyIndex;
      const color = this._parseColor(body.color);
      
      let glowIntensity = 0;
      let glowColor = [1, 1, 1, 0.8];
      
      if (isFollowed) {
        glowIntensity = 0.5 / zoomFactor;
      } else if (body.bodyType === 'star') {
        glowIntensity = 2.5 / zoomFactor;
        glowColor = this._parseColor(body.color.replace('1)', '0.9)'));
      }
      
      const expandedRadius = glowIntensity > 0 ? body.radius * (1 + glowIntensity) : body.radius;
      
      gl.uniform2f(this.instancedUniformLocations.translation, body.x, body.y);
      gl.uniform1f(this.instancedUniformLocations.radius, expandedRadius);
      gl.uniform4f(this.instancedUniformLocations.color, color[0], color[1], color[2], color[3]);
      gl.uniform1f(this.instancedUniformLocations.glowIntensity, glowIntensity);
      gl.uniform4f(this.instancedUniformLocations.glowColor, glowColor[0], glowColor[1], glowColor[2], glowColor[3]);
      
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
  }
  
  _drawAccretionDisk(x, y, radius, isBack) {
    const gl = this.gl;
    const diskRadius = radius * 8;
    const diskHeightRatio = 0.2;
    
    gl.useProgram(this.accretionProgram);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadPositionBuffer);
    gl.enableVertexAttribArray(this.accretionAttribLocations.position);
    gl.vertexAttribPointer(this.accretionAttribLocations.position, 2, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadTexCoordBuffer);
    gl.enableVertexAttribArray(this.accretionAttribLocations.texCoord);
    gl.vertexAttribPointer(this.accretionAttribLocations.texCoord, 2, gl.FLOAT, false, 0, 0);
    
    gl.uniformMatrix4fv(this.accretionUniformLocations.projection, false, this.projectionMatrix);
    gl.uniformMatrix4fv(this.accretionUniformLocations.view, false, this.viewMatrix);
    gl.uniform2f(this.accretionUniformLocations.translation, x, y);
    gl.uniform1f(this.accretionUniformLocations.radius, diskRadius);
    gl.uniform1f(this.accretionUniformLocations.innerRadius, radius * 1.2 / diskRadius);
    gl.uniform1f(this.accretionUniformLocations.diskHeight, diskHeightRatio);
    gl.uniform1i(this.accretionUniformLocations.isBack, isBack ? 1 : 0);
    
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  
  _drawPinIndicator(body, zoomFactor) {
    const gl = this.gl;
    const x = body.x;
    const y = body.y;
    const radius = body.radius;
    
    gl.useProgram(this.ringProgram);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadPositionBuffer);
    gl.enableVertexAttribArray(this.ringAttribLocations.position);
    gl.vertexAttribPointer(this.ringAttribLocations.position, 2, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadTexCoordBuffer);
    gl.enableVertexAttribArray(this.ringAttribLocations.texCoord);
    gl.vertexAttribPointer(this.ringAttribLocations.texCoord, 2, gl.FLOAT, false, 0, 0);
    
    gl.uniformMatrix4fv(this.ringUniformLocations.projection, false, this.projectionMatrix);
    gl.uniformMatrix4fv(this.ringUniformLocations.view, false, this.viewMatrix);
    
    // Draw pin ring
    gl.uniform2f(this.ringUniformLocations.translation, x, y);
    gl.uniform1f(this.ringUniformLocations.radius, radius * 1.2);
    gl.uniform4f(this.ringUniformLocations.color, 1.0, 1.0, 0.0, 0.8);
    gl.uniform1f(this.ringUniformLocations.thickness, 0.15);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    
    // Draw pin head (small yellow circle)
    const pinHeight = radius * 1.5;
    const pinRadius = radius * 0.3;
    const pinY = y - radius - pinHeight;
    
    // Use instanced program for the pin head circle
    gl.useProgram(this.instancedProgram);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadPositionBuffer);
    gl.enableVertexAttribArray(this.instancedAttribLocations.position);
    gl.vertexAttribPointer(this.instancedAttribLocations.position, 2, gl.FLOAT, false, 0, 0);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadTexCoordBuffer);
    gl.enableVertexAttribArray(this.instancedAttribLocations.texCoord);
    gl.vertexAttribPointer(this.instancedAttribLocations.texCoord, 2, gl.FLOAT, false, 0, 0);
    
    gl.uniformMatrix4fv(this.instancedUniformLocations.projection, false, this.projectionMatrix);
    gl.uniformMatrix4fv(this.instancedUniformLocations.view, false, this.viewMatrix);
    gl.uniform2f(this.instancedUniformLocations.translation, x, pinY);
    gl.uniform1f(this.instancedUniformLocations.radius, pinRadius);
    gl.uniform4f(this.instancedUniformLocations.color, 1.0, 1.0, 0.0, 1.0);
    gl.uniform1f(this.instancedUniformLocations.glowIntensity, 0.0);
    gl.uniform4f(this.instancedUniformLocations.glowColor, 0, 0, 0, 0);
    
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }
  
  // Legacy method for backwards compatibility
  drawCelestialBody(body, options = {}) {
    this.drawAllBodies([body], {
      followedBodyIndex: options.isFollowed ? 0 : -1,
      zoomFactor: options.zoomFactor || 1
    });
  }
  
  /**
   * Draw all trails using WebGL - renders as thick quads for visibility
   * @param {Map} trails - Map of trail data from TrailManager
   * @param {Object} camera - Camera position {x, y}
   * @param {number} zoomFactor - Current zoom level
   * @param {Object} viewBounds - Visible area bounds {minX, minY, maxX, maxY}
   */
  drawTrails(trails, camera, zoomFactor, viewBounds) {
    if (!trails || trails.size === 0) return;
    
    const gl = this.gl;
    
    // Pre-calculate view bounds with margin for culling
    const margin = 100 / zoomFactor;
    const visMinX = viewBounds.minX - margin;
    const visMinY = viewBounds.minY - margin;
    const visMaxX = viewBounds.maxX + margin;
    const visMaxY = viewBounds.maxY + margin;
    
    // Decimation factor based on zoom (skip more points when zoomed out)
    const decimation = Math.max(1, Math.round(1 / Math.max(zoomFactor, 0.01)));
    const maxDecimation = 8;
    const skipFactor = Math.min(decimation, maxDecimation);
    
    // Line thickness in world units (thicker when zoomed out for visibility)
    const lineThickness = Math.max(1.5, 2.0 / zoomFactor);
    
    // Collect all visible trail segments
    const segments = [];
    
    trails.forEach((trail, id) => {
      const positions = trail.positions;
      const total = trail.isFull ? positions.length : trail.head;
      if (total < 4) return;
      
      const startIdx = trail.isFull ? trail.head : 0;
      const color = this._parseColor(trail.color);
      
      let prevX = null, prevY = null;
      let prevInView = false;
      
      for (let i = 0; i < total; i += 2) {
        // Apply decimation
        if (skipFactor > 1 && ((i / 2) % skipFactor) !== 0) continue;
        
        const idx = (startIdx + i) % positions.length;
        const wx = positions[idx];
        const wy = positions[idx + 1];
        
        // View culling
        const inView = wx >= visMinX && wx <= visMaxX && wy >= visMinY && wy <= visMaxY;
        
        if (prevX !== null && (inView || prevInView)) {
          // Draw line segment if either endpoint is visible
          segments.push({
            x1: prevX, y1: prevY,
            x2: wx, y2: wy,
            color: color
          });
        }
        
        prevX = wx;
        prevY = wy;
        prevInView = inView;
      }
    });
    
    if (segments.length === 0) return;
    
    // Build thick line geometry (each segment = 2 triangles = 6 vertices)
    // This creates a quad for each line segment
    const maxSegments = Math.floor(this.maxTrailVertices / 6);
    const segmentCount = Math.min(segments.length, maxSegments);
    const vertexCount = segmentCount * 6;
    
    for (let i = 0; i < segmentCount; i++) {
      const seg = segments[i];
      
      // Calculate perpendicular direction for line thickness
      const dx = seg.x2 - seg.x1;
      const dy = seg.y2 - seg.y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      
      if (len < 0.001) continue; // Skip zero-length segments
      
      // Perpendicular unit vector
      const px = (-dy / len) * lineThickness * 0.5;
      const py = (dx / len) * lineThickness * 0.5;
      
      // Quad corners
      const x1a = seg.x1 + px, y1a = seg.y1 + py;
      const x1b = seg.x1 - px, y1b = seg.y1 - py;
      const x2a = seg.x2 + px, y2a = seg.y2 + py;
      const x2b = seg.x2 - px, y2b = seg.y2 - py;
      
      // Two triangles per segment (6 vertices)
      const basePos = i * 12;  // 6 vertices * 2 components
      const baseCol = i * 24;  // 6 vertices * 4 components
      
      // Triangle 1: (1a, 1b, 2a)
      this.trailPositions[basePos] = x1a;
      this.trailPositions[basePos + 1] = y1a;
      this.trailPositions[basePos + 2] = x1b;
      this.trailPositions[basePos + 3] = y1b;
      this.trailPositions[basePos + 4] = x2a;
      this.trailPositions[basePos + 5] = y2a;
      
      // Triangle 2: (1b, 2b, 2a)
      this.trailPositions[basePos + 6] = x1b;
      this.trailPositions[basePos + 7] = y1b;
      this.trailPositions[basePos + 8] = x2b;
      this.trailPositions[basePos + 9] = y2b;
      this.trailPositions[basePos + 10] = x2a;
      this.trailPositions[basePos + 11] = y2a;
      
      // Colors for all 6 vertices
      const r = seg.color[0], g = seg.color[1], b = seg.color[2], a = seg.color[3];
      for (let v = 0; v < 6; v++) {
        this.trailColors[baseCol + v * 4] = r;
        this.trailColors[baseCol + v * 4 + 1] = g;
        this.trailColors[baseCol + v * 4 + 2] = b;
        this.trailColors[baseCol + v * 4 + 3] = a;
      }
    }
    
    // Use line program
    gl.useProgram(this.lineProgram);
    
    // Upload position data
    gl.bindBuffer(gl.ARRAY_BUFFER, this.trailPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.trailPositions.subarray(0, vertexCount * 2), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(this.lineAttribLocations.position);
    gl.vertexAttribPointer(this.lineAttribLocations.position, 2, gl.FLOAT, false, 0, 0);
    
    // Upload color data
    gl.bindBuffer(gl.ARRAY_BUFFER, this.trailColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.trailColors.subarray(0, vertexCount * 4), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(this.lineAttribLocations.color);
    gl.vertexAttribPointer(this.lineAttribLocations.color, 4, gl.FLOAT, false, 0, 0);
    
    // Set uniforms
    gl.uniformMatrix4fv(this.lineUniformLocations.projection, false, this.projectionMatrix);
    gl.uniformMatrix4fv(this.lineUniformLocations.view, false, this.viewMatrix);
    
    // Draw all trail quads in ONE call!
    gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
  }
  
  /**
   * Draw trail debug points - shows individual trail vertices
   * @param {Map} trails - Map of trail data from TrailManager
   * @param {Object} viewBounds - Visible area bounds {minX, minY, maxX, maxY}
   * @param {number} zoomFactor - Current zoom level
   */
  drawTrailPoints(trails, viewBounds, zoomFactor) {
    if (!trails || trails.size === 0) {
      console.log('drawTrailPoints: No trails');
      return;
    }
    console.log('drawTrailPoints: Drawing', trails.size, 'trails');
    
    const gl = this.gl;
    
    // Pre-calculate view bounds with margin for culling
    const margin = 50 / zoomFactor;
    const visMinX = viewBounds.minX - margin;
    const visMinY = viewBounds.minY - margin;
    const visMaxX = viewBounds.maxX + margin;
    const visMaxY = viewBounds.maxY + margin;
    
    // Point size - fixed screen-space size with cap for zoomed out view
    const screenPixels = 2.5;  // Target screen size in pixels
    const pointRadius = Math.min(screenPixels / zoomFactor, 5);  // Cap world size when zoomed out
    
    // Collect visible points
    const points = [];
    
    trails.forEach((trail, id) => {
      const positions = trail.positions;
      const total = trail.isFull ? positions.length : trail.head;
      if (total < 2) return;
      
      const startIdx = trail.isFull ? trail.head : 0;
      const color = this._parseColor(trail.color);
      
      // Sample every 4th point for performance
      for (let i = 0; i < total; i += 8) {
        const idx = (startIdx + i) % positions.length;
        const wx = positions[idx];
        const wy = positions[idx + 1];
        
        // View culling
        if (wx >= visMinX && wx <= visMaxX && wy >= visMinY && wy <= visMaxY) {
          points.push({ x: wx, y: wy, color: color });
        }
      }
    });
    
    if (points.length === 0) {
      console.log('drawTrailPoints: No visible points');
      return;
    }
    
    console.log('drawTrailPoints: Drawing', points.length, 'points');
    
    // Draw points as small filled circles using the line program (simpler, works everywhere)
    // Each point = 6 vertices (2 triangles forming a small square)
    const verticesPerPoint = 6;
    const maxPoints = Math.min(points.length, Math.floor(this.maxTrailVertices / verticesPerPoint));
    
    for (let i = 0; i < maxPoints; i++) {
      const point = points[i];
      const halfSize = pointRadius;
      
      // Create a small quad for each point
      const basePos = i * 12;  // 6 vertices * 2 components
      const baseCol = i * 24;  // 6 vertices * 4 components
      
      const x = point.x, y = point.y;
      
      // Triangle 1
      this.trailPositions[basePos] = x - halfSize;
      this.trailPositions[basePos + 1] = y - halfSize;
      this.trailPositions[basePos + 2] = x + halfSize;
      this.trailPositions[basePos + 3] = y - halfSize;
      this.trailPositions[basePos + 4] = x - halfSize;
      this.trailPositions[basePos + 5] = y + halfSize;
      
      // Triangle 2
      this.trailPositions[basePos + 6] = x + halfSize;
      this.trailPositions[basePos + 7] = y - halfSize;
      this.trailPositions[basePos + 8] = x + halfSize;
      this.trailPositions[basePos + 9] = y + halfSize;
      this.trailPositions[basePos + 10] = x - halfSize;
      this.trailPositions[basePos + 11] = y + halfSize;
      
      // Bright color for visibility
      const r = point.color[0], g = point.color[1], b = point.color[2];
      for (let v = 0; v < 6; v++) {
        this.trailColors[baseCol + v * 4] = r;
        this.trailColors[baseCol + v * 4 + 1] = g;
        this.trailColors[baseCol + v * 4 + 2] = b;
        this.trailColors[baseCol + v * 4 + 3] = 1.0;  // Full opacity
      }
    }
    
    const vertexCount = maxPoints * verticesPerPoint;
    
    // Use line program (simple vertex + color)
    gl.useProgram(this.lineProgram);
    
    // Upload position data
    gl.bindBuffer(gl.ARRAY_BUFFER, this.trailPositionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.trailPositions.subarray(0, vertexCount * 2), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(this.lineAttribLocations.position);
    gl.vertexAttribPointer(this.lineAttribLocations.position, 2, gl.FLOAT, false, 0, 0);
    
    // Upload color data
    gl.bindBuffer(gl.ARRAY_BUFFER, this.trailColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.trailColors.subarray(0, vertexCount * 4), gl.DYNAMIC_DRAW);
    gl.enableVertexAttribArray(this.lineAttribLocations.color);
    gl.vertexAttribPointer(this.lineAttribLocations.color, 4, gl.FLOAT, false, 0, 0);
    
    // Set uniforms
    gl.uniformMatrix4fv(this.lineUniformLocations.projection, false, this.projectionMatrix);
    gl.uniformMatrix4fv(this.lineUniformLocations.view, false, this.viewMatrix);
    
    // Draw all points in ONE call!
    gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
    
    console.log('drawTrailPoints: Drew', vertexCount, 'vertices');
  }
}

export { WebGLRenderer };
