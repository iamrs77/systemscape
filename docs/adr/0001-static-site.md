# 1. A static site: everything runs in the browser

- **Status:** Accepted
- **Date:** 2026-11-19

## Context

Systemscape has to be free to host and quick to open from a portfolio link. My other projects needed a server and a database ([Stockroom](https://github.com/iamrs77/stockroom), [Foodiez](https://github.com/iamrs77/foodiez)), and free servers sleep: the first visit after a quiet spell waits for one to wake up.

Nothing here needs a server. The systems are fixed data, the simulation is a function of the conditions you set, and there are no accounts or shared state.

## Decision

Build a static site. The systems ship in the JavaScript bundle, the simulation runs in the browser on every change, and solved challenges are remembered in `localStorage`. The build uses relative paths (`base: './'`), so `dist/` works from any folder on any static host: GitHub Pages, Cloudflare Pages, Netlify or Vercel, all free.

## Consequences

- Opens instantly, costs nothing, and can't go down in any way a CDN doesn't.
- Every interaction is instant: there's no network between a toggle and its result.
- Progress lives in one browser; clearing site data or switching devices starts over. Fine for a learning tool.
- A system's data is public in the bundle. That's the point.
- If a future version needs saving and sharing designs, that needs a backend, or at least a way to put a scenario in the URL.
