# Squirrel Eat Squirrel

A small top-down browser game inspired by the classic "Squirrel Eat Squirrel" assignment idea. You control a squirrel in a large forest, eat smaller squirrels to grow, and avoid squirrels that are too large to bite.

The project is implemented with plain HTML, JavaScript modules, and the Canvas 2D API. It does not require a build step.

## Features

- Top-down squirrel movement with `WASD` or arrow keys
- Eat smaller squirrels to increase score and grow
- Larger squirrels end the run on contact
- Sine-wave bounce animation for squirrel movement
- Camera tracking across a world larger than the viewport
- Canvas-rendered forest background, trees, HUD, and sprites
- Fullscreen toggle with `F`
- Restart with `Space`
- Deterministic gameplay hooks for automated browser testing

## Project Structure

```text
.
├── index.html                    # Browser entry point
├── main.mjs                      # Canvas rendering, input, game loop, HUD
├── squirrelLogic.mjs             # Core gameplay rules and state updates
├── squirrelGame.test.mjs         # Node tests for gameplay logic
├── squirrel_actions.json         # Browser playtest input sequence
├── web_game_playwright_client.js # Optional browser playtest helper
├── package.json                  # Node metadata and scripts
└── progress.md                   # Development notes
```

Generated folders such as `node_modules/` and `output/` are intentionally ignored by Git.

## Requirements

- Node.js 18 or newer

Playwright is listed as a dependency for automated browser playtests. The game itself runs in the browser without Playwright.

## Setup

After cloning or moving the files into a new repo folder:

```powershell
npm install
```

If you want to run the automated browser playtest, install the Playwright browser binary once:

```powershell
npx playwright install chromium
```

## Run the Game

Start a local static server from the project folder:

```powershell
npm run serve
```

Then open:

```text
http://127.0.0.1:4173/index.html
```

Do not rely on double-clicking `index.html`. The game uses JavaScript modules, and browsers may block module imports from a plain `file:///` URL.

## Controls

| Action | Input |
| --- | --- |
| Move | `WASD` or arrow keys |
| Start / restart | `Space` or click the canvas |
| Fullscreen | `F` |

## Gameplay

Your squirrel starts near the center of a large forest. Smaller squirrels are edible; larger squirrels are dangerous. Eating smaller squirrels increases the score and grows the player, which makes more squirrels edible over time.

The camera follows the player through the larger world, so the visible canvas is only one part of the map.

## Testing

Run the gameplay logic tests:

```powershell
npm test
```

The tests cover:

- eating rules
- growth after eating
- gameover collision with larger squirrels
- camera clamping inside the world

## Browser Playtest

The repo includes an optional Playwright-based playtest helper. Start the local server first in one terminal:

```powershell
npm run serve
```

Then run the playtest in another terminal:

```powershell
npm run playtest
```

This opens the game in a real browser, applies the scripted inputs from `squirrel_actions.json`, and writes screenshots plus game-state JSON into `output/squirrel/`.

## Notes for a New Repo

When moving this project into a fresh repository, include:

- `index.html`
- `main.mjs`
- `squirrelLogic.mjs`
- `squirrelGame.test.mjs`
- `squirrel_actions.json`
- `web_game_playwright_client.js`
- `package.json`
- `package-lock.json`
- `README.md`
- `.gitignore`

Do not copy `node_modules/` or `output/`; regenerate them with `npm install` and the playtest command.

## Future Ideas

- Acorn pickups for temporary speed boosts
- Difficulty ramp based on score
- Sound effects
- A minimap
- More varied forest decoration
