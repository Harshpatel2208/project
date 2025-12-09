const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
let topObstacles = [];
let bottomObstacles = [];

let EMOJI = "😎"; // default


function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resize();
document.querySelectorAll(".emoji").forEach(e => {
    e.addEventListener("click", () => {
        EMOJI = e.textContent;            // set selected emoji
        document.getElementById("emojiSelectScreen").style.display = "none";
        resetPlayer();
        update();                         // start game
    });
});

window.addEventListener("resize", resize);

// PLAYER (emoji)
let player = {
    x: 0,
    y: 0,
    size: 48,
    speed: 7
};

// INIT PLAYER POSITION
function resetPlayer() {
    player.x = canvas.width / 2 - player.size / 2;
    player.y = canvas.height - player.size - 40;
}
resetPlayer();

// CONTROLS - single declaration with all directions
let keys = {
    left: false,
    right: false,
    up: false,
    down: false
};

// Keyboard controls
document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "a") keys.left = true;
    if (e.key === "ArrowRight" || e.key === "d") keys.right = true;
    if (e.key === "ArrowUp" || e.key === "w") keys.up = true;
    if (e.key === "ArrowDown" || e.key === "s") keys.down = true;
});

document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft" || e.key === "a") keys.left = false;
    if (e.key === "ArrowRight" || e.key === "d") keys.right = false;
    if (e.key === "ArrowUp" || e.key === "w") keys.up = false;
    if (e.key === "ArrowDown" || e.key === "s") keys.down = false;
});

// Mouse movement (PC)
document.addEventListener("mousemove", (e) => {
    let mx = e.clientX;
    let my = e.clientY;

    if (mx < player.x) keys.left = true, keys.right = false;
    else if (mx > player.x + player.size) keys.right = true, keys.left = false;

    if (my < player.y) keys.up = true, keys.down = false;
    else if (my > player.y + player.size) keys.down = true, keys.up = false;
});

// Touch movement (mobile)
document.addEventListener("touchmove", (e) => {
    const t = e.touches[0];
    player.x = t.clientX - player.size / 2;
    player.y = t.clientY - player.size / 2;
});

// OBSTACLES
let obstacles = [];

function spawnObstacle() {
    const w = 40 + Math.random() * 40;
    const h = 20 + Math.random() * 20;
    obstacles.push({
        x: Math.random() * (canvas.width - w),
        y: -h,
        width: w,
        height: h,
        speed: 3 + Math.random() * 3
    });
}

let spawnInterval = setInterval(spawnObstacle, 800);

// COLLISION
function isColliding(p, o) {
    const px = p.x;
    const py = p.y;
    const ps = p.size;

    return (
        px < o.x + o.width &&
        px + ps > o.x &&
        py < o.y + o.height &&
        py + ps > o.y
    );
}

// SCORE
let score = 0;
let gameOver = false;

// Move player function
function movePlayer() {
    let speed = player.speed;

    if (keys.left) player.x -= speed;
    if (keys.right) player.x += speed;
    if (keys.up) player.y -= speed;
    if (keys.down) player.y += speed;

    // Screen boundaries
    if (player.x < 0) player.x = 0;
    if (player.x + player.size > canvas.width)
        player.x = canvas.width - player.size;

    if (player.y < 0) player.y = 0;
    if (player.y + player.size > canvas.height)
        player.y = canvas.height - player.size;
}

// MAIN LOOP
function update() {
    if (gameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Move player
    movePlayer();

    // Draw player
    ctx.font = `${player.size}px serif`;
    ctx.textBaseline = "top";
    ctx.fillText(EMOJI, player.x, player.y);

    // Update obstacles
    obstacles.forEach((o) => {
        o.y += o.speed;

        // Draw obstacle
        // Draw player
        ctx.font = `${player.size}px serif`;
        ctx.textBaseline = "top";
        ctx.fillText(EMOJI, player.x, player.y);




        // Collision check
        if (isColliding(player, o)) {
            endGame();
        }
        topObstacles.forEach(o => {
  o.y += o.speed;

  ctx.fillStyle = "#ff4444";
  ctx.fillRect(o.x, o.y, o.width, o.height);

  if (isColliding(player, o)) endGame();
});

    topObstacles = topObstacles.filter(o => o.y < canvas.height + 50);
    bottomObstacles.forEach(o => {
    o.y -= o.speed;

  ctx.fillStyle = "orange";
  ctx.fillRect(o.x, o.y, o.width, o.height);

  if (isColliding(player, o)) endGame();
});

bottomObstacles = bottomObstacles.filter(o => o.y + o.height > -50);

    });

    // Remove off-screen obstacles
    obstacles = obstacles.filter((o) => o.y < canvas.height + 50);

    // Score
    score++;
    document.getElementById("scoreDisplay").textContent = score;

    requestAnimationFrame(update);
}

function endGame() {
    if (gameOver) return;
    gameOver = true;
    clearInterval(spawnInterval);

    document.getElementById("finalScore").textContent = "Score: " + score;
    document.getElementById("gameOverScreen").style.display = "flex";
}

function restartGame() {
    // Reset everything
    obstacles = [];
    score = 0;
    gameOver = false;
    document.getElementById("scoreDisplay").textContent = "0";
    document.getElementById("gameOverScreen").style.display = "none";

    resetPlayer();
    spawnInterval = setInterval(spawnObstacle, 800);
    update();
}
function spawnTopObstacle() {
  const w = 40 + Math.random() * 40;
  const h = 20 + Math.random() * 20;

  topObstacles.push({
    x: Math.random() * (canvas.width - w),
    y: -h,
    width: w,
    height: h,
    speed: 3 + Math.random() * 3
  });
}

function spawnBottomObstacle() {
  const w = 40 + Math.random() * 40;
  const h = 20 + Math.random() * 20;

  bottomObstacles.push({
    x: Math.random() * (canvas.width - w),
    y: canvas.height + h,
    width: w,
    height: h,
    speed: 3 + Math.random() * 3
  });
}
setInterval(spawnTopObstacle, 900);
setInterval(spawnBottomObstacle, 900);
    
// Start the game
update();
