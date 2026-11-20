# 3. Systems are data, checked by a schema

- **Status:** Accepted
- **Date:** 2026-11-19

## Context

Five systems are planned: ride-hailing first, then stock trading, video streaming, UPI payments and Stockroom. Each has its own components, flows, scenarios and challenges. If each system were code (its own scene, its own rules), every one would take as long as the first and behave slightly differently.

A system is also mostly cross-references: hops name components, challenges name scenarios and journeys. A typo in an id would only show up as something silently missing from the 3D view.

## Decision

A system is a plain object in `src/systems/<name>.ts`. Everything else is generic: the layout comes from the components' layers and connections, the simulation from capacities and hops, the panels from the text fields.

Two layers of checking:

1. **A zod schema** (`src/model/schema.ts`) for the shape and defaults: ids are lower-case words, a hop's `retries` is 0 to 5, a share is between 0 and 1.
2. **`parseSystem`** for what a schema can't express: every id it mentions exists, each journey starts from a client, each hop starts from somewhere the journey has reached, only caches have hit rates (and every cache has one), only cache hops can be `onMiss`. It collects every problem and throws them together.

Both run when the app loads and in the tests. Each system also has a test proving its challenges are fair: each fails its goal at the start and a sensible fix solves it.

## Consequences

- Adding a system is writing data and tuning numbers, as [Adding a system](../adding-a-system.md) describes.
- A broken system fails `npm test` with a list of exactly what's wrong.
- The simulation and the scene only ever see valid systems, so they don't need defensive checks.
- The format limits what a system can express: sequential hops, one capacity per component. A design that needs, say, request batching or a priority queue would need the format and the engine extended for every system.
