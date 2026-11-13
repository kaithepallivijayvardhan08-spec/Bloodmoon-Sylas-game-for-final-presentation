# Bloodmoon Sylas Development Roadmap

This is a suggested order for understanding and extending the project. It is not a record of work already completed. Use the checkboxes only after you personally perform and verify the step. Add your date, notes and evidence as you go.

## 1. Run the starter project

Read `README.md`, install the dependencies with `npm install`, then run `npm run dev`. Open the printed local URL and identify the main screens. Record the Node.js version and browser you used. Save a screenshot from your own run.

Files to inspect: `package.json`, `server.ts`, `src/main.tsx` and `src/App.tsx`.

Your notes: [date, what you observed, any setup issue and how you resolved it]

## 2. Understand the interface

Trace how the application chooses between the cover, dashboard, game and modal screens. Find where the current hero and level are selected. Change one visible label or setting, run the application again and describe what changed.

Files to inspect: `src/App.tsx`, `src/components/Dashboard.tsx` and the related modal in `src/components`.

Your notes: [file changed, reason, observed result]

## 3. Understand the game world

Find where keyboard input is read and where player position changes. Then find how that position is sent to the Three.js world. Move in the game and explain the sequence from key press to rendered movement in your own words.

Files to inspect: `src/components/RoninGameCanvas.tsx` and `src/services/threeWorld.ts`.

Your notes: [input tried, files traced, what you learned]

## 4. Make one gameplay change

Choose one small change, such as adjusting one hero's speed, changing one stage boss's health, or updating one special-move description. Make the change, run the game and record the result. Avoid changing several systems at once so you can identify what caused the result.

Files to inspect: `src/types/heroes.ts`, `src/data/bestiary.ts`, `src/types/levels.ts` and `src/types/ronin.ts`.

Your notes: [before value, after value, how you checked it]

## 5. Trace a server request

Find one client request and locate the matching Express route. Follow how its request data is checked, stored and returned. If MongoDB is available in your development environment, compare that path with the local JSON fallback.

Files to inspect: `server.ts` and the component or service that calls the route.

Your notes: [route, request, response and storage path]

## 6. Verify the result

Run `npm run lint` and `npm run build`. Then manually revisit the feature you changed in the browser. Record the exact commands and results. A successful build shows that the project can be type-checked and bundled; it does not prove that every gameplay path works.

Your notes: [date, commands, output, browser checks and remaining issues]

## Personal contribution record

| Date | Change I made | Why I made it | How I verified it | Evidence |
| --- | --- | --- | --- | --- |
| [date] | [your change] | [your reason] | [your check] | [screenshot or notes] |
| [date] | [your change] | [your reason] | [your check] | [screenshot or notes] |

Keep this record factual. Do not backdate entries or present the suggested roadmap as a historical log. Describe your own contributions accurately and follow your institution's rules for outside assistance and third-party assets.
