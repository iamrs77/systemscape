# 4. Labels are HTML over the canvas

- **Status:** Replaced by [ADR 0008](0008-diagram-and-lessons.md): the diagram is SVG now, and its labels are part of it
- **Date:** 2026-11-19

## Context

Every part of the map needs a name and, sometimes, how busy it is. The options:

- **Text drawn in 3D** (drei's `Text`): scales with the scene and can hide behind shapes, but needs a font file, is blurry at small sizes, and is invisible to screen readers and the keyboard.
- **drei's `Html`**: a DOM element per label, positioned over the canvas. Sharp and accessible, but each one mounts its own React root. With React 19 in development, that floods the console with warnings about unmounting roots during render, and each label renders outside the app's tree.
- **A single overlay of our own**: one layer of HTML labels next to the canvas, moved each frame by a small tracker inside the canvas that projects each label's point to the screen.

The map also gets crowded: six services side by side don't leave room for six full labels on a laptop.

## Decision

A single overlay. Labels are ordinary React components in the app's tree (they read the store like the panels do), rendered as buttons. A tracker inside the canvas projects each label's point every frame and writes its `transform` directly, with no re-render.

To handle crowding, the tracker places labels most important first (selected, hovered, down or overloaded, busy, part of the followed journey, then the rest) and hides one that would overlap a label already placed; pointing at the shape or focusing the label brings it back. The second line (how busy, and the instance count) only shows where it matters: selected, hovered, busy, overloaded or down. The ring around each shape already shows load. On screens under 640 px wide, labels shrink to the name and the row names hide.

## Consequences

- Sharp text at any size, and every part of the map is reachable by keyboard and screen reader, with its state in its accessible name.
- One React tree: no extra roots, no console warnings.
- About 20 small DOM writes per frame, and reading each label's size for the overlap check. Cheap at this scale, but it would need batching for hundreds of components.
- Labels always draw on top: they don't hide behind shapes. The scene is laid out so that rarely matters.
