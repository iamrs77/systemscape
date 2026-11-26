# 6. The tech stack

- **Status:** Accepted, except the 3D view: three.js, React Three Fiber and drei were replaced by an SVG diagram ([ADR 0008](0008-diagram-and-lessons.md)); and the tests, removed in [ADR 0009](0009-explore-instead-of-challenges.md)
- **Date:** 2026-11-19

## Context

A browser app with a 3D view, several panels sharing state with it, a simulation to run on every change, and a data format to validate. It should feel like my other projects to work on, and load quickly.

## Decision

- **React 19, TypeScript (strict, with unchecked index access) and Vite.** The panels are ordinary React. Strict types catch a broken system file or a wrong field name before anything runs. TypeScript is pinned to 6.0.x, the newest version typescript-eslint supports.
- **three.js with React Three Fiber and drei** for the 3D view. The scene is described as React components (a `ComponentNode` per part, a `Connections` group), reading the same store as the panels, so selecting something in one updates the other without any glue. drei provides the orbit controls, the ground grid, rounded boxes and thick lines. The whole scene is loaded with `lazy()`, so three.js (about 260 KB gzipped) arrives after the page shows.
- **zustand** for state: the conditions, the latest result, the selection. Components subscribe to just the slice they draw, so dragging the traffic slider doesn't re-render the About dialog or the challenge list. Actions that change the conditions re-run the simulation inside the store, so a result can never be stale.
- **zod** for the system schema ([ADR 0003](0003-systems-as-data.md)).
- **Tailwind CSS 4** for the interface, plus a few hand-written classes for the labels over the canvas. The fonts changed in [ADR 0010](0010-a-look-of-its-own.md).
- **Vitest, Testing Library and Playwright.** The simulation, layout and camera fit are pure functions, tested directly. The panels are tested in jsdom with the 3D scene replaced by a stub. Playwright runs the production build in Chromium with software WebGL, on a desktop and a phone size, and fails on any console error.
- **ESLint with typescript-eslint (strict) and the React hooks plugin's React Compiler rules**, and **Prettier**. The compiler rules flagged mutating three.js objects created in `useMemo`; the scene uses refs and declarative materials instead.

Turned down:

- **Plain three.js without React**: the panels would need a second state system and manual syncing with the scene.
- **A canvas graph library (React Flow, Cytoscape)**: good for 2D diagrams, but the point was a scene you can move around in. The top view gives the diagram when you want it.
- **A physics or force-directed layout**: positions would shift between visits. A row per layer is stable, and reads like the architecture diagrams people already know.
- **Postprocessing effects (bloom)**: extra download and GPU cost on phones, for a glow that emissive materials mostly give anyway.

## Consequences

- One language and one state model across the 3D view and the panels.
- The first load is the app (about 116 KB gzipped); the 3D view follows.
- React Three Fiber ties the 3D code to React's release cycle; React 19 needed R3F 9.
