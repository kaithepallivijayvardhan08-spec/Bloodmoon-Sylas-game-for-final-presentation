# Student Guide for Bloodmoon Sylas

This guide is meant to help you run the project, follow its main code path, and explain the parts you have studied. It is a reference for learning, not a substitute for checking the source and making your own changes.

## What the application does

The player controls a hero in a 3D fortress courtyard. The game tracks the hero's health and stamina, movement, attacks, enemies and projectiles. Defeating enemies advances the selected stage. At the stage's boss threshold, the configured final boss appears. React supplies the menus and HUD, while Three.js draws the courtyard and actors. An Express API handles account and save-related requests.

## How the pieces connect

```text
Browser input
    |
    v
React screens and game state (src/App.tsx)
    |
    v
Game loop and combat (src/components/RoninGameCanvas.tsx)
    |
    v
Three.js scene (src/services/threeWorld.ts)

Profile or save request
    |
    v
Express routes (server.ts)
    |
    +---- MongoDB when configured
    |
    +---- data/game_db.json as the local fallback
```

This is a teaching-level map; the actual code has additional components and helper functions.

## Files to read first

Start with `src/main.tsx` to see where the React application is mounted. Read `src/App.tsx` next to understand how the major screens and selected game options are connected. The gameplay loop is in `src/components/RoninGameCanvas.tsx`; it is the largest and most complex file, so read one action or update section at a time. `src/services/threeWorld.ts` turns game state into scene objects. `src/data/bestiary.ts` contains the static boss records; `src/types` contains the related data types and level configuration. `server.ts` contains the server routes, database connection and JSON fallback.

## Build and launch

Use a supported Node.js version, open a terminal in the project directory, then run:

```powershell
npm install
npm run dev
```

Open the address printed by the terminal. Use `Ctrl+C` in that terminal to stop the server. Run `npm run lint` to type-check the TypeScript files and `npm run build` to create the production client bundle in `dist`.

MongoDB is optional during local development. If you want to use it, copy `.env.example` to `.env` and add your own connection string. Do not include a real connection string in screenshots, submitted source, or a public repository. When MongoDB is not configured, the server writes its local data to `data/game_db.json`.

## Follow one gameplay feature

For example, to understand how a boss is configured, look at an entry in `MALAKATH_BESTIARY_50` in `src/data/bestiary.ts`. The level builder in `src/types/levels.ts` turns each entry into a `GAME_LEVELS` configuration. The game canvas checks the current stage's boss threshold, creates a boss entity with that level's stats and sprite, and displays its name and signature-move text. The game loop selects one of its reusable special-attack patterns. The Three.js world draws the boss sprite and its visual aura. This path shows the difference between static game data, runtime behavior and rendering.

To understand movement, trace a key event in `RoninGameCanvas.tsx` from the keyboard listener to the movement update, then follow the player position into the renderer. To understand persistence, trace a request from the client to a route in `server.ts`, then follow the state update into `saveDb()`.

## A short demonstration plan

Begin by explaining the player goal and the basic controls. Show movement, a regular attack and one ability. Point out the health and stamina display and the stage objective. Open the hero or level selection screen and show how the data changes with the selection. Explain how a boss entry is configured and how the boss warning appears in the game. Finish by showing the project map and describing the optional database fallback. Demonstrate only features you have run and confirmed on your own machine.

## Small changes you can make and explain

Change one hero's speed or health in `src/types/heroes.ts`, rebuild and compare the gameplay. Adjust one boss's health, element or move description in `src/data/bestiary.ts` and show where that value appears. Change one HUD label or instruction in its React component. Add a short validation check to an API route and explain what invalid request it handles. After each change, run the app and record what you observed; do not describe an untested change as completed.

## Keep a project work log

Fill this in with your own work as you study and modify the code:

| Date | File or feature I changed | What I changed and why | How I checked it | Evidence or observation |
| --- | --- | --- | --- | --- |
| [date] | [file or feature] | [your explanation] | [steps you ran] | [result or screenshot] |
| [date] | [file or feature] | [your explanation] | [steps you ran] | [result or screenshot] |

Keep authorship and contribution statements accurate. Follow your institution's rules for assistance and cite third-party libraries and assets as required. Be ready to explain the code you submit, and personalize the report with your own verified screenshots, testing notes, student details and guide information.

## Current limitations to understand

The game is a single-player prototype, not an online multiplayer service. The fifty bosses have distinct catalogue entries and named moves, while the current code uses a smaller reusable set of attack patterns. The local API is suitable for demonstrating routes and storage behavior, but account/session authorization should be strengthened before deployment to the public internet. The project has build and TypeScript checks; a build passing does not prove that every gameplay path works on every browser or device. Add your own manual test notes after trying the game.

## Questions to prepare for

**Why use React?** React organizes the interface into components and manages screen state such as the selected hero, stage and settings.

**What does Three.js do here?** It creates the WebGL scene, camera, lighting, courtyard and actor sprites. React components still draw the surrounding interface.

**Why is this not a strict MEAN stack app?** The template uses “Mean Stack” as the course label, but the client is React, not Angular. The technologies in this repository are MongoDB, Express, React and Node.js.

**What happens when MongoDB is unavailable?** The server falls back to a local JSON file so the project can run during development without a database server.

**How does a boss get selected?** The chosen level points to a boss record containing its name, description, archetype, stats and special-move label. The game creates a runtime enemy from that configuration when the stage threshold is met.

**What did the build check prove?** TypeScript checking reports type errors, if present, and the production build packages the client. Neither check replaces playing through the game and manually checking its API behavior.
