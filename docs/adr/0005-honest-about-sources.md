# 5. Honest about what's real

- **Status:** Accepted
- **Date:** 2026-11-19

## Context

Systemscape teaches how real systems are built, and names the companies people know. That makes it easy to overclaim: presenting a guess as "how Uber works", or a 2015 number as today's. Public sources are also uneven: a company blog post is first-hand, a summary of a conference talk is second-hand, and some popular facts have no source at all.

## Decision

- Each system says its **basis**: `inspired` (a simplified design based on public talks and posts) or `real` (a design I can show in full, like my own Stockroom). Inspired systems carry a “Simplified, from public talks” badge, and their description says it’s “a simplified design … not any company’s actual system”.
- Each system lists its **sources**, opened and checked, with the publisher and year. Facts in the design decisions and component descriptions come from them, or are worded as this design's choice rather than a company's.
- **Dated numbers are dated.** "Every 4 seconds, in a 2015 Uber talk", not "every 4 seconds".
- **Unverified claims are left out or softened.** For example, Uber's H3 hexagon grid is documented for pricing and dispatch optimisation, but whether live dispatch indexes drivers with it isn't; the design says the map is cut into _cells_, that Uber's 2015 index used Google's S2 cells, and that H3 came later.
- **Traffic and capacity numbers are illustrative**, chosen so the trade-offs show, and the About dialog says so.

## Consequences

- Anyone can check the claims, and the app doesn't teach things that aren't true.
- Researching a system takes longer than drawing one. For the four planned systems, the sources were gathered and checked before building, with gaps marked.
- Some appealing details stay out until there's a source for them.
