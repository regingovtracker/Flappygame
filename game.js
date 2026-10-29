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

const cat = { x: 90, y: H / 2, r: 14, vy: 0, rot: 0 };
const HIT_R = cat.r - 3;
let pipes = [];
let score = 0;
let best = Number(localStorage.getItem("flappy-best") || 0);
let top5 = JSON.parse(localStorage.getItem("flappy-top5") || "[]");
let state = "ready";
let frame = 0;
let newRecord = false;
let clouds = Array.from({ length: 5 }, () => ({
  x: Math.random() * W,
  y: 40 + Math.random() * 160,
  s: 0.6 + Math.random() * 0.8,
  v: 0.2 + Math.random() * 0.3,
}));

function reset() {
  cat.y = H / 2;
  cat.vy = 0;
  cat.rot = 0;
  pipes = [];
  score = 0;
  frame = 0;
  newRecord = false;
  spawnPipe(W + 240);
}

function spawnPipe(x) {
  const margin = 60;
  const topH = margin + Math.random() * (H - GROUND_H - PIPE_GAP - margin * 2);
  pipes.push({ x, topH, scored: false });
}

function flap() {
  if (state === "ready") {
    state = "playing";
    cat.vy = FLAP;
  } else if (state === "playing") {
    cat.vy = FLAP;
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

  cat.vy += GRAVITY;
  cat.y += cat.vy;
  cat.rot = Math.max(-0.5, Math.min(1.2, cat.vy / 10));

  const lastPipe = pipes[pipes.length - 1];
  if (!lastPipe || lastPipe.x <= W - PIPE_SPACING) {
    spawnPipe(lastPipe ? lastPipe.x + PIPE_SPACING : W + 40);
  }

  for (const p of pipes) {
    p.x -= PIPE_SPEED;
    if (!p.scored && p.x + PIPE_W < cat.x) {
      p.scored = true;
      score++;
    }
  }
  pipes = pipes.filter((p) => p.x + PIPE_W > -20);

  if (cat.y - HIT_R < 0 || cat.y + HIT_R > H - GROUND_H) {
    return gameOver();
  }

  for (const p of pipes) {
    const inX = cat.x + HIT_R > p.x && cat.x - HIT_R < p.x + PIPE_W;
    const inTop = cat.y - HIT_R < p.topH;
    const inBottom = cat.y + HIT_R > p.topH + PIPE_GAP;
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
    newRecord = score > 0;
  }
  top5.push(score);
  top5.sort((a, b) => b - a);
  top5 = top5.slice(0, 5);
  localStorage.setItem("flappy-top5", JSON.stringify(top5));
}

function medalFor(s) {
  if (s >= 100) return { label: "Gold", color: "#ffd700" };
  if (s >= 50) return { label: "Silver", color: "#c0c0c0" };
  if (s >= 10) return { label: "Bronze", color: "#cd7f32" };
  return null;
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

function drawCat() {
  const r = cat.r;
  ctx.save();
  ctx.translate(cat.x, cat.y);
  ctx.rotate(cat.rot);

  ctx.fillStyle = "#3a3a3a";
  ctx.beginPath();
  ctx.ellipse(-r - 2, 2, 5, 3, -0.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#b9b9b9";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#e8823c";
  ctx.beginPath();
  ctx.moveTo(-r + 2, -r + 4);
  ctx.lineTo(-r + 7, -r - 6);
  ctx.lineTo(-r + 12, -r + 2);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(r - 2, -r + 4);
  ctx.lineTo(r - 7, -r - 6);
  ctx.lineTo(r - 12, -r + 2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#3a3a3a";
  ctx.beginPath();
  ctx.moveTo(-r + 3, -r + 3);
  ctx.lineTo(-r + 6, -r - 4);
  ctx.lineTo(-r + 10, -r + 1);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(r - 3, -r + 3);
  ctx.lineTo(r - 6, -r - 4);
  ctx.lineTo(r - 10, -r + 1);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#e8823c";
  ctx.beginPath();
  ctx.arc(-6, -2, 6.5, Math.PI * 0.15, Math.PI * 0.95);
  ctx.arc(6, -2, 6.5, Math.PI * 1.05, Math.PI * 1.85);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(5, -3, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#222";
  ctx.beginPath();
  ctx.arc(6.5, -3, 2.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ff9db4";
  ctx.beginPath();
  ctx.moveTo(-2, 3);
  ctx.lineTo(2, 3);
  ctx.lineTo(0, 6);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#999";
  ctx.lineWidth = 1;
  for (const [sx, sy] of [[-8, 3], [-9, 6], [8, 3], [9, 6]]) {
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + (sx < 0 ? -5 : 5), sy + 1);
    ctx.stroke();
  }
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
  drawCat();

  if (state === "playing") {
    drawText(String(score), 70, 40, "#fff");
  } else if (state === "ready") {
    drawText("FLAPPY CAT", H / 2 - 90, 40, "#fff");
    drawText("Tap to start", H / 2 - 20, 20, "#fff");
    drawLeaderboard(H / 2 + 10);
  } else if (state === "over") {
    drawText("Game Over", H / 2 - 110, 34, "#fff");
    drawText(`Score: ${score}`, H / 2 - 70, 24, "#fff");
    if (newRecord) drawText("New best!", H / 2 - 42, 18, "#ffe066");
    const m = medalFor(score);
    if (m) drawText(`${m.label} medal!`, H / 2 - 16, 20, m.color);
    drawLeaderboard(H / 2 + 16);
    drawText("Tap to retry", H - GROUND_H - 24, 18, "#fff");
  }
}

function drawLeaderboard(y) {
  drawText("Top 5", y, 18, "#fff");
  const rows = top5.length ? top5 : [0, 0, 0, 0, 0];
  rows.slice(0, 5).forEach((s, i) => {
    drawText(`${i + 1}. ${s}`, y + 24 + i * 20, 15, i === 0 ? "#ffe066" : "#fff");
  });
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

reset();
loop();
