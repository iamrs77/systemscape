# 10. A look of its own: colour, display type, drawn posters

- **Status:** Accepted
- **Date:** 2026-11-25
- **Changes:** the styling row of [ADR 0006](0006-tech-stack.md) (IBM Plex Sans is replaced)

## Context

The app worked, but it looked like a default dashboard: grey page, white cards, one indigo accent, IBM Plex everywhere. Nothing on the front page said "come and learn this", and it gave no sense of a course you move through. The systems were shown as small, hard-to-read thumbnails of their diagrams.

## Decision

- **Livelier type.** Bricolage Grotesque for headings and Figtree for the body, both bundled. IBM Plex Mono stays for numbers.
- **Colour on the front page, one colour in the lessons.** Each track of the fundamentals and each system has a colour of its own (`src/ui/palette.ts`). Every lesson page uses one colour, Stockroom's indigo. We tried giving each lesson its track's colour, but a single colour keeps the lessons calm and consistent, and leaves the diagram as the most colourful thing on the page.
- **"The basics" are now "The fundamentals"** on screen. The id stays `basics`, so links and saved progress keep working.
- **The fundamentals as a path.** The tracks wind down the page in rows that alternate direction, joined by a line, with one size of card and no descriptions.
- **Drawn posters for the systems.** Each system gets a scene drawn in SVG, in code. Photos or generated images would need licences, hosting and several sizes. They couldn't animate, and wouldn't match the colours. A system without a poster falls back to its live diagram.
- **A new mark.** A coloured tile with a request's path winding through it replaces the cyan cube, in the app and as the favicon.

[The design document](../design.md) describes all of it in detail.

## Consequences

- Two font packages replace one. The fonts are woff2 files loaded by CSS, not JavaScript.
- A new system should get a colour in `palette.ts`, or it takes a spare one, and ideally a poster. Neither is required.
- More things move on the front page. All of it stops for people who ask for reduced motion.
