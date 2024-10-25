// Instructions and Theory:

// Delta time is a concept used in game development to keep track of the time that has passed between frames.
// This is useful for creating smooth animations and for making sure that the game runs at the same speed on different devices.

// Call this function at the beginning of your game loop and get the deltaTime value returned

// For Eg: Call this function at the beginning of the draw function, assign the value to a variable and multiply it 
// with any velocity you wish to follow consistently across different devices.

// function draw(){
//   const deltaTime = getDeltaTime();

//   object.x += object.velX * deltaTime;
//   object.y += object.velY * deltaTime;

//   requestAnimationFrame(draw);
// }
// draw();

let lastTime = Date.now();

function getDeltaTime() {
  let currentTime = Date.now();
  let deltaTime = (currentTime - lastTime) / 1000;
  lastTime = currentTime;
  return deltaTime;
}

export { getDeltaTime };