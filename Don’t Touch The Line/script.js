// script.js — Emoji player + glowing trail + haptics + dynamic joystick
// Uses Set C emoji list and an emoji selection screen

/* -------------------- Setup -------------------- */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
function resize() { canvas.width = innerWidth; canvas.height = innerHeight; updateJoystickScale(); }
resize(); window.addEventListener('resize', resize);

// Audio
const sfxHit = document.getElementById('sfx-hit');
const sfxBlast = document.getElementById('sfx-blast');
const sfxPower = document.getElementById('sfx-power');
const sfxHigh = document.getElementById('sfx-high');

// Preload audio volumes
function initAudio() { [sfxHit, sfxBlast, sfxPower, sfxHigh].forEach(a => { try { a.volume = 0.9 } catch (e) { } }); }
window.addEventListener('pointerdown', () => { initAudio(); window.removeEventListener('pointerdown', initAudio); }, { passive: true });

/* -------------------- Emoji selection (Set C) -------------------- */
const EMOJI_SET = ['😎', '🤩', '😍', '🤖', '👽', '💀', '🧠', '⚡', '🔥', '🐱', '🐼', '🐧', '💫', '🎯', '🚀'];
const startScreen = document.getElementById('startScreen');
const emojiGrid = document.getElementById('emojiGrid');
const chosenEmojiSpan = document.getElementById('chosenEmoji');
const startBtn = document.getElementById('startBtn');

let PLAYER_EMOJI = localStorage.getItem('playerEmoji') || EMOJI_SET[0];

// populate grid
function buildEmojiGrid() {
  emojiGrid.innerHTML = '';
  EMOJI_SET.forEach(e => {
    const cell = document.createElement('div');
    cell.className = 'emojiCell' + (e === PLAYER_EMOJI ? ' selected' : '');
    cell.textContent = e;
    cell.addEventListener('click', () => {
      PLAYER_EMOJI = e;
      chosenEmojiSpan.textContent = PLAYER_EMOJI;
      document.querySelectorAll('.emojiCell').forEach(c => c.classList.remove('selected'));
      cell.classList.add('selected');
      localStorage.setItem('playerEmoji', PLAYER_EMOJI);
    });
    emojiGrid.appendChild(cell);
  });
}
buildEmojiGrid();
chosenEmojiSpan.textContent = PLAYER_EMOJI;

// start button
startBtn.addEventListener('click', () => {
  startScreen.style.display = 'none';
  startGame();
});

/* -------------------- Player (emoji) & trail -------------------- */
let player = { x: innerWidth / 2 - 24, y: innerHeight / 2 - 24, size: 48, speed: 6 };
let trail = []; // {x,y,age}

// draw emoji with font set dynamically
function drawEmojiAt(em, x, y, size, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `${size}px serif`;
  ctx.textBaseline = 'top';
  ctx.fillText(em, x, y);
  ctx.restore();
}

/* -------------------- Movement (keyboard + joystick) -------------------- */
let keys = { left: false, right: false, up: false, down: false };
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') keys.left = true;
  if (e.key === 'ArrowRight') keys.right = true;
  if (e.key === 'ArrowUp') keys.up = true;
  if (e.key === 'ArrowDown') keys.down = true;
});
document.addEventListener('keyup', e => {
  if (e.key === 'ArrowLeft') keys.left = false;
  if (e.key === 'ArrowRight') keys.right = false;
  if (e.key === 'ArrowUp') keys.up = false;
  if (e.key === 'ArrowDown') keys.down = false;
});

// remove any direct touch-follow: no touchmove that sets player position

/* -------------------- Joystick dynamic sizing (center-bottom) -------------------- */
const joyOut = document.getElementById('joystickOuter');
const joyIn = document.getElementById('joystickInner');
let joyActive = false, joyX = 0, joyY = 0;
let JOY_SCALE = 0.08; // multiplier for movement - adjusted dynamically

function updateJoystickScale() {
  // set joystick size & movement multiplier based on screen width
  const w = Math.min(window.innerWidth, window.innerHeight);
  // larger screens -> slightly larger joystick and higher multiplier
  if (w < 380) { JOY_SCALE = 0.06; joyIn.style.width = '40px'; joyIn.style.height = '40px'; joyIn.style.left = '30px'; joyIn.style.top = '30px'; joyOut.style.width = '100px'; joyOut.style.height = '100px'; }
  else if (w < 520) { JOY_SCALE = 0.075; joyIn.style.width = '44px'; joyIn.style.height = '44px'; joyIn.style.left = '38px'; joyIn.style.top = '38px'; joyOut.style.width = '110px'; joyOut.style.height = '110px'; }
  else { JOY_SCALE = 0.09; joyIn.style.width = '48px'; joyIn.style.height = '48px'; joyIn.style.left = '36px'; joyIn.style.top = '36px'; joyOut.style.width = '120px'; joyOut.style.height = '120px'; }
}
updateJoystickScale();

// joystick handlers
joyOut.addEventListener('touchstart', () => { joyActive = true; }, { passive: true });
joyOut.addEventListener('touchmove', e => {
  e.preventDefault();
  const rect = joyOut.getBoundingClientRect();
  const t = e.touches[0];
  const x = t.clientX - (rect.left + rect.width / 2);
  const y = t.clientY - (rect.top + rect.height / 2);
  const max = Math.min(rect.width, rect.height) * 0.35;
  const dist = Math.hypot(x, y) || 1;
  const limit = dist > max ? max / dist : 1;
  joyX = x * limit;
  joyY = y * limit;
  joyIn.style.left = (rect.width / 2 - joyIn.offsetWidth / 2 + joyX) + 'px';
  joyIn.style.top = (rect.height / 2 - joyIn.offsetHeight / 2 + joyY) + 'px';
}, { passive: false });
joyOut.addEventListener('touchend', () => {
  joyActive = false; joyX = 0; joyY = 0;
  // return inner to center
  joyIn.style.left = (joyOut.offsetWidth / 2 - joyIn.offsetWidth / 2) + 'px';
  joyIn.style.top = (joyOut.offsetHeight / 2 - joyIn.offsetHeight / 2) + 'px';
});

/* -------------------- Move player function -------------------- */
function movePlayer() {
  // keyboard
  if (keys.left) player.x -= player.speed;
  if (keys.right) player.x += player.speed;
  if (keys.up) player.y -= player.speed;
  if (keys.down) player.y += player.speed;

  // joystick
  if (joyActive) {
    player.x += joyX * JOY_SCALE;
    player.y += joyY * JOY_SCALE;
  }

  // clamp
  player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
  player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));
}

/* -------------------- Obstacles (top & bottom) -------------------- */
let topObs = [], bottomObs = [];
function spawnTop() { const s = 36 + Math.random() * 12; topObs.push({ x: Math.random() * (canvas.width - s), y: -s, size: s, speed: 3 + Math.random() * 1.6 + score * 0.001 }); }
function spawnBottom() { const s = 36 + Math.random() * 12; bottomObs.push({ x: Math.random() * (canvas.width - s), y: canvas.height + s, size: s, speed: 3 + Math.random() * 1.6 + score * 0.001 }); }
let topTimer = setInterval(spawnTop, 900);
let bottomTimer = setInterval(spawnBottom, 1000);

/* -------------------- Powerups (shield, slow, bomb) -------------------- */
let powerups = [];
function spawnPowerup() {
  if (powerups.length >= 3) return;
  const types = ['shield', 'slow', 'bomb'];
  const t = types[Math.floor(Math.random() * types.length)];
  powerups.push({ x: Math.random() * (canvas.width - 48), y: Math.random() * (canvas.height - 160) + 80, type: t, ttl: 10 * 60 });
}
let powerTimer = setInterval(spawnPowerup, 8000);

// states
let shieldActive = false, shieldTTL = 0;
let slowActive = false, slowTTL = 0;

/* -------------------- Particles & trail -------------------- */
let particles = [];
let flash = 0;

// spawn blast
function spawnBlast(cx, cy) {
  flash = 14;
  for (let i = 0; i < 50; i++) {
    particles.push({
      x: cx, y: cy,
      vx: (Math.random() - 0.5) * 12,
      vy: (Math.random() - 0.5) * 12 - Math.random() * 3,
      life: 30 + Math.random() * 30,
      size: 3 + Math.random() * 5,
      color: '#ffd54d'
    });
  }
}

// update particles
function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    ctx.fillStyle = p.color || '#ffd54d';
    ctx.fillRect(p.x, p.y, p.size, p.size);
    p.x += p.vx; p.y += p.vy; p.vy += 0.12;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

/* -------------------- Collision helper -------------------- */
function rectHit(a, b) { return a.x < b.x + b.size && a.x + a.size > b.x && a.y < b.y + b.size && a.y + a.size > b.y; }

/* -------------------- Score & max -------------------- */
let score = 0;
let maxScore = Number(localStorage.getItem('maxScore')) || 0;
document.getElementById('maxScoreDisplay').textContent = 'Max: ' + maxScore;

/* -------------------- Haptics helper -------------------- */
function vibratePattern(ms) {
  if (navigator.vibrate) navigator.vibrate(ms);
}

/* -------------------- Game Over & Restart -------------------- */
let gameOver = false;

function endGame() {
  gameOver = true;
  const isNew = score > maxScore;
  if (isNew) {
    // blast + vibrate + sound
    spawnBlast(player.x + player.size / 2, player.y + player.size / 2);
    vibratePattern([60, 30, 60]);
    try { sfxHigh.currentTime = 0; sfxHigh.play().catch(() => { }); } catch (e) { }
    maxScore = score; localStorage.setItem('maxScore', maxScore);
  } else {
    try { sfxHit.currentTime = 0; sfxHit.play().catch(() => { }); } catch (e) { }
  }
  document.getElementById('maxScoreDisplay').textContent = 'Max: ' + maxScore;
  document.getElementById('gameOverText').textContent = 'Score: ' + score;
  document.getElementById('gameOverScreen').style.display = 'flex';
  clearInterval(topTimer); clearInterval(bottomTimer); clearInterval(powerTimer);
}

function restartGame() {
  // reset
  score = 0; gameOver = false;
  topObs = []; bottomObs = []; powerups = []; particles = []; trail = []; flash = 0;
  shieldActive = slowActive = false;
  document.getElementById('pu-shield').classList.remove('used');
  document.getElementById('pu-slow').classList.remove('used');
  document.getElementById('gameOverScreen').style.display = 'none';
  player.x = canvas.width / 2 - player.size / 2; player.y = canvas.height / 2 - player.size / 2;
  topTimer = setInterval(spawnTop, Math.max(220, 900 - Math.floor(score / 3)));
  bottomTimer = setInterval(spawnBottom, Math.max(220, 1000 - Math.floor(score / 3)));
  powerTimer = setInterval(spawnPowerup, 8000);
  update();
}

/* -------------------- Trail logic (ghost images) -------------------- */
function pushTrail() {
  trail.push({ x: player.x, y: player.y, size: player.size, age: 0 });
  if (trail.length > 18) trail.shift();
}
function drawTrail() {
  for (let i = 0; i < trail.length; i++) {
    const t = trail[i];
    const alpha = (1 - i / trail.length) * 0.65;
    const scale = 1 - (i / (trail.length * 1.5));
    const size = player.size * scale;
    drawEmojiAt(PLAYER_EMOJI, t.x + (player.size - size) / 2, t.y + (player.size - size) / 2, Math.round(size), alpha * 0.9);
  }
}

/* -------------------- Draw helper for emoji (uses global font) -------------------- */
function drawEmojiAt(em, x, y, size, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `${size}px serif`;
  ctx.textBaseline = 'top';
  ctx.fillText(em, x, y);
  ctx.restore();
}

/* -------------------- Main update loop -------------------- */
function update() {
  if (gameOver) return;

  // movement
  movePlayer();

  // timers
  if (shieldActive) { shieldTTL--; if (shieldTTL <= 0) { shieldActive = false; document.getElementById('pu-shield').classList.remove('used'); } }
  if (slowActive) { slowTTL--; if (slowTTL <= 0) { slowActive = false; document.getElementById('pu-slow').classList.remove('used'); } }

  // draw background
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#060607';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // top obstacles
  for (let i = topObs.length - 1; i >= 0; i--) {
    const o = topObs[i];
    const sp = slowActive ? o.speed * 0.45 : o.speed;
    o.y += sp;
    ctx.shadowColor = '#ff3b3b'; ctx.shadowBlur = 12;
    ctx.fillStyle = '#d32f2f';
    ctx.fillRect(o.x, o.y, o.size, o.size);
    ctx.shadowBlur = 0;
    if (rectHit(player, o)) {
      if (shieldActive) { shieldActive = false; document.getElementById('pu-shield').classList.remove('used'); spawnBlast(o.x + o.size / 2, o.y + o.size / 2); topObs.splice(i, 1); try { sfxHit.currentTime = 0; sfxHit.play().catch(() => { }); } catch (e) { }; continue; }
      else { endGame(); return; }
    }
    if (o.y > canvas.height + 80) topObs.splice(i, 1);
  }

  // bottom obstacles
  for (let i = bottomObs.length - 1; i >= 0; i--) {
    const o = bottomObs[i];
    const sp = slowActive ? o.speed * 0.45 : o.speed;
    o.y -= sp;
    ctx.shadowColor = '#ffb300'; ctx.shadowBlur = 10;
    ctx.fillStyle = '#ff9800';
    ctx.fillRect(o.x, o.y, o.size, o.size);
    ctx.shadowBlur = 0;
    if (rectHit(player, o)) {
      if (shieldActive) { shieldActive = false; document.getElementById('pu-shield').classList.remove('used'); spawnBlast(o.x + o.size / 2, o.y + o.size / 2); bottomObs.splice(i, 1); try { sfxHit.currentTime = 0; sfxHit.play().catch(() => { }); } catch (e) { }; continue; }
      else { endGame(); return; }
    }
    if (o.y + o.size < -80) bottomObs.splice(i, 1);
  }

  // powerups draw & collect
  for (let i = powerups.length - 1; i >= 0; i--) {
    const pu = powerups[i];
    ctx.font = '32px serif';
    const glyph = pu.type === 'shield' ? '🛡️' : pu.type === 'slow' ? '🐌' : '💣';
    ctx.fillText(glyph, pu.x, pu.y);

    const puBox = { x: pu.x, y: pu.y, size: 40 };
    if (rectHit(player, puBox)) {
      // collect & effect
      try { sfxPower.currentTime = 0; sfxPower.play().catch(() => { }); } catch (e) { }
      if (pu.type === 'shield') { shieldActive = true; shieldTTL = 9 * 60; document.getElementById('pu-shield').classList.add('used'); vibratePattern(30); }
      else if (pu.type === 'slow') { slowActive = true; slowTTL = 7 * 60; document.getElementById('pu-slow').classList.add('used'); vibratePattern([60, 30]); }
      else { spawnBlast(player.x + player.size / 2, player.y + player.size / 2); powerups = []; topObs = []; bottomObs = []; try { sfxBlast.currentTime = 0; sfxBlast.play().catch(() => { }); } catch (e) { }; vibratePattern([120, 40, 120]); }
      powerups.splice(i, 1);
      continue;
    }
    pu.ttl--;
    if (pu.ttl <= 0) powerups.splice(i, 1);
  }

  // push trail and draw it
  pushTrail();
  drawTrail();

  // draw emoji player with glow (slight shadow for glow)
  ctx.save();
  ctx.shadowColor = 'rgba(0,230,200,0.46)';
  ctx.shadowBlur = 22;
  drawEmojiAt(PLAYER_EMOJI, player.x, player.y, player.size, 1);
  ctx.restore();

  // particles & flash
  if (flash > 0) { ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.fillRect(0, 0, canvas.width, canvas.height); flash--; }
  updateParticles();

  // score
  score++;
  document.getElementById('scoreDisplay').textContent = 'Score: ' + score;
  document.getElementById('maxScoreDisplay').textContent = 'Max: ' + maxScore;

  requestAnimationFrame(update);
}

/* -------------------- Start game flow -------------------- */
function startGame() {
  // hide start screen
  startScreen.style.display = 'none';
  // set selected emoji
  PLAYER_EMOJI = localStorage.getItem('playerEmoji') || PLAYER_EMOJI || EMOJI_SET[0];
  // set player size proportional to canvas to look good
  player.size = Math.max(40, Math.min(72, Math.round(Math.min(canvas.width, canvas.height) * 0.06)));
  // center player
  player.x = canvas.width / 2 - player.size / 2;
  player.y = canvas.height / 2 - player.size / 2;
  // start spawn timers (they exist already; ensure they run)
  clearInterval(topTimer); clearInterval(bottomTimer); clearInterval(powerTimer);
  topTimer = setInterval(spawnTop, Math.max(220, 900 - Math.floor(score / 3)));
  bottomTimer = setInterval(spawnBottom, Math.max(220, 1000 - Math.floor(score / 3)));
  powerTimer = setInterval(spawnPowerup, 8000);
  update();
}

buildEmojiGrid();
chosenEmojiSpan.textContent = PLAYER_EMOJI;

// ensure joystick scale matches initial size
updateJoystickScale();
