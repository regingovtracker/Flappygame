const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const W = canvas.width;
const H = canvas.height;

const GROUND_H = 80;
const GRAVITY = 0.45;
const FLAP = -7.6;
const PIPE_W = 64;
const PIPE_GAP = 150;
const PIPE_SPACING = 220;
const PIPE_SPEED = 2.4;

const bird = { x: 90, y: H / 2, r: 14, vy: 0, rot: 0 };
const HIT_R = bird.r - 3;
let pipes = [];
let score = 0;
let best = Number(localStorage.getItem("flappy-best") || 0);
let state = "ready";
let frame = 0;
let clouds = Array.from({ length: 5 }, () => ({
  x: Math.random() * W,
  y: 40 + Math.random() * 160,
  s: 0.6 + Math.random() * 0.8,
  v: 0.2 + Math.random() * 0.3,
}));

function reset() {
  bird.y = H / 2;
  bird.vy = 0;
  bird.rot = 0;
  pipes = [];
  score = 0;
  frame = 0;
  spawnPipe(W + 120);
}

function spawnPipe(x) {
  const margin = 60;
  const topH = margin + Math.random() * (H - GROUND_H - PIPE_GAP - margin * 2);
  pipes.push({ x, topH, scored: false });
}

function flap() {
  if (state === "ready") {
    state = "playing";
    bird.vy = FLAP;
  } else if (state === "playing") {
    bird.vy = FLAP;
  } else if (state === "over") {
    reset();
    state = "ready";
  }
}

window.addEventListener("keydown", (e) => {
  if (e.code === "Space" || e.code === "ArrowUp") {
    e.preventDefault();
    flap();
  }
});
canvas.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  flap();
});

function update() {
  frame++;
  for (const c of clouds) {
    c.x -= c.v;
    if (c.x < -60) {
      c.x = W + 60;
      c.y = 40 + Math.random() * 160;
    }
  }

  if (state !== "playing") return;

  bird.vy += GRAVITY;
  bird.y += bird.vy;
  bird.rot = Math.max(-0.5, Math.min(1.2, bird.vy / 10));

  const lastPipe = pipes[pipes.length - 1];
  if (!lastPipe || lastPipe.x <= W - PIPE_SPACING) {
    spawnPipe(lastPipe ? lastPipe.x + PIPE_SPACING : W + 40);
  }

  for (const p of pipes) {
    p.x -= PIPE_SPEED;
    if (!p.scored && p.x + PIPE_W < bird.x) {
      p.scored = true;
      score++;
    }
  }
  pipes = pipes.filter((p) => p.x + PIPE_W > -20);

  if (bird.y - HIT_R < 0 || bird.y + HIT_R > H - GROUND_H) {
    return gameOver();
  }

  for (const p of pipes) {
    const inX = bird.x + HIT_R > p.x && bird.x - HIT_R < p.x + PIPE_W;
    const inTop = bird.y - HIT_R < p.topH;
    const inBottom = bird.y + HIT_R > p.topH + PIPE_GAP;
    if (inX && (inTop || inBottom)) {
      return gameOver();
    }
  }
}

function gameOver() {
  state = "over";
  if (score > best) {
    best = score;
    localStorage.setItem("flappy-best", String(best));
  }
}

function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#4ec0ca");
  sky.addColorStop(1, "#a8e6cf");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "rgba(255,255,255,0.85)";
  for (const c of clouds) {
    ctx.beginPath();
    ctx.arc(c.x, c.y, 16 * c.s, 0, Math.PI * 2);
    ctx.arc(c.x + 14 * c.s, c.y + 4 * c.s, 12 * c.s, 0, Math.PI * 2);
    ctx.arc(c.x - 14 * c.s, c.y + 5 * c.s, 11 * c.s, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#ded895";
  ctx.fillRect(0, H - GROUND_H, W, GROUND_H);
  ctx.fillStyle = "#7ec850";
  ctx.fillRect(0, H - GROUND_H, W, 14);
}

function drawPipes() {
  for (const p of pipes) {
    const bottomY = p.topH + PIPE_GAP;
    ctx.fillStyle = "#5fb84f";
    ctx.strokeStyle = "#3e7d33";
    ctx.lineWidth = 3;
    ctx.fillRect(p.x, -4, PIPE_W, p.topH + 4);
    ctx.strokeRect(p.x, -4, PIPE_W, p.topH + 4);
    ctx.fillRect(p.x, bottomY, PIPE_W, H - GROUND_H - bottomY + 4);
    ctx.strokeRect(p.x, bottomY, PIPE_W, H - GROUND_H - bottomY + 4);
    ctx.fillStyle = "#6fd15f";
    ctx.fillRect(p.x - 4, p.topH - 24, PIPE_W + 8, 24);
    ctx.strokeRect(p.x - 4, p.topH - 24, PIPE_W + 8, 24);
    ctx.fillRect(p.x - 4, bottomY, PIPE_W + 8, 24);
    ctx.strokeRect(p.x - 4, bottomY, PIPE_W + 8, 24);
  }
}

function drawBird() {
  ctx.save();
  ctx.translate(bird.x, bird.y);
  ctx.rotate(bird.rot);
  ctx.fillStyle = "#ffd93b";
  ctx.strokeStyle = "#d9a400";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, 0, bird.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(5, -4, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#222";
  ctx.beginPath();
  ctx.arc(6.5, -4, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ff8c42";
  ctx.beginPath();
  ctx.moveTo(bird.r - 2, 0);
  ctx.lineTo(bird.r + 8, 3);
  ctx.lineTo(bird.r - 2, 7);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#f0b429";
  ctx.beginPath();
  ctx.ellipse(-4, 4, 7, 4.5, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawText(txt, y, size, color) {
  ctx.font = `bold ${size}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.lineWidth = 5;
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.strokeText(txt, W / 2, y);
  ctx.fillStyle = color;
  ctx.fillText(txt, W / 2, y);
}

function draw() {
  drawBackground();
  drawPipes();
  drawBird();

  if (state === "playing") {
    drawText(String(score), 70, 40, "#fff");
  } else if (state === "ready") {
    drawText("FLAPPY", H / 2 - 60, 42, "#fff");
    drawText("Tap to start", H / 2 + 10, 20, "#fff");
    drawText(`Best: ${best}`, H / 2 + 44, 18, "#fff");
  } else if (state === "over") {
    drawText("Game Over", H / 2 - 40, 36, "#fff");
    drawText(`Score: ${score}`, H / 2, 22, "#fff");
    drawText(`Best: ${best}`, H / 2 + 30, 20, "#ffe066");
    drawText("Tap to retry", H / 2 + 70, 18, "#fff");
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

reset();
loop();
