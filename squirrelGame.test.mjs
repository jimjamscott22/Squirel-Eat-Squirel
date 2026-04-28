import assert from "node:assert/strict";
import {
  canEat,
  createInitialState,
  clampCamera,
  updateCollision,
} from "./squirrelLogic.mjs";
import {
  CHARACTER_CHOICES,
  DEFAULT_CHARACTER,
  normalizeCharacterChoice,
} from "./characterSkins.mjs";

function test(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

test("player eats only squirrels that are meaningfully smaller", () => {
  assert.equal(canEat({ radius: 28 }, { radius: 19 }), true);
  assert.equal(canEat({ radius: 28 }, { radius: 25 }), false);
  assert.equal(canEat({ radius: 28 }, { radius: 34 }), false);
});

test("eating a smaller squirrel grows the player and increments score", () => {
  const state = createInitialState({
    player: { x: 100, y: 100, radius: 24 },
    squirrels: [{ id: 1, x: 110, y: 100, radius: 12, vx: 0, vy: 0 }],
  });

  updateCollision(state);

  assert.equal(state.score, 1);
  assert.equal(state.squirrels.length, 0);
  assert.ok(state.player.radius > 24);
  assert.equal(state.mode, "playing");
});

test("touching a larger squirrel ends the run", () => {
  const state = createInitialState({
    player: { x: 100, y: 100, radius: 24 },
    squirrels: [{ id: 1, x: 110, y: 100, radius: 32, vx: 0, vy: 0 }],
  });

  updateCollision(state);

  assert.equal(state.mode, "gameover");
  assert.equal(state.score, 0);
});

test("camera remains inside the large world", () => {
  assert.deepEqual(
    clampCamera({ x: 80, y: 90 }, { width: 320, height: 200 }, { width: 900, height: 700 }),
    { x: 0, y: 0 },
  );
  assert.deepEqual(
    clampCamera({ x: 860, y: 660 }, { width: 320, height: 200 }, { width: 900, height: 700 }),
    { x: 580, y: 500 },
  );
});

test("character picker exposes three woodland choices with squirrel as default", () => {
  assert.equal(DEFAULT_CHARACTER, "squirrel");
  assert.deepEqual(
    CHARACTER_CHOICES.map((character) => character.id),
    ["squirrel", "chipmunk", "fox"],
  );
});

test("unsupported character picker values fall back to squirrel", () => {
  assert.equal(normalizeCharacterChoice("fox"), "fox");
  assert.equal(normalizeCharacterChoice("bird"), "squirrel");
  assert.equal(normalizeCharacterChoice(undefined), "squirrel");
});
