const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;


// Resize full-screen
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

// Player (dot)
let player = {
  x: canvas.width / 2 - 20,
  y: canvas.height - 100,
  size: 40,
  speed: 7
};

// Controls
let leftPressed = false;
let rightPressed = false;

document.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft") leftPressed = true;
  if (e.key === "ArrowRight") rightPressed = true;
});
document.addEventListener("keyup", e => {
  if (e.key === "ArrowLeft") leftPressed = false;
  if (e.key === "ArrowRight") rightPressed = false;
});

// Mouse Move = mobile-friendly
document.addEventListener("mousemove", e => {
  leftPressed = e.clientX < window.innerWidth / 2;
  rightPressed = e.clientX >= window.innerWidth / 2;
});

// Bottom-to-top enemies
let rising = [];
function spawnRising() {
  rising.push({
    x: Math.random() * (canvas.width - 40),
    y: canvas.height + 40,
    size: 40,
    speed: 3 + Math.random() * 2
  });
}

// Top-to-bottom enemies
let falling = [];
function spawnFalling() {
  falling.push({
    x: Math.random() * (canvas.width - 50),
    y: -50,
    size: 50,
    speed: 4 + Math.random() * 3
  });
}

// Collision check
function collide(a, b) {
  return (
    a.x < b.x + b.size &&
    a.x + a.size > b.x &&
    a.y < b.y + b.size &&
    a.y + a.size > b.y
  );
}

let score = 0;
let gameOver = false;

function update() {
  if (gameOver) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Move Player
  if (leftPressed) player.x -= player.speed;
  if (rightPressed) player.x += player.speed;

  player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));

  // Draw Player (dot)
  ctx.fillStyle = "cyan";
  ctx.fillRect(player.x, player.y, player.size, player.size);

  // Rising blocks
  rising.forEach(b => {
    b.y -= b.speed;
    ctx.fillStyle = "orange";
    ctx.fillRect(b.x, b.y, b.size, b.size);

    if (collide(player, b)) return end();
  });
  rising = rising.filter(b => b.y + b.size > 0);

  // Falling blocks
  falling.forEach(b => {
    b.y += b.speed;
    ctx.fillStyle = "red";
    ctx.fillRect(b.x, b.y, b.size, b.size);

    if (collide(player, b)) return end();
  });
  falling = falling.filter(b => b.y < canvas.height + 60);

  // Score
  score++;
  ctx.fillStyle = "white";
  ctx.font = "28px Arial";
  ctx.fillText("Score: " + score, 20, 40);
  movePlayer();


  requestAnimationFrame(update);
}

function end() {
  gameOver = true;
  alert("Game Over! Score: " + score);
  location.reload();
}
function restartGame() {
  location.reload();
}
let keys = {
  left: false,
  right: false,
  up: false,
  down: false
};

document.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft") keys.left = true;
  if (e.key === "ArrowRight") keys.right = true;
  if (e.key === "ArrowUp") keys.up = true;
  if (e.key === "ArrowDown") keys.down = true;
});

document.addEventListener("keyup", e => {
  if (e.key === "ArrowLeft") keys.left = false;
  if (e.key === "ArrowRight") keys.right = false;
  if (e.key === "ArrowUp") keys.up = false;
  if (e.key === "ArrowDown") keys.down = false;
});

// Movement update
function movePlayer() {
  let speed = 6;

  if (keys.left) player.x -= speed;
  if (keys.right) player.x += speed;
  if (keys.up) player.y -= speed;
  if (keys.down) player.y += speed;

  // Boundaries (stay inside screen)
  if (player.x < 0) player.x = 0;
  if (player.x + player.size > canvas.width) player.x = canvas.width - player.size;

  if (player.y < 0) player.y = 0;
  if (player.y + player.size > canvas.height) player.y = canvas.height - player.size;
}

document.addEventListener("touchmove", e => {
  let t = e.touches[0];
  player.x = t.clientX - player.size / 2;
  player.y = t.clientY - player.size / 2;
});



setInterval(spawnRising, 900);
setInterval(spawnFalling, 900);

update();
