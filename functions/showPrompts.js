const OPACITY_THRESHOLD = 0.5;

/**
 * @typedef {Object} PromptSettings
 * @property {string} text - The text to display
 * @property {number} y - The y position of the prompt
 * @property {number} x - The x position of the prompt
 * @property {number} vel - The velocity of the prompt
 * @property {number} time - The time the prompt has been displayed
 * @property {number} opacity - The opacity of the prompt
 * @property {string} color - The color of the prompt
 */

/** @type {PromptSettings[]} PromptQueue */
const promptQueue = [];

/** @type {PromptSettings[]} ActivePrompts */
const activePrompts = [];

/**
 * Adds a prompt to the queue with the specified settings.
 * @param {Object} settings - The settings for the prompt
 * @param {string} settings.text - The text to display
 * @param {number} settings.vel - The velocity of the prompt
 * @param {number} settings.time - The time the prompt has been displayed
 * @param {string} settings.color - The color of the prompt
 * @param {number} settings.x - The x position of the prompt
 * @param {number} settings.y - The y position of the prompt
 * @returns {void}
 */
function prompt({
  text = "",
  vel = 1,
  time = 0.01,
  color = "255, 255, 255",
  x,
  y = canvas.height / 1.5
}) {
  ctx.font = "28px Arial";

  const promptData = {
    text,
    y,
    x: x || (canvas.width - ctx.measureText(text).width) / 2,
    opacity: 1,
    vel,
    time,
    color,
    isActive: false
  };
  
  promptQueue.push(promptData);
  
  // If no prompts are active, start showing the first one
  if (activePrompts.length === 0) {
    activateNextPrompt();
  }
}

/**
 * Activates the next prompt in the queue if conditions are met
 * @returns {void}
 */
function activateNextPrompt() {
  // Check if we have pending prompts and haven't reached max active prompts
  if (promptQueue.length > 0) {
    // Check if we can add another prompt based on opacity of last active prompt
    const lastActivePrompt = activePrompts[activePrompts.length - 1];
    const canAddPrompt = !lastActivePrompt || lastActivePrompt.opacity <= OPACITY_THRESHOLD;

    if (canAddPrompt) {
      const nextPrompt = promptQueue.shift();
      nextPrompt.isActive = true;
      activePrompts.push(nextPrompt);
    }
  }
}

function showPrompts() {
  // Update and render all active prompts
  for (let i = activePrompts.length - 1; i >= 0; i--) {
    const prompt = activePrompts[i];
    
    // Render the prompt
    ctx.fillStyle = `rgba(${prompt.color}, ${prompt.opacity})`;
    ctx.font = "28px Arial";
    ctx.fillText(prompt.text, prompt.x, prompt.y);

    // Update prompt position and opacity
    prompt.y -= prompt.vel;
    prompt.opacity -= prompt.time;

    // Remove prompt if it's completely faded out
    if (prompt.opacity <= 0) {
      activePrompts.splice(i, 1);
    }
  }

  // Check if we can activate the next prompt
  activateNextPrompt();
}

export { prompt, showPrompts }