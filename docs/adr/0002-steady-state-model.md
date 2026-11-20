# 2. A steady-state model, not a request-by-request simulation

- **Status:** Accepted
- **Date:** 2026-11-19

## Context

To show how a system behaves under load and failure, the app needs numbers: how busy each part is, how many requests fail, how long users wait. Two kinds of model could produce them:

- **Discrete-event simulation:** generate individual requests with random arrival times, queue them, time them out, retry them. It shows how things change over time (warm-up, a queue draining after a spike) and gives full latency distributions. But results are noisy, need many requests to be stable, and depend on a random seed. A big city's 30,000 requests a second would be heavy to run in a browser on every slider move.
- **Steady-state model:** work out the averages the system settles at for given conditions, with standard formulas for queueing, overload and retries. It answers "what happens under these conditions?", not "what happens second by second?".

What people need to learn here (why the cache matters, why retries can make things worse, why autoscaling misses a sudden rush, why breakers help) shows up in where things settle.

## Decision

A steady-state model, solved by iteration. Load and failures depend on each other through retries and breakers, so each round sends every journey's requests through its hops using the last round's failure rates, then updates each component's failure rate halfway towards what its new load implies. It stops when nothing moves. [Architecture](../architecture.md#the-simulation) has the formulas.

The animated dots are drawn from the result (more dots for more traffic, red for the share that fails). They show what the numbers mean; they aren't the simulation.

## Consequences

- **Deterministic:** the same conditions always give the same numbers, so the tests can pin exact values and prove every challenge is solvable.
- **Instant:** under a millisecond for the ride-hailing app, so every change updates at once.
- **Explainable:** every number comes from a formula the docs state, and the explanations panel can say why.
- **No time:** it can't show transitions, like the stampede at the moment a cache comes back, or a queue slowly draining. Sudden spikes are modelled as "autoscaling hasn't caught up yet", a single snapshot.
- **Averages:** latency is a typical wait, not a p99, and parallel calls are added as if sequential.
- Damping matters. Without it, retries and failures can swing back and forth between rounds instead of settling. Moving halfway each round settles them.
