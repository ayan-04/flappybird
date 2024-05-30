const gameCanvas = document.createElement("canvas");
const gameCtx = gameCanvas.getContext("2d");
gameCanvas.width = window.innerWidth;
gameCanvas.height = window.innerHeight;
document.body.appendChild(gameCanvas);

const imageCache = {};  // Cache for loaded images

function loadImage(src) {
  return new Promise((resolve, reject) => {
    if (imageCache[src]) {
      resolve(imageCache[src]);
    } else {
      const img = new Image();
      img.onload = () => {
        imageCache[src] = img;
        resolve(img);
      };
      img.onerror = (error) => {
        console.error("Error loading image:", error);
        reject(error);
      };
      img.src = src;
    }
  });
}

(async function() {
  const bgPic = await loadImage("images/background.png");
  const birdPic = await loadImage("images/bird.png");
  const upperPics = await Promise.all([...Array(3)].map(() => loadImage("images/upper.png")));
  const lowerPics = await Promise.all([...Array(3)].map(() => loadImage("images/lower.png")));

  // Bird properties
  const birdState = {
    horSpeed: 0,
    verSpeed: 0,
    horAccel: 0,
    verAccel: 300,  // Increased vertical acceleration
    posX: 50,
    posY: gameCanvas.height / 2,
    gameScore: 0
  };

  // Pipes properties
  const pipesState = [];
  for (let i = 0; i < 3; i++) {
    pipesState.push({
      upper: { posX: gameCanvas.width + i * (gameCanvas.width / 3), posY: -200 },
      lower: { posX: gameCanvas.width + i * (gameCanvas.width / 3), posY: gameCanvas.height - 250 },
      pipeSpeed: -300  // Increased pipe speed
    });
  }

  // Key events
  const activeKeys = {};
  addEventListener("keydown", function(e) {
    activeKeys[e.keyCode] = true;
  }, false);

  addEventListener("keyup", function(e) {
    delete activeKeys[e.keyCode];
    isFlapped = false;
  }, false);

  // Reset game
  function resetGame() {
    birdState.horSpeed = 0;
    birdState.verSpeed = 0;
    birdState.posX = 50;
    birdState.posY = gameCanvas.height / 2;
    birdState.gameScore = 0;
    for (let i = 0; i < 3; i++) {
      pipesState[i].upper.posX = gameCanvas.width + i * (gameCanvas.width / 3);
      pipesState[i].lower.posX = gameCanvas.width + i * (gameCanvas.width / 3);
    }
  }

  let isFlapped = false;
  const gapBetweenPipes = 100;  // Decreased gap between pipes

  // Update game objects
  function updateGame(modifier) {
    birdState.gameScore += modifier;
    if (32 in activeKeys && !isFlapped) { // Space key for moving up
      birdState.verSpeed = -200;  // Increased bird flap strength
      isFlapped = true;
    }
    birdState.posX += birdState.horSpeed * modifier;
    birdState.posY += birdState.verSpeed * modifier;
    birdState.horSpeed += birdState.horAccel * modifier;
    birdState.verSpeed += birdState.verAccel * modifier;

    for (let i = 0; i < 3; i++) {
      const pipe = pipesState[i];
      pipe.upper.posX += pipe.pipeSpeed * modifier;
      pipe.lower.posX += pipe.pipeSpeed * modifier;

      if (pipe.upper.posX < -50) {
        pipe.upper.posX = gameCanvas.width;
        pipe.upper.posY = -Math.random() * 200;  // Increased upper pipe height
        pipe.lower.posX = pipe.upper.posX;
        pipe.lower.posY = gameCanvas.height - (pipe.upper.posY + gapBetweenPipes + 200);  // Adjusted lower pipe position
      }

      // Collision detection
      if ((pipe.upper.posX < birdState.posX + 50 && pipe.upper.posX + 50 > birdState.posX && birdState.posY < pipe.upper.posY + 250) ||
          (pipe.lower.posX < birdState.posX + 50 && pipe.lower.posX + 50 > birdState.posX && birdState.posY + 50 > pipe.lower.posY)) {
        resetGame();
      }
    }

    if (birdState.posY > gameCanvas.height || birdState.posY < 0) {
      resetGame();
    }
  }

  // Render everything
  function renderGame() {
    if (bgPic) {
      gameCtx.drawImage(bgPic, 0, 0, gameCanvas.width, gameCanvas.height);
    }
    if (birdPic) {
      gameCtx.drawImage(birdPic, birdState.posX, birdState.posY);
    }
    for (let i = 0; i < 3; i++) {
      if (upperPics[i]) {
        gameCtx.drawImage(upperPics[i], pipesState[i].upper.posX, pipesState[i].upper.posY, 50, 250);  // Increased pipe height
      }
      if (lowerPics[i]) {
        gameCtx.drawImage(lowerPics[i], pipesState[i].lower.posX, pipesState[i].lower.posY, 50, 250);  // Increased pipe height
      }
    }
    // Score
    gameCtx.fillStyle = "rgb(250, 250, 250)";
    gameCtx.font = "24px Helvetica";
    gameCtx.textAlign = "left";
    gameCtx.textBaseline = "top";
    gameCtx.fillText("Score: " + Math.floor(birdState.gameScore), 12, 32);
  }

  // The main game loop
  function mainLoop() {
    const now = Date.now();
    const delta = now - previousTime;
    updateGame(delta / 1000);
    renderGame();
    previousTime = now;
    requestAnimationFrame(mainLoop);
  }

  let previousTime = Date.now();
  resetGame();
  mainLoop();
})();
