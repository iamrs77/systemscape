# 9. Explore freely instead of challenges, and no automated tests

- **Status:** Accepted
- **Date:** 2026-11-24
- **Changes:** [ADR 0008](0008-diagram-and-lessons.md), where each lesson ended with a challenge, and the tests in [ADR 0006](0006-tech-stack.md)

## Context

Each journey's lesson ended with a challenge: a scenario with something broken, a goal for one journey, a hint, and some controls locked. Learners found it confusing. The goal was a number to hit rather than something to understand, and the same things (more traffic, more copies, safety features) were already in Explore freely, without the locks.

The project also had unit, component and browser tests. They checked the wording of almost every screen, so each change to the text or the layout meant updating them, and running them made every change slow.

## Decision

**Explore freely does the challenges' job.** Each journey's lesson ends with "Try it yourself", which opens Explore freely on the night that's hardest on that journey, following it. Beside the diagram, each problem says what's failing and why, with a fix to try in one click: copies for an overloaded part, bringing back a part that's down, circuit breakers, autoscaling, or turning off retries in a retry storm. The controls sit in a slim strip under the diagram, and the whole view, side panel and all, can fill the screen.

**No automated tests.** Vitest, Testing Library and Playwright, and the tests, are gone. `parseSystem` still checks every system file when the app loads, and every push still runs the linter, the formatter, the type checker and the build.

## Consequences

- The course is shorter, and there's one place to experiment instead of two. Progress counts lessons only.
- Nothing checks any more that a scenario breaks the system, or that a fix repairs it. Retuning a capacity needs a look in Explore freely.
- A change to the simulation or the lessons can break something unnoticed. If the project grows, tests for the pure parts (the simulation, `explain`, the lessons) are the first to bring back: they're cheap, fast, and don't depend on wording.
