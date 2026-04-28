import {
  canEat,
  clampCamera,
  createInitialState,
  spawnSquirrel,
  updateState,
} from "./squirrelLogic.mjs";
import {
  CHARACTER_CHOICES,
  DEFAULT_CHARACTER,
  normalizeCharacterChoice,
} from "./characterSkins.mjs";

const canvas = document.querySelector("#game");
const characterPicker = document.querySelector(".character-picker");
const characterButtons = [...document.querySelectorAll("[data-character]")];
const ctx = canvas.getContext("2d");
const view = { width: canvas.width, height: canvas.height };
const input = { up: false, down: false, left: false, right: false };
let selectedCharacter = DEFAULT_CHARACTER;
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

function characterPalette(characterId, edible, isPlayer) {
  if (!isPlayer) {
    return edible
      ? { body: "#c98d54", bodyDark: "#85502e", belly: "#f3c989", tail: "#e2ad70", tailDark: "#9b5b2e", accent: "#5b321f" }
      : { body: "#74452f", bodyDark: "#3f251b", belly: "#b4825b", tail: "#5a3325", tailDark: "#2e1b15", accent: "#26150f" };
  }

  if (characterId === "chipmunk") {
    return { body: "#b8793e", bodyDark: "#6f3f22", belly: "#f3d19a", tail: "#8f5a31", tailDark: "#4a2a19", accent: "#fff0c7" };
  }
  if (characterId === "fox") {
    return { body: "#c8642e", bodyDark: "#743217", belly: "#fff0d0", tail: "#d87338", tailDark: "#6f321b", accent: "#2b1b13" };
  }
  return { body: "#b85d2f", bodyDark: "#66311b", belly: "#f6d39b", tail: "#e07b3d", tailDark: "#8c4323", accent: "#2a1a12" };
}

function fillShadedEllipse(x, y, radiusX, radiusY, color, shade, rotation = 0) {
  const gradient = ctx.createRadialGradient(x - radiusX * 0.32, y - radiusY * 0.38, 1, x, y, Math.max(radiusX, radiusY));
  gradient.addColorStop(0, "#fff2c9");
  gradient.addColorStop(0.18, color);
  gradient.addColorStop(1, shade);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(x, y, radiusX, radiusY, rotation, 0, Math.PI * 2);
  ctx.fill();
}

function drawEye(radius) {
  ctx.fillStyle = "#20130d";
  ctx.beginPath();
  ctx.arc(radius * 0.68, -radius * 0.44, Math.max(2, radius * 0.08), 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff7db";
  ctx.beginPath();
  ctx.arc(radius * 0.7, -radius * 0.47, Math.max(1, radius * 0.028), 0, Math.PI * 2);
  ctx.fill();
}

function drawSquirrelShape(entity, palette) {
  const r = entity.radius;

  ctx.fillStyle = palette.tailDark;
  ctx.beginPath();
  ctx.ellipse(-r * 0.9, -r * 0.08, r * 0.42, r * 0.9, -0.58, 0, Math.PI * 2);
  ctx.ellipse(-r * 0.98, -r * 0.64, r * 0.35, r * 0.48, 0.18, 0, Math.PI * 2);
  ctx.fill();
  fillShadedEllipse(-r * 0.72, -r * 0.28, r * 0.4, r * 0.78, palette.tail, palette.tailDark, -0.5);
  ctx.strokeStyle = "rgba(255, 231, 169, 0.5)";
  ctx.lineWidth = Math.max(2, r * 0.08);
  ctx.beginPath();
  ctx.arc(-r * 0.9, -r * 0.46, r * 0.45, Math.PI * 0.86, Math.PI * 1.72);
  ctx.stroke();

  fillShadedEllipse(0, 0, r * 0.9, r * 0.7, palette.body, palette.bodyDark);
  fillShadedEllipse(r * 0.55, -r * 0.36, r * 0.42, r * 0.36, palette.body, palette.bodyDark);
  ctx.fillStyle = palette.belly;
  ctx.beginPath();
  ctx.ellipse(r * 0.12, r * 0.12, r * 0.38, r * 0.28, -0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = palette.bodyDark;
  ctx.beginPath();
  ctx.arc(r * 0.34, -r * 0.72, r * 0.17, 0, Math.PI * 2);
  ctx.arc(r * 0.62, -r * 0.68, r * 0.15, 0, Math.PI * 2);
  ctx.fill();

  drawEye(r);
  ctx.fillStyle = palette.accent;
  ctx.beginPath();
  ctx.arc(r * 0.9, -r * 0.26, Math.max(2, r * 0.08), 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = palette.bodyDark;
  ctx.lineWidth = Math.max(1.5, r * 0.05);
  ctx.beginPath();
  ctx.arc(r * 0.42, r * 0.36, r * 0.16, 0, Math.PI);
  ctx.arc(-r * 0.34, r * 0.36, r * 0.16, 0, Math.PI);
  ctx.stroke();
}

function drawChipmunkShape(entity, palette) {
  const r = entity.radius;

  fillShadedEllipse(-r * 0.64, -r * 0.12, r * 0.38, r * 0.64, palette.tail, palette.tailDark, -0.68);
  fillShadedEllipse(0, 0, r * 0.9, r * 0.66, palette.body, palette.bodyDark);
  fillShadedEllipse(r * 0.55, -r * 0.34, r * 0.38, r * 0.34, palette.body, palette.bodyDark);
  ctx.strokeStyle = "#3b2214";
  ctx.lineWidth = Math.max(2, r * 0.08);
  for (const offset of [-0.22, 0, 0.22]) {
    ctx.beginPath();
    ctx.moveTo(-r * 0.42, -r * (0.3 + offset * 0.2));
    ctx.quadraticCurveTo(-r * 0.02, -r * (0.56 + offset * 0.2), r * 0.42, -r * (0.28 + offset * 0.2));
    ctx.stroke();
  }
  ctx.strokeStyle = palette.accent;
  ctx.lineWidth = Math.max(1, r * 0.035);
  ctx.beginPath();
  ctx.moveTo(-r * 0.46, -r * 0.18);
  ctx.quadraticCurveTo(-r * 0.02, -r * 0.4, r * 0.42, -r * 0.16);
  ctx.stroke();

  ctx.fillStyle = palette.bodyDark;
  ctx.beginPath();
  ctx.arc(r * 0.38, -r * 0.66, r * 0.13, 0, Math.PI * 2);
  ctx.arc(r * 0.62, -r * 0.62, r * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = palette.belly;
  ctx.beginPath();
  ctx.ellipse(r * 0.1, r * 0.15, r * 0.32, r * 0.23, -0.2, 0, Math.PI * 2);
  ctx.fill();
  drawEye(r);
  ctx.fillStyle = "#2a1a12";
  ctx.beginPath();
  ctx.arc(r * 0.88, -r * 0.24, Math.max(2, r * 0.07), 0, Math.PI * 2);
  ctx.fill();
}

function drawFoxShape(entity, palette) {
  const r = entity.radius;

  fillShadedEllipse(-r * 0.72, -r * 0.04, r * 0.34, r * 0.82, palette.tail, palette.tailDark, -0.82);
  ctx.fillStyle = palette.belly;
  ctx.beginPath();
  ctx.ellipse(-r * 0.92, -r * 0.5, r * 0.18, r * 0.28, -0.82, 0, Math.PI * 2);
  ctx.fill();
  fillShadedEllipse(0, 0, r * 0.86, r * 0.62, palette.body, palette.bodyDark);

  ctx.fillStyle = palette.body;
  ctx.beginPath();
  ctx.moveTo(r * 0.34, -r * 0.4);
  ctx.quadraticCurveTo(r * 0.88, -r * 0.62, r * 1.08, -r * 0.16);
  ctx.quadraticCurveTo(r * 0.84, r * 0.1, r * 0.4, -r * 0.04);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = palette.belly;
  ctx.beginPath();
  ctx.moveTo(r * 0.74, -r * 0.18);
  ctx.quadraticCurveTo(r * 1.0, -r * 0.16, r * 1.1, -r * 0.08);
  ctx.quadraticCurveTo(r * 0.9, r * 0.06, r * 0.64, -r * 0.02);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = palette.bodyDark;
  ctx.beginPath();
  ctx.moveTo(r * 0.34, -r * 0.58);
  ctx.lineTo(r * 0.48, -r * 1.0);
  ctx.lineTo(r * 0.62, -r * 0.52);
  ctx.closePath();
  ctx.moveTo(r * 0.66, -r * 0.5);
  ctx.lineTo(r * 0.86, -r * 0.86);
  ctx.lineTo(r * 0.9, -r * 0.38);
  ctx.closePath();
  ctx.fill();

  drawEye(r);
  ctx.fillStyle = "#1f120d";
  ctx.beginPath();
  ctx.arc(r * 1.08, -r * 0.12, Math.max(2, r * 0.07), 0, Math.PI * 2);
  ctx.fill();
}

function drawCharacter(entity, characterId, isPlayer) {
  const bounce = Math.sin(state.elapsed * 8 + (entity.phase ?? 0)) * 4;
  const x = entity.x - state.camera.x;
  const y = entity.y - state.camera.y + bounce;
  const edible = !isPlayer && canEat(state.player, entity);
  const palette = characterPalette(characterId, edible, isPlayer);
  const facing = entity.vx < -2 ? -1 : 1;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing, 1);
  if (characterId === "chipmunk") drawChipmunkShape(entity, palette);
  else if (characterId === "fox") drawFoxShape(entity, palette);
  else drawSquirrelShape(entity, palette);
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
  for (const squirrel of sorted) drawCharacter(squirrel, "squirrel", false);
  drawCharacter(state.player, selectedCharacter, true);
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

function syncCharacterPicker() {
  for (const button of characterButtons) {
    const isSelected = button.dataset.character === selectedCharacter;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  }
}

characterPicker?.addEventListener("pointerdown", (event) => {
  event.stopPropagation();
});

characterPicker?.addEventListener("click", (event) => {
  const button = event.target instanceof Element ? event.target.closest("[data-character]") : null;
  if (!button) return;
  selectedCharacter = normalizeCharacterChoice(button.dataset.character);
  syncCharacterPicker();
  render();
});

window.render_game_to_text = () => JSON.stringify({
  coordinateSystem: "world origin top-left; x right, y down",
  mode: started ? state.mode : "menu",
  selectedCharacter,
  availableCharacters: CHARACTER_CHOICES.map((character) => character.id),
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
syncCharacterPicker();
render();
requestAnimationFrame(frame);
