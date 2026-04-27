import {
  canEat,
  clampCamera,
  createInitialState,
  spawnSquirrel,
  updateState,
} from "./squirrelLogic.mjs";

const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const view = { width: canvas.width, height: canvas.height };
const input = { up: false, down: false, left: false, right: false };
let state = createInitialState();
let started = false;
let lastTime = performance.now();

const keyMap = new Map([
  ["ArrowUp", "up"],
  ["KeyW", "up"],
  ["ArrowDown", "down"],
  ["KeyS", "down"],
  ["ArrowLeft", "left"],
  ["KeyA", "left"],
  ["ArrowRight", "right"],
  ["KeyD", "right"],
]);

function createRng(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let mixed = value;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

function seedWorld() {
  const random = createRng(0x51a7e11);
  state = createInitialState();
  for (let i = 0; i < 58; i += 1) {
    spawnSquirrel(state, random);
  }
  const safePath = {
    left: state.player.x - 120,
    right: state.player.x + 560,
    top: state.player.y - 240,
    bottom: state.player.y + 260,
  };
  state.squirrels = state.squirrels.filter((squirrel) => {
    const inStarterPath = squirrel.x > safePath.left && squirrel.x < safePath.right && squirrel.y > safePath.top && squirrel.y < safePath.bottom;
    return !inStarterPath || squirrel.radius <= 18;
  });
  state.squirrels.push(
    { id: 9001, x: state.player.x + 92, y: state.player.y, radius: 12, vx: 0, vy: 0, phase: 0 },
    { id: 9002, x: state.player.x + 430, y: state.player.y + 150, radius: 42, vx: -14, vy: 10, phase: 1.4 },
  );
  state.camera = clampCamera(state.player, view, state.world);
}

function restart() {
  started = true;
  seedWorld();
}

function drawTree(x, y) {
  const sx = x - state.camera.x;
  const sy = y - state.camera.y;
  ctx.fillStyle = "#7b5b32";
  ctx.fillRect(sx - 5, sy + 12, 10, 26);
  ctx.fillStyle = "#386d36";
  ctx.beginPath();
  ctx.arc(sx, sy, 28, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#4f8d40";
  ctx.beginPath();
  ctx.arc(sx - 12, sy - 8, 18, 0, Math.PI * 2);
  ctx.arc(sx + 14, sy - 10, 20, 0, Math.PI * 2);
  ctx.fill();
}

function drawSquirrel(entity, isPlayer) {
  const bounce = Math.sin(state.elapsed * 8 + (entity.phase ?? 0)) * 4;
  const x = entity.x - state.camera.x;
  const y = entity.y - state.camera.y + bounce;
  const edible = !isPlayer && canEat(state.player, entity);
  const body = isPlayer ? "#b85d2f" : edible ? "#c98d54" : "#74452f";
  const tail = isPlayer ? "#e07b3d" : edible ? "#e2ad70" : "#5a3325";

  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = tail;
  ctx.beginPath();
  ctx.ellipse(-entity.radius * 0.76, -entity.radius * 0.2, entity.radius * 0.46, entity.radius * 0.78, -0.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(0, 0, entity.radius * 0.9, entity.radius * 0.72, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(entity.radius * 0.56, -entity.radius * 0.36, entity.radius * 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2a1a12";
  ctx.beginPath();
  ctx.arc(entity.radius * 0.68, -entity.radius * 0.44, Math.max(2, entity.radius * 0.08), 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f6d39b";
  ctx.beginPath();
  ctx.arc(entity.radius * 0.86, -entity.radius * 0.26, Math.max(2, entity.radius * 0.09), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBackground() {
  ctx.fillStyle = "#9fcf78";
  ctx.fillRect(0, 0, view.width, view.height);
  ctx.strokeStyle = "rgba(52, 103, 45, 0.22)";
  ctx.lineWidth = 1;
  const grid = 120;
  const startX = -state.camera.x % grid;
  const startY = -state.camera.y % grid;
  for (let x = startX; x < view.width; x += grid) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, view.height);
    ctx.stroke();
  }
  for (let y = startY; y < view.height; y += grid) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(view.width, y);
    ctx.stroke();
  }
  for (let y = 160; y < state.world.height; y += 360) {
    for (let x = 130; x < state.world.width; x += 420) {
      const visible = x > state.camera.x - 60 && x < state.camera.x + view.width + 60 && y > state.camera.y - 70 && y < state.camera.y + view.height + 80;
      if (visible) drawTree(x, y);
    }
  }
}

function drawHud() {
  ctx.fillStyle = "rgba(255, 247, 219, 0.9)";
  ctx.fillRect(16, 14, 245, 62);
  ctx.strokeStyle = "#203820";
  ctx.strokeRect(16, 14, 245, 62);
  ctx.fillStyle = "#172113";
  ctx.font = "700 20px Arial";
  ctx.fillText(`Score ${state.score}`, 30, 40);
  ctx.font = "14px Arial";
  ctx.fillText(`Size ${Math.round(state.player.radius)}  World ${Math.round(state.player.x)}, ${Math.round(state.player.y)}`, 30, 62);
}

function drawOverlay(title, subtitle) {
  ctx.fillStyle = "rgba(20, 34, 18, 0.66)";
  ctx.fillRect(0, 0, view.width, view.height);
  ctx.fillStyle = "#fff7db";
  ctx.textAlign = "center";
  ctx.font = "700 46px Arial";
  ctx.fillText(title, view.width / 2, view.height / 2 - 38);
  ctx.font = "20px Arial";
  ctx.fillText(subtitle, view.width / 2, view.height / 2 + 8);
  ctx.fillText("Move with WASD or arrows. Eat smaller squirrels. Press F for fullscreen.", view.width / 2, view.height / 2 + 42);
  ctx.textAlign = "start";
}

function render() {
  drawBackground();
  const sorted = [...state.squirrels].sort((a, b) => a.y - b.y);
  for (const squirrel of sorted) drawSquirrel(squirrel, false);
  drawSquirrel(state.player, true);
  drawHud();
  if (!started) drawOverlay("Squirrel Eat Squirrel", "Click or press Space to start");
  if (state.mode === "gameover") drawOverlay("Too Big To Bite", "Press Space to try again");
}

function update(dt) {
  if (started && state.mode === "playing") {
    updateState(state, input, dt, view);
    while (state.squirrels.length < 62) spawnSquirrel(state);
  }
}

function frame(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  update(dt);
  render();
  requestAnimationFrame(frame);
}

window.addEventListener("keydown", (event) => {
  if (event.code === "Space") {
    if (!started || state.mode === "gameover") restart();
  }
  if (event.code === "KeyF") {
    if (document.fullscreenElement) document.exitFullscreen();
    else canvas.requestFullscreen();
  }
  const key = keyMap.get(event.code);
  if (key) input[key] = true;
});

window.addEventListener("keyup", (event) => {
  const key = keyMap.get(event.code);
  if (key) input[key] = false;
});

canvas.addEventListener("pointerdown", () => {
  if (!started || state.mode === "gameover") restart();
});

window.render_game_to_text = () => JSON.stringify({
  coordinateSystem: "world origin top-left; x right, y down",
  mode: started ? state.mode : "menu",
  score: state.score,
  player: {
    x: Math.round(state.player.x),
    y: Math.round(state.player.y),
    radius: Math.round(state.player.radius),
    vx: Math.round(state.player.vx),
    vy: Math.round(state.player.vy),
  },
  camera: state.camera,
  visibleSquirrels: state.squirrels
    .filter((s) => s.x >= state.camera.x - 80 && s.x <= state.camera.x + view.width + 80 && s.y >= state.camera.y - 80 && s.y <= state.camera.y + view.height + 80)
    .slice(0, 12)
    .map((s) => ({
      id: s.id,
      x: Math.round(s.x),
      y: Math.round(s.y),
      radius: Math.round(s.radius),
      edible: canEat(state.player, s),
    })),
});

window.advanceTime = (ms) => {
  const steps = Math.max(1, Math.round(ms / (1000 / 60)));
  for (let i = 0; i < steps; i += 1) update(1 / 60);
  render();
};

seedWorld();
render();
requestAnimationFrame(frame);
