export const WORLD = { width: 2600, height: 1800 };

export function canEat(player, squirrel) {
  return player.radius >= squirrel.radius * 1.28;
}

export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function clampCamera(target, view, world) {
  return {
    x: Math.round(clamp(target.x - view.width / 2, 0, Math.max(0, world.width - view.width))),
    y: Math.round(clamp(target.y - view.height / 2, 0, Math.max(0, world.height - view.height))),
  };
}

export function createInitialState(options = {}) {
  const player = {
    x: options.player?.x ?? WORLD.width / 2,
    y: options.player?.y ?? WORLD.height / 2,
    radius: options.player?.radius ?? 24,
    speed: options.player?.speed ?? 245,
    vx: 0,
    vy: 0,
  };

  return {
    mode: "playing",
    score: 0,
    elapsed: 0,
    world: { ...WORLD },
    player,
    squirrels: options.squirrels ? options.squirrels.map((s) => ({ ...s })) : [],
    camera: { x: 0, y: 0 },
    nextId: options.nextId ?? 1000,
  };
}

export function growPlayer(player, mealRadius) {
  player.radius = Math.min(84, Math.sqrt(player.radius * player.radius + mealRadius * mealRadius * 0.36));
}

export function updateCollision(state) {
  if (state.mode !== "playing") return;

  for (let index = state.squirrels.length - 1; index >= 0; index -= 1) {
    const squirrel = state.squirrels[index];
    const overlap = distance(state.player, squirrel) <= state.player.radius + squirrel.radius;
    if (!overlap) continue;

    if (canEat(state.player, squirrel)) {
      growPlayer(state.player, squirrel.radius);
      state.squirrels.splice(index, 1);
      state.score += 1;
    } else if (squirrel.radius > state.player.radius * 0.92) {
      state.mode = "gameover";
      return;
    }
  }
}

export function spawnSquirrel(state, random = Math.random) {
  const radius = 10 + random() * 36;
  const angle = random() * Math.PI * 2;
  const speed = 38 + random() * 82;
  const squirrel = {
    id: state.nextId,
    x: radius + random() * (state.world.width - radius * 2),
    y: radius + random() * (state.world.height - radius * 2),
    radius,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    phase: random() * Math.PI * 2,
  };
  state.nextId += 1;
  state.squirrels.push(squirrel);
  return squirrel;
}

export function updateSquirrels(state, dt) {
  for (const squirrel of state.squirrels) {
    squirrel.x += squirrel.vx * dt;
    squirrel.y += squirrel.vy * dt;

    if (squirrel.x < squirrel.radius || squirrel.x > state.world.width - squirrel.radius) {
      squirrel.vx *= -1;
      squirrel.x = clamp(squirrel.x, squirrel.radius, state.world.width - squirrel.radius);
    }
    if (squirrel.y < squirrel.radius || squirrel.y > state.world.height - squirrel.radius) {
      squirrel.vy *= -1;
      squirrel.y = clamp(squirrel.y, squirrel.radius, state.world.height - squirrel.radius);
    }
  }
}

export function updatePlayer(state, input, dt) {
  const horizontal = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const vertical = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  const length = Math.hypot(horizontal, vertical) || 1;
  state.player.vx = (horizontal / length) * state.player.speed;
  state.player.vy = (vertical / length) * state.player.speed;
  state.player.x = clamp(state.player.x + state.player.vx * dt, state.player.radius, state.world.width - state.player.radius);
  state.player.y = clamp(state.player.y + state.player.vy * dt, state.player.radius, state.world.height - state.player.radius);
}

export function updateState(state, input, dt, view) {
  if (state.mode !== "playing") return;
  state.elapsed += dt;
  updatePlayer(state, input, dt);
  updateSquirrels(state, dt);
  updateCollision(state);
  state.camera = clampCamera(state.player, view, state.world);
}
