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

// Joystick setup
const joyOut = document.getElementById('joystickOuter');
const joyIn = document.getElementById('joystickInner');
let joyActive = false, joyX = 0, joyY = 0;
let JOY_SCALE = 0.11;

function updateJoystickScale() {
  const w = Math.min(window.innerWidth, window.innerHeight);
  if (w < 380) { JOY_SCALE = 0.08; }
  else if (w < 520) { JOY_SCALE = 0.095; }
  else { JOY_SCALE = 0.11; }
}
updateJoystickScale();

joyOut.addEventListener('touchstart', (e) => { 
  joyActive = true;
  handleJoystickMove(e);
}, { passive: false });

joyOut.addEventListener('touchmove', handleJoystickMove, { passive: false });

function handleJoystickMove(e) {
  if (!joyActive && e.type !== 'touchstart') return;
  
  e.preventDefault();
  const rect = joyOut.getBoundingClientRect();
  const t = e.touches[0];
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const x = t.clientX - centerX;
  const y = t.clientY - centerY;
  const maxRadius = Math.min(rect.width, rect.height) * 0.4;
  const dist = Math.hypot(x, y);
  
  if (dist > maxRadius) {
    const angle = Math.atan2(y, x);
    joyX = Math.cos(angle) * maxRadius;
    joyY = Math.sin(angle) * maxRadius;
  } else {
    joyX = x;
    joyY = y;
  }
  
  const innerX = rect.width / 2 - joyIn.offsetWidth / 2 + joyX;
  const innerY = rect.height / 2 - joyIn.offsetHeight / 2 + joyY;
  joyIn.style.left = innerX + 'px';
  joyIn.style.top = innerY + 'px';
}

joyOut.addEventListener('touchend', () => {
  joyActive = false; 
  joyX = 0; 
  joyY = 0;
  joyIn.style.left = (joyOut.offsetWidth / 2 - joyIn.offsetWidth / 2) + 'px';
  joyIn.style.top = (joyOut.offsetHeight / 2 - joyIn.offsetHeight / 2) + 'px';
}, { passive: true });

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

    // Joystick movement
    if (joyActive) {
        player.x += joyX * JOY_SCALE;
        player.y += joyY * JOY_SCALE;
    }

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
    joyActive = false;
    joyX = 0;
    joyY = 0;
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
