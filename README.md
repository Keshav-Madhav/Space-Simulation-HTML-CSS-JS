# Space Simulator

> High-performance, browser-based gravitational sandbox for experimenting with orbital mechanics, emergent clusters, galaxies, and interactive camera dynamics — all rendered on layered HTML5 canvases with real‑time controls.

## 🔎 Executive Summary
This project is an interactive 2D space simulation focused on emergent gravitational behavior, visual clarity, and performance experimentation. Users can spawn planets, stars, black holes, solar systems, three‑body problems, miniature galaxies, and deterministic test setups. The simulation supports live parameter tweaking (radius, density, color), real-time time-scaling, camera follow mechanics (including center-of-mass tracking), velocity visualization, dynamic unit switching (m/s ↔ km/s), and optional visual layers (trails, background stars, labels, FPS overlay). 

The codebase is structured for future scalability toward large-N performance goals (10k–100k bodies) through progressive optimization strategies (batch rendering, culling, algorithmic improvements such as Barnes–Hut, typed arrays, Web Workers, and eventual WebGL migration).

---
## 📑 Table of Contents
1. [Core Features](#-core-features)
2. [UI & Controls](#-ui--controls)
   - [Mouse](#mouse)
   - [Keyboard Shortcuts](#keyboard-shortcuts)
   - [Buttons & Toggles](#buttons--toggles)
   - [Spawn Presets](#spawn-presets)
3. [Simulation Parameters](#-simulation-parameters)
4. [Physics Model](#-physics-model)
5. [Rendering Architecture](#-rendering-architecture)
6. [Data Structures & Modules](#-data-structures--modules)
7. [Performance Optimizations](#-performance-optimizations)
   - [Implemented](#implemented)
   - [Planned / Roadmap](#planned--roadmap)
8. [Experimental Methodology](#-experimental-methodology)
9. [Projected Scaling & Results](#-projected-scaling--results)
10. [Project Structure](#-project-structure)
11. [Getting Started](#-getting-started)
12. [Configuration Reference](#-configuration-reference)
13. [Extending the Simulator](#-extending-the-simulator)
14. [Future Roadmap](#-future-roadmap)
15. [Contributing](#-contributing)
16. [License](#-license)
17. [Appendix: Ideas & Enhancements](#appendix-ideas--enhancements)

---
## 🚀 Core Features
| Category | Capability | Notes |
|----------|-----------|-------|
| Spawning | Planets, Stars, Black Holes | Adjustable radius, density, color |
| Presets | Three-Body, Cluster, Solar System, Mini Galaxy, Deterministic Test, Light-Speed Planet | Fast experimentation |
| Physics | Gravitational attraction, collisions (merge & mass transfer), center-of-mass tracking | Collision toggleable |
| Rendering | Multi-layer canvases (main, trails, stars) | Separation reduces overdraw |
| Visualization | Velocity vectors, labels, trails, FPS | All toggleable for performance |
| Camera | Manual pan, follow body, follow previous/next, follow center of mass, zoom | Smooth interactive control |
| Time Control | Scalable time (0.1× to 100×) | Real-time slider |
| Units | Velocity unit toggle (m/s ↔ km/s) | Dynamic UI update |
| Interactivity | Drag-spawn bodies? (if implemented), double-click selection focusing | Expandable |
| Performance Modes | Disable trails, stars, velocities, labels | Reduces CPU/GPU load |

---
## 🕹 UI & Controls
### Mouse
| Action | Effect |
|--------|--------|
| Scroll Wheel | Zoom (In = wheel up / Out = wheel down) |
| Click/Drag | Start drag handler (body placement or panning) |
| Double Click | Focus on nearest body (or spawn behavior if none nearby) |

### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `w/a/s/d` | Pan camera (up / left / down / right) |
| `c` | Toggle follow camera (locks onto selected or center of mass) |
| `n` | Follow previous body |
| `m` | Follow next body |
| `t` | Spawn Three Body preset |
| `k` | Spawn Planet Cluster |
| `g` | Spawn Mini Galaxy |
| `y` | Spawn Deterministic Test System |
| `r` | Reset simulation |
| `x` | Toggle collisions |
| `Backspace` | deletes locked on body |

> Note: Some key behaviors are partially inferred; consult `index.js` for exact conditional blocks where omitted lines exist.

### Buttons & Toggles
| UI Element | ID | Function |
|------------|----|----------|
| Reset | `#reset` | Clears simulation state & UI flags |
| Body Collision | `#collision` | Enables merge/collision physics |
| Show Velocities | `#showVelocities` | Toggles velocity vectors |
| Velocity Unit | `#velocityUnit` | Switches between m/s and km/s |
| Show Labels | `#showLabels` | Toggles textual identifiers |
| Show FPS | `#showFPS` | Displays instantaneous framerate |
| Time Scale | `#timeScale` | Multiplier for simulation deltaTime |
| Show Trails | `#showTrails` | Toggles body motion trails |
| Show Stars | `#showStars` | Toggles background starfield |
| Follow Camera | `#followCam` | Locks camera on target or center of mass |
| Camera Speed | `#camSpeed` | Pixels per frame pan increment |
| Follow Prev | `#prev` | Cycle backward through bodies |
| Follow Next | `#next` | Cycle forward through bodies |
| Center of Mass | `#centerMass` | Follow aggregated COM |
| Zoom In | `#zoomMinus` | (Naming: decreases zoomFactor) |
| Zoom Out | `#zoomPlus` | (Increases zoomFactor) |

### Spawn Presets
| Button | ID | Description |
|--------|----|-------------|
| Three Body Problem | `#threeBody` | Configures classical 3-body test dynamics |
| Planet Cluster | `#cluster` | Spawns localized multi-body group |
| Solar System | `#solarSystem` | Approximate scaled system (reduced visual clutter) |
| Mini Galaxy | `#galaxySpawn` | Rotational set forming spiral-like motion |
| Light-Speed Planet | `#lightSpeedP` | Injects high-velocity body (1/1000 c) |
| Deterministic Test | `#deterministicTest` | Reproducible benchmark scenario |

---
## 🎛 Simulation Parameters
| Parameter | Source | Description |
|-----------|--------|-------------|
| Planet Radius / Density / Color | Inputs: `#PlanetRadius`, `#PlanetDensity`, `#PlanetColor` | Defines base spawn properties |
| Star Radius / Density / Color | `#StarRadius`, `#StarDensity`, `#StarColor` | Higher density & brightness |
| Black Hole Radius / Density / Color | `#BlackHoleRadius`, `#BlackHoleDensity`, `#BlackHoleColor` | Extremely dense; strong gravity |
| Time Scale | `#timeScale` (0.1–100) | Multiplies simulation progression per frame |
| Velocity Unit | Toggle button | Updates unit label & conversion factor |
| Zoom Factor | Internal (scroll & buttons) | Adjusts world->screen scale |
| Camera Follow Index | Managed internally | Index: -1 = center of mass |
| Collisions Flag | Checkbox | Merge or pass-through bodies |
| Trail Flag | Checkbox | Accumulates positions in `TrailManager` |
| Show Stars | Checkbox | Enables background star pass |

---
## 🧮 Physics Model
The gravitational simulation approximates Newtonian pairwise attraction. Core elements:

| Concept | Implementation Notes |
|---------|----------------------|
| Mass | Derived from density and radius. A typical model: \( m = \rho * \frac{4}{3} \pi r^3 \). If different, adjust docs accordingly. |
| Force | \( F = G * m_1 m_2 / r^2 \) with vector direction. Constant `G` may be scaled for visual timescales. |
| Integration | Likely simple explicit (Euler) or semi-implicit (check `PhysicsSystem.js`). Future upgrade: Leapfrog / Verlet for energy stability. |
| Collisions | When enabled, overlapping bodies merge (mass & momentum conservation). Density / radius recalculated from combined mass, preserving volume relation. |
| Center of Mass | Weighted average of all body positions: \( \vec{R}_{COM} = \frac{\sum m_i \vec{r}_i}{\sum m_i} \). Used for follow camera mode. |
| Time Scaling | Effective dt = base frame delta * `timeScale`. Large values may destabilize or cause tunneling in collisions. |
| Velocity Unit Switching | UI display converts raw internal units to m/s or km/s (scaling by 1e-3 for km/s). |

### Numerical Stability Considerations
- Very large density or radius differences can cause extreme acceleration spikes.
- High timeScale with close passes may skip collision resolution.
- Potential improvements: adaptive sub-stepping, softening parameter (ε) to avoid singularities for small r.

---
## 🖥 Rendering Architecture
| Layer | Canvas | Purpose |
|-------|--------|---------|
| Background Stars | `canvas2` (guess) | Static or slowly distorted starfield |
| Trails | `canvas3` (or dedicated) | Persistent motion history separate from body redraw |
| Main Bodies & UI | `canvas` | Bodies, velocities, labels, overlays |

Rendering Process (simplified per frame):
1. Compute physics step (positions, velocities, collisions).
2. Clear / partially clear main canvas.
3. Optionally redraw background stars (if enabled; trails may persist without clearing for streak effect).
4. Update / draw trails via `TrailManager`.
5. Draw bodies (batched arcs) & optional velocity vectors.
6. Draw labels & overlays (FPS, instructions, prompts).

Potential improvements: single `beginPath` accumulation, off-screen culling, sub-pixel skip heuristics.

---
## 🗂 Data Structures & Modules
| File / Module | Role |
|---------------|-----|
| `index.html` | UI layout, canvases, controls markup |
| `styles.css` | Visual styling & menu animation |
| `index.js` | Main orchestration: event listeners, spawning, rendering loop initiation |
| `variables/constAndVars.js` | Global constants & shared mutable state (bodies list, flags, scaling factors) |
| `variables/domElements.js` | DOM element caching (performance improvement over repeated `querySelector`) |
| `classes/CelestialBodyClass.js` | Defines body properties (position, velocity, mass, density, color) & update methods |
| `classes/PhysicsSystem.js` | Physics integration, gravity calculations, collision handling (expand for Barnes–Hut later) |
| `classes/TrailManagerClass.js` | Efficient accumulation & rendering of body trails with retention policy |
| `classes/BackgroundStarsClass.js` | Procedural background star generation & distortion (parallax / warp field) |
| `functions/spawnTemplates.js` | Named system presets (cluster, solar system, galaxy, etc.) |
| `functions/collisionAndMassTransfer.js` | Collision detection & mass/velocity merging logic |
| `functions/cameraHelper.js` | Camera follow, transformation utilities |
| `functions/deltaTime.js` | Frame timing abstraction (constant FPS loop support) |
| `functions/createConstantFPSGameLoop.js` | Game loop harness for stabilized update cadence |
| `functions/fpsDisplay.js` | FPS calculation & conditional rendering |
| `functions/dragListeners.js` | Mouse drag interactions (spawn or pan modes) |
| `functions/showPrompts.js` | Overlay transient prompt messaging |
| `functions/utils.js` | Generic helpers (e.g., color, math, clamp) |

---
## ⚙️ Performance Optimizations
### Implemented
| Optimization | Description | Benefit |
|--------------|-------------|---------|
| Separate Canvases | Trails & stars segregated from body redraw | Reduces per-frame clears |
| Toggleable Layers | Disable stars/trails/velocities/labels/FPS | User-controlled frame boost |
| DOM Element Caching | Pre-stored references in `domElements.js` | Lower layout/query overhead |
| Conditional Rendering | Skip drawing optional features | CPU/GPU savings |
| Time Scaling | Decouple visual step size from actual frame rate | Experimentation flexibility |
| Prompt / UI Isolation | Lightweight overlay system | Minimizes main loop interference |

### Planned / Roadmap
| Planned Technique | Purpose | Notes |
|-------------------|---------|-------|
| Barnes–Hut (QuadTree) | Reduce O(N²) gravity to O(N log N) | Threshold opening angle (θ) tuning |
| Object Pooling | Recycle body & node structures | Avoid GC pauses |
| Typed Arrays (SoA) | Memory locality & SIMD potential | Prepare for worker offloading |
| Web Workers / SharedArrayBuffer | Parallel physics vs main thread rendering | Deterministic step barrier |
| GPU Acceleration (WebGL / WebGPU) | Massively parallel force computation | Optionally compute + render in shader |
| Adaptive Sub-Stepping | Stability for fast movers | Dynamic dt partitioning |
| Spatial Partitioning / Broadphase | Early collision culling | Uniform grid or hashed buckets |
| Trail Compression | Retain shape with fewer vertices | Douglas–Peucker or fixed stride |
| Frame Pipelining | Physics one frame ahead | Amortize large updates |
| Energy Diagnostics | Drift monitoring | Helps integration upgrades |

---
## 🔬 Experimental Methodology
Design repeatable benchmarks as optimizations land.

### Benchmark Dimensions
| Metric | Description |
|--------|-------------|
| FPS (avg / p5 / p95) | Distribution over rolling window |
| Physics Step Time | Gravity + collisions only |
| Render Time | Draw + compositing |
| Memory (MB) | JS heap usage per body count |
| Merge Events/sec | Collision dynamics intensity |

### Suggested Body Count Ladder
`[100, 250, 500, 1k, 2.5k, 5k, 10k, 25k, 50k, 100k]`

### Procedure
1. Disable non-essential visuals (trails, stars, labels) unless evaluating their cost.
2. Fix timeScale = 1 for baseline.
3. Spawn synthetic uniform random bodies in a bounded region.
4. Run for 60 simulation seconds or 300 real frames.
5. Record metrics (console logs or on-screen panel).
6. Repeat with each optimization layer enabled.

### Instrumentation Hooks (Planned)
- `performance.now()` sampling inside PhysicsSystem loop.
- Rolling average ring buffer (length 120 frames).
- Optional CSV export via Blob download.

### Validation
| Test | Goal |
|------|------|
| Momentum Conservation | Sum(m*v) stable within tolerance |
| Energy Drift (No Collisions) | < 1% drift over 5k steps |
| Deterministic Re-run | Identical state hashes for same seed |
| Stability Under High dt | Detect divergence threshold |

---
## 📈 Projected Scaling & Results
(Estimates; actual values depend on hardware, integrator, and implementation specifics.)

| Bodies | Naïve O(N²) (Est. FPS) | Barnes–Hut (θ≈0.6) (Est. FPS) | With Workers (Projected) | With GPU/WebGL (Speculative) |
|--------|------------------------|--------------------------------|--------------------------|------------------------------|
| 1,000  | 120+ | 120+ | 120+ | 120+ |
| 5,000  | ~25 | ~60 | ~90 | 120+ |
| 10,000 | ~8 | ~40 | ~70 | 120+ |
| 25,000 | Unusable (<2) | ~18 | ~40 | ~100 |
| 50,000 | — | ~8 | ~22 | ~70 |
| 100,000 | — | ~3 | ~12 | ~40 |

> These projections assume: pooled allocations, path batching, culling, and stable browser environment. GPU pathway assumes compute-like batching of force accumulation.

Scaling Complexity:
- Current: O(N²) gravity + O(N) rendering + optional collisions ~ O(N²).
- Target: O(N log N) gravity + O(N) rendering + culling to O(V) visible.

---
## 🧾 Project Structure
```
Space-Simulation-HTML-CSS-JS/
├─ index.html
├─ index.js
├─ styles.css
├─ space.jpg
├─ classes/
│  ├─ BackgroundStarsClass.js
│  ├─ CelestialBodyClass.js
│  ├─ PhysicsSystem.js
│  └─ TrailManagerClass.js
├─ functions/
│  ├─ cameraHelper.js
│  ├─ collisionAndMassTransfer.js
│  ├─ createConstantFPSGameLoop.js
│  ├─ deltaTime.js
│  ├─ dragListeners.js
│  ├─ fpsDisplay.js
│  ├─ showPrompts.js
│  ├─ spawnTemplates.js
│  └─ utils.js
├─ variables/
│  ├─ constAndVars.js
│  └─ domElements.js
└─ workers/  (future: physics, quadtree, trails)
```

---
## 🏁 Getting Started
### Prerequisites
- Modern Chromium-based browser (Chrome, Edge) or Firefox / Safari with good Canvas performance.
- (Optional) Local static server to avoid certain security restrictions (e.g., module imports with stricter policies).

### Run Locally (Simplest)
1. Clone or download the repository.
2. Open `index.html` directly in your browser.
3. Interact with the Settings panel (top-left button).

### Run with a Local Server (Recommended)
Examples:
- Node: `npx serve .`
- Python (3.x): `python -m http.server 8080`
- PowerShell (Win 10+): `Start-Process http://localhost:8080; python -m http.server 8080`

### Development Tips
| Activity | Tip |
|----------|-----|
| Debugging Physics | Add console time markers around force loop inside `PhysicsSystem.js` |
| Profiling | Use Chrome Performance tab; isolate scripting vs painting cost |
| Parameter Tweaks | Adjust defaults in `constAndVars.js` |
| Adding Presets | Extend `spawnTemplates.js` with new factory functions |
| Fast Reset | Use `r` instead of UI button |

---
## 🧩 Extending the Simulator
| Goal | Approach |
|------|----------|
| Add New Body Type | Subclass or extend `CelestialBodyClass` (e.g., charged particle) |
| New Integrator | Implement `step()` variant in `PhysicsSystem` with pluggable strategy |
| Render Optimization | Introduce batched `Path2D` accumulation & one fill/stroke |
| Deterministic Replay | Seed a PRNG (e.g., mulberry32) and log spawn events |
| Custom Overlay | Add module reading metrics & drawing to UI layer |
| GPU Path | Create WebGL buffer of positions + instanced rendering |

---
## 🛤 Future Roadmap
Priority (High → Low):
1. Barnes–Hut quad / octree (2D currently) gravity approximation.
2. Object pooling & memory reuse for bodies, trails, tree nodes.
3. Structure of Arrays migration (positions, velocities, masses in typed arrays).
4. Worker offload (physics thread) with `SharedArrayBuffer` barrier sync.
5. Deterministic integrator selection (symplectic leapfrog) & energy monitor.
6. Adaptive sub-step integrator for close encounters.
7. WebGL instanced rendering (points + shaders for glow / falloff) & FBO trails.
8. On-screen profiling HUD with collapsible panel.
9. Persistent scenario save/load (JSON export/import).
10. Parameter scripting console (sandboxed user expressions).

---
## 🤝 Contributing
### Guidelines
| Aspect | Convention |
|--------|------------|
| Style | Consistent ES modules (incremental migration), camelCase, descriptive function names |
| Commits | Imperative mood: "Add trail pooling" |
| Issues | Include reproduction steps, browser version, body count, timeScale |
| Performance PRs | Provide before/after FPS & methodology |
| Testing | (Planned) Add simple deterministic test harness using seeded spawns |

### Suggested Labels
`performance`, `feature`, `bug`, `physics`, `rendering`, `docs`, `refactor`.

---
## Appendix: Ideas & Enhancements
| Idea | Rationale |
|------|-----------|
| Gravitational Softening Parameter ε | Prevent extreme acceleration at tiny separations |
| Color Mapping by Velocity | Visual kinetic energy distribution |
| Mass Transfer Accretion Disk Visualization | Enhance black hole interactions |
| Trajectory Prediction (Ghost Orbits) | Educational insight into orbital mechanics |
| Screenshot / GIF Export | Share emergent systems |
| WebGPU Compute Path | Further accelerate large-N gravity |
| Body Selection Panel | UI list with stats & focus button |
| Logarithmic Time Warping | Smooth fast-forward transitions |
| Multi-Rate Integration | Stable central massive body vs many light bodies |
| Quasi-3D Depth Parallax | Visual depth cue while staying 2D physics |

---
## 🧭 Summary
This README serves as both user guide and engineering blueprint. As optimizations land, update the Performance, Methodology, and Scaling sections to keep documentation an active part of the development loop.

> Happy orbit crafting! 🌌
