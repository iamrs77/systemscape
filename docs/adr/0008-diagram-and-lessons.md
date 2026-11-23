# 8. A drawn diagram and guided lessons, instead of a 3D city

- **Status:** Accepted
- **Date:** 2026-11-23
- **Replaces:** [ADR 0004](0004-html-labels.md), and the 3D view in [ADR 0006](0006-tech-stack.md)

## Context

Systemscape is for learning how big apps are built. The first version put the whole system in a 3D scene (later a small city: offices for services, silos for databases, cars for requests) and every control on screen at once: five journeys, four scenarios, a traffic slider, resilience switches, challenges and a status line.

Someone arriving to learn met all of it at once. The city was a metaphor to decode before learning anything (an office is a service, lit windows mean busy, a red roof means overloaded), labels hid each other where parts were close, and the numbers on them ("28% · 3×") didn't say what they meant. The content was there (every part says what it does, why it's needed and what fails without it; every call has a label) but nothing walked through it.

## Decision

**Teach first, then let people play.** Opening a system starts a lesson, one idea per step, with Back and Next and a progress bar. A step explains one thing beside the diagram: why the part is there, what happens when it fails, the numbers that matter, each with a name. The sandbox and the challenges are still there, as the course's last two parts.

**The lessons are made from the system's data** (`src/learn/lessons.ts`), so a new system gets them without writing any: first the big picture, a row at a time; then a lesson per journey, a step per call; then the scenario that's hardest on that journey, worked out by running each one; then the challenge for it. A test checks every system's lessons only mention parts, calls, scenarios and challenges that exist.

**Draw the system as a diagram, not a place.** A part looks like what it is: one block with an icon for its kind, a cylinder for a database, a phone for an app, and a badge for how many copies are running. Parts sit in rows read top to bottom, from the apps to outside providers, each row named. Calls are arrows; requests are dots moving along them; background work is dashed and violet; failures are red.

**In SVG, not WebGL.** The look this needs (ink outlines of the same width at any size, icons on the tops of blocks, labels that are never blurry, rows named on the page) is plain in SVG and work in three.js. The diagram is drawn from a pure projection and block geometry (`src/diagram/geometry.ts`), tested without a browser. Each lesson step zooms smoothly to the parts it's about.

## Consequences

- Each name is an SVG button, in the page with everything else: no overlay to keep in step with a canvas, so ADR 0004's tracker goes. Names sit on their blocks, out of the arrows' way, and no longer hide each other.
- three.js, React Three Fiber and drei are gone. The whole app is now smaller (about 140 KB of JavaScript gzipped) than its first load was before (121 KB, with 259 KB of three.js after it), it needs no WebGL, and the browser tests run in seconds instead of minutes.
- You can't turn the view round any more, but you can drag it and zoom. For learning, one well-made view and a zoom that follows the lesson do more than free turning did.
- The lesson text is written as templates around the data. It reads well for the ride-hailing app; a system with odd names or very long journeys may need the templates tuned, or a way for a system to add its own words to a step.
