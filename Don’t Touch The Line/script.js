// script.js - Final cleaned version
// Emoji Escape — core game logic
// Features: joystick (mobile), keyboard, mouse, top/bottom obstacles,
// power-ups (shield, slow, bomb), particles, blast on new high score,
// controlled spawns, stable restart, no duplicate declarations.

// ---------- Canvas setup ----------
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

// ---------- Audio elements ----------
const sfxHit = document.getElementById('sfx-hit');
const sfxBlast = document.getElementById('sfx-blast');
const sfxPower = document.getElementById('sfx-power');
const sfxHigh = document.getElementById('sfx-high');

// mobile autoplay: prepare audio on first user interaction
function initAudioOnce() {
  [sfxHit, sfxBlast, sfxPower, sfxHigh].forEach(a => {
    try { a.volume = 0.9; } catch(e){}
  });
  window.removeEventListener('pointerdown', initAudioOnce);
}
window.addEventListener('pointerdown', initAudioOnce);

// ---------- Player ----------
const player = {
  x: innerWidth / 2 - 22,
  y: innerHeight / 2 - 22,
  size: 44,
  speed: 6
};

// movement state
const keys = { left:false, right:false, up:false, down:false };

// keyboard controls
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

// optional mouse assist movement
document.addEventListener('mousemove', e => {
  const cx = player.x + player.size/2;
  const cy = player.y + player.size/2;
  if (Math.abs(e.clientX - cx) > 8) {
    if (e.clientX < cx) { keys.left = true; keys.right = false; }
    else { keys.right = true; keys.left = false; }
  } else { keys.left = keys.right = false; }
  if (Math.abs(e.clientY - cy) > 8) {
    if (e.clientY < cy) { keys.up = true; keys.down = false; }
    else { keys.down = true; keys.up = false; }
  } else { keys.up = keys.down = false; }
});

// touch direct follow (if user drags outside joystick)
document.addEventListener('touchmove', e => {
  if (!e.touches || !e.touches[0]) return;
  const t = e.touches[0];
  const joyRect = document.getElementById('joystickOuter').getBoundingClientRect();
  // only move player if touch is outside joystick area
  if (t.clientX < joyRect.left || t.clientX > joyRect.right || t.clientY < joyRect.top || t.clientY > joyRect.bottom) {
    player.x = t.clientX - player.size/2;
    player.y = t.clientY - player.size/2;
  }
}, { passive: true });

// ---------- Joystick (mobile) ----------
const joyOut = document.getElementById('joystickOuter');
const joyIn = document.getElementById('joystickInner');
let joyActive = false, joyX = 0, joyY = 0;

joyOut.addEventListener('touchstart', () => { joyActive = true; });
joyOut.addEventListener('touchmove', e => {
  const rect = joyOut.getBoundingClientRect();
  const t = e.touches[0];
  const x = t.clientX - (rect.left + rect.width/2);
  const y = t.clientY - (rect.top + rect.height/2);
  const max = 40;
  const dist = Math.sqrt(x*x + y*y) || 1;
  const limit = dist > max ? max / dist : 1;
  joyX = x * limit;
  joyY = y * limit;
  joyIn.style.left = (rect.width/2 - joyIn.offsetWidth/2 + joyX) + 'px';
  joyIn.style.top  = (rect.height/2 - joyIn.offsetHeight/2 + joyY) + 'px';
  e.preventDefault();
}, { passive:false });
joyOut.addEventListener('touchend', () => {
  joyActive = false;
  joyX = joyY = 0;
  joyIn.style.left = '38px';
  joyIn.style.top  = '38px';
});

// ---------- Move player ----------
function movePlayer() {
  let sp = player.speed;
  if (keys.left) player.x -= sp;
  if (keys.right) player.x += sp;
  if (keys.up) player.y -= sp;
  if (keys.down) player.y += sp;
  if (joyActive) {
    player.x += joyX * 0.14;
    player.y += joyY * 0.14;
  }
  // clamp to screen
  player.x = Math.max(0, Math.min(canvas.width - player.size, player.x));
  player.y = Math.max(0, Math.min(canvas.height - player.size, player.y));
}

// ---------- Obstacles (top & bottom only) ----------
let topObs = [], bottomObs = [];
let topTimer = null, bottomTimer = null;

function spawnTop() {
  const s = 36 + Math.random() * 12;
  topObs.push({ x: Math.random() * (canvas.width - s), y: -s, size: s, speed: 3 + Math.random() * 1.8 + score * 0.0015 });
}
function spawnBottom() {
  const s = 36 + Math.random() * 12;
  bottomObs.push({ x: Math.random() * (canvas.width - s), y: canvas.height + s, size: s, speed: 3 + Math.random() * 1.8 + score * 0.0015 });
}
function startSpawnTimers() {
  stopSpawnTimers();
  topTimer = setInterval(spawnTop, Math.max(220, 900 - Math.floor(score / 3)));
  bottomTimer = setInterval(spawnBottom, Math.max(220, 1000 - Math.floor(score / 3)));
}
function stopSpawnTimers() {
  if (topTimer) { clearInterval(topTimer); topTimer = null; }
  if (bottomTimer) { clearInterval(bottomTimer); bottomTimer = null; }
}

// ---------- Power-Ups (shield, slow, bomb) ----------
let powerups = [];
let powerSpawner = null;

function spawnPowerupOnce() {
  if (powerups.length >= 3) return;
  const types = ['shield', 'slow', 'bomb'];
  const type = types[Math.floor(Math.random() * types.length)];
  powerups.push({
    x: Math.random() * (canvas.width - 40),
    y: Math.random() * (canvas.height - 160) + 80,
    type,
    ttl: 10 * 60
  });
}
function startPowerSpawner() {
  if (powerSpawner) clearInterval(powerSpawner);
  powerSpawner = setInterval(() => {
    if (powerups.length < 3) spawnPowerupOnce();
  }, Math.max(5000, 9000 + Math.floor(score / 10)));
}
function stopPowerSpawner() { if (powerSpawner) clearInterval(powerSpawner); powerSpawner = null; }

// power-up states
let shieldActive = false, shieldTTL = 0;
let slowActive = false, slowTTL = 0;

// collect power-up by index
function collectPowerupAtIndex(i) {
  const pu = powerups[i];
  if (!pu) return;
  try { sfxPower.currentTime = 0; sfxPower.play().catch(()=>{}); } catch(e){}
  if (pu.type === 'shield') {
    shieldActive = true; shieldTTL = 9 * 60;
    document.getElementById('pu-shield').classList.add('used');
  } else if (pu.type === 'slow') {
    slowActive = true; slowTTL = 7 * 60;
    document.getElementById('pu-slow').classList.add('used');
  } else if (pu.type === 'bomb') {
    spawnBlast(player.x + player.size/2, player.y + player.size/2);
    topObs = []; bottomObs = []; powerups = [];
    try { sfxBlast.currentTime = 0; sfxBlast.play().catch(()=>{}); } catch(e){}
  }
  powerups.splice(i, 1);
}

// ---------- Particles & blast ----------
let particles = [];
let flash = 0;

function spawnBlast(cx, cy) {
  flash = 14;
  for (let i = 0; i < 60; i++) {
    particles.push({
      x: cx, y: cy,
      vx: (Math.random() - 0.5) * 14,
      vy: (Math.random() - 0.5) * 14,
      life: 30 + Math.random() * 30,
      size: 3 + Math.random() * 6,
      color: '#ff8a65'
    });
  }
}

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

// ---------- Utility collision ----------
function rectHit(a, b) {
  // a and b: {x, y, size}
  return a.x < b.x + b.size && a.x + a.size > b.x && a.y < b.y + b.size && a.y + a.size > b.y;
}

// ---------- Score, HUD, power timers ----------
let score = 0;
let maxScore = Number(localStorage.getItem('maxScore')) || 0;
document.getElementById('maxScoreDisplay').textContent = 'Max: ' + maxScore;

function tickPowerTimers() {
  if (shieldActive) {
    shieldTTL--;
    if (shieldTTL <= 0) {
      shieldActive = false;
      document.getElementById('pu-shield').classList.remove('used');
    }
  }
  if (slowActive) {
    slowTTL--;
    if (slowTTL <= 0) {
      slowActive = false;
      document.getElementById('pu-slow').classList.remove('used');
    }
  }
}

// ---------- Game over & restart ----------
let gameOver = false;

function endGame() {
  gameOver = true;
  const isNew = score > maxScore;
  if (isNew) {
    spawnBlast(player.x + player.size/2, player.y + player.size/2);
    try { sfxHigh.currentTime = 0; sfxHigh.play().catch(()=>{}); } catch(e){}
    maxScore = score;
    localStorage.setItem('maxScore', maxScore);
  } else {
    try { sfxHit.currentTime = 0; sfxHit.play().catch(()=>{}); } catch(e){}
  }
  document.getElementById('maxScoreDisplay').textContent = 'Max: ' + maxScore;
  document.getElementById('gameOverText').textContent = 'Score: ' + score;
  document.getElementById('gameOverScreen').style.display = 'flex';
  // stop spawns
  stopSpawnTimers(); stopPowerSpawner();
}

function restartGame() {
  score = 0; gameOver = false;
  topObs = []; bottomObs = []; powerups = []; particles = []; flash = 0;
  shieldActive = slowActive = false;
  document.getElementById('pu-shield').classList.remove('used');
  document.getElementById('pu-slow').classList.remove('used');
  document.getElementById('gameOverScreen').style.display = 'none';
  player.x = canvas.width/2 - player.size/2; player.y = canvas.height/2 - player.size/2;
  startSpawnTimers(); startPowerSpawner();
  update();
}

// ---------- Main update loop ----------
function update() {
  if (gameOver) return;

  movePlayer();
  tickPowerTimers();

  // drawing
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // subtle background
  ctx.fillStyle = '#070707';
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
      if (shieldActive) {
        shieldActive = false;
        document.getElementById('pu-shield').classList.remove('used');
        spawnBlast(o.x + o.size/2, o.y + o.size/2);
        topObs.splice(i, 1);
        try { sfxHit.currentTime = 0; sfxHit.play().catch(()=>{}); } catch(e){}
        continue;
      } else { endGame(); return; }
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
      if (shieldActive) {
        shieldActive = false;
        document.getElementById('pu-shield').classList.remove('used');
        spawnBlast(o.x + o.size/2, o.y + o.size/2);
        bottomObs.splice(i, 1);
        try { sfxHit.currentTime = 0; sfxHit.play().catch(()=>{}); } catch(e){}
        continue;
      } else { endGame(); return; }
    }
    if (o.y + o.size < -80) bottomObs.splice(i, 1);
  }

  // power-ups draw & collect using 40x40 hitbox
  for (let i = powerups.length - 1; i >= 0; i--) {
    const pu = powerups[i];
    ctx.font = '32px serif';
    const glyph = pu.type === 'shield' ? '🛡️' : pu.type === 'slow' ? '🐌' : '💣';
    ctx.fillText(glyph, pu.x, pu.y);

    const puBox = { x: pu.x, y: pu.y, size: 40 };
    if (rectHit(player, puBox)) {
      collectPowerupAtIndex(i);
      continue;
    }
    pu.ttl--;
    if (pu.ttl <= 0) powerups.splice(i, 1);
  }

  // draw player
  ctx.save();
  ctx.shadowColor = '#00e6c6'; ctx.shadowBlur = 14;
  ctx.fillStyle = '#00d4c0';
  ctx.fillRect(player.x, player.y, player.size, player.size);
  ctx.restore();

  // particles & flash
  if (flash > 0) { ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(0,0,canvas.width,canvas.height); flash--; }
  updateParticles();

  // score & HUD
  score++;
  document.getElementById('scoreDisplay').textContent = 'Score: ' + score;
  document.getElementById('maxScoreDisplay').textContent = 'Max: ' + maxScore;

  requestAnimationFrame(update);
}

// ---------- Start spawners & game ----------
startSpawnTimers();
startPowerSpawner();
update();
