# Bloodmoon Sylas

Bloodmoon Sylas is a single-player browser action game set in a gothic fortress courtyard. Choose a hero, fight demons, and challenge the boss assigned to each stage. The project is a learning prototype built with a React client and a Node.js server.

## Run the project

Install Node.js 20.19 or newer in the 20.x series, or Node.js 22.12 or newer. In a terminal opened in this folder, run:

```powershell
npm install
npm run dev
```

Open the local address printed in the terminal. It is usually `http://localhost:3000`. The game can use local JSON storage, so MongoDB is optional for local play.

To make a production client build, run:

```powershell
npm run build
```

To check TypeScript without producing output, run `npm run lint`.

## Controls

| Action | Keyboard or mouse |
| --- | --- |
| Move | `W`, `A`, `S`, `D` or arrow keys |
| Look around | Click the game view, then move the mouse; press `Esc` to release it |
| Run | Hold `Shift` |
| Jump | `Space` |
| Attack | `J` or the on-screen Attack button |
| Heavy attack | `K` or its on-screen button |
| Dash | `R` or its on-screen button |
| Guard | Hold `B` or use the Guard button |
| Magic | `E` or the on-screen Magic button |
| Bloodmoon Fury | `Q` when charged, or use the Fury button |
| Health potion | `P` or the potion button |
| Lock target | `F` or the Lock button |

Movement is relative to the camera direction. The on-screen controls can also be clicked or tapped.

## Technologies

The browser interface uses React, TypeScript, HTML and CSS. Three.js renders the 3D courtyard and actors with WebGL. Vite runs the development client and creates the production bundle. The Node.js server uses Express for its JSON API. The MongoDB Node driver is available for optional database persistence; when MongoDB is not configured or cannot connect, the server uses `data/game_db.json`.

The course template calls the subject “Mean Stack Web Technologies.” This code uses React rather than Angular, so its implemented combination is MongoDB, Express, React and Node.js, often called MERN-style.

## Project map

`src/App.tsx` connects the main screens, selected hero, level, settings and player profile. `src/components/RoninGameCanvas.tsx` handles the game loop, movement, combat, enemies, projectiles and HUD. `src/services/threeWorld.ts` creates and updates the WebGL world. `src/data/bestiary.ts` contains the fifty static boss records. `src/types` contains the TypeScript shapes and level configuration builder. `server.ts` defines the Express API and storage fallback. Images and audio are in `public/assets`.

Project documents are in `docs/`: the [student guide](docs/STUDENT_GUIDE.md), [development roadmap](docs/DEVELOPMENT_ROADMAP.md) and [mini project report](docs/Project_Report.docx).

## Optional MongoDB setup

Copy `.env.example` to `.env`, then set `MONGODB_URI` and, if needed, `MONGODB_DB`. Keep real credentials private and out of source control. Without a working connection, the game uses the local JSON file.

## Project limitations

This is a single-player prototype. It has not been presented as a production-hosted service or as a measured performance, accessibility or security release. The boss catalogue has fifty named entries and signature-move descriptions; the runtime uses a smaller set of reusable attack patterns with element and stage variations. Before public deployment, authentication and authorization should be strengthened and the game should be tested on the browsers and devices it intends to support.


## Final Angular + React Architecture

The final build uses **Angular as the application bootstrap/host** and keeps the existing React game runtime as a deliberate embedded subsystem. The React runtime contains the real-time Three.js/canvas combat loop and the existing battle/builder systems; rewriting that hot path would add migration risk and duplicate complex rendering/state logic.

The final host also repairs campaign navigation and level-session lifecycle:
- starts at the Cover screen instead of dropping directly into combat
- fresh installs start at Level 1
- level selection immediately starts a clean level session
- retry/replay creates a fresh game session
- Next Level creates a fresh game session
- Pause → Restart resets the level
- in-game CAMP navigation returns to the Dashboard/Cover
- level backgrounds use the configured level background
- enemy-type typing matches the implemented spawn branches
- level reward souls are not double-counted

### Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.
