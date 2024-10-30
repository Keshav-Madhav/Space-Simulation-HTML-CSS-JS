// Instructions and Theory:

// The createConstantFPSGameLoop function is used in game development to create a game loop that runs at a specified frames per second (FPS).
// This is useful for ensuring that the game runs at the same speed across different devices, regardless of their display's refresh rate.

// The createConstantFPSGameLoop function takes two arguments:
// 1. desiredFPS: The desired frames per second for the game loop. This is a number.
// 2. gameLoopFunction: The function that contains the game logic. This function will be called at each frame.

// The function calculates the interval in milliseconds based on the desiredFPS and uses setInterval to call the gameLoopFunction at this interval.
// This ensures that the game loop runs at the specified FPS. 
// **There may be slight variations in the actual frame rate due to browser limitations. (desiredFPS +/- 5)**

// For Eg: You can call this function to create a game loop that runs at 60 FPS:

// function gameLoop() {
//   // Your game logic here
// }
// var fps = 60; // Set your desired fps
// createConstantFPSGameLoop(fps, gameLoop);

/**
 * Create a game loop that runs at a constant frames per second (FPS)
 * @param {number} desiredFPS - Desired frames per second for the game loop
 * @param {Function} gameLoopFunction - Function containing the game logic and rendering logic
 */
const createConstantFPSGameLoop = (desiredFPS, gameLoopFunction) => {
  const FRAME_TIME = 1000 / desiredFPS; // Target time per frame in milliseconds
  let lastFrameTime = performance.now(); // Initialize last frame time
  let accumulatedTime = 0; // Time accumulator for managing the updates

  const loop = (currentTime) => {
    const elapsedTime = currentTime - lastFrameTime; // Time since last frame
    lastFrameTime = currentTime;

    // Accumulate the elapsed time
    accumulatedTime += elapsedTime;

    // Update the game logic based on the fixed time step
    while (accumulatedTime >= FRAME_TIME) {
      gameLoopFunction(); // Call the game logic (update + render)
      accumulatedTime -= FRAME_TIME; // Decrease the accumulated time
    }

    // Request the next frame
    requestAnimationFrame(loop);
  };

  // Start the game loop
  requestAnimationFrame(loop);
};

export { createConstantFPSGameLoop };