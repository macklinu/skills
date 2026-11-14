# Concurrency and ownership

Default to sequential execution. Opt into concurrency when independent work benefits from overlap; choose a finite `concurrency` and preserve required ordering and failure semantics.

A traversal limit bounds that traversal, not all callers of a provider.

Use a shared `Semaphore` in the owning service when independent callers must share capacity. Use its permit combinators so interruption and failure release permits.

Use unbounded concurrency only when both the input and downstream capacity are bounded elsewhere. If keyed groups need fair access to one shared permit pool, consider `PartitionedSemaphore`. It does not give each key an independent limit, and its unstable API needs a version check.

## Own lifetime and observe failure separately

Use `Effect.forkChild` for work that ends with the parent fiber. Use `Effect.forkScoped` or `Effect.forkIn(scope)` for work owned by a longer-lived scope, such as a layer. Join, interrupt, or deliberately supervise every spawned fiber.

Scope ownership does not establish readiness or propagate a background failure to the owner. Signal readiness with `Deferred`. Observe failures with `Fiber.join` or an explicit supervising workflow, and keep restart policy at that boundary.

Prefer `FiberSet` for scoped unkeyed jobs and `FiberMap` for keyed jobs rather than maintaining fiber collections yourself. Their `join` operations monitor failure; they do not wait for successful jobs to drain. Use `awaitEmpty` when draining is the requirement.

## Decide queue loss and completion policy

Use a bounded, suspending queue when work must not be lost. Choose dropping only when rejecting newest work is acceptable, and sliding only when older values can be replaced by newer state. An unbounded queue needs an external growth bound.

The producing scope owns `Queue.shutdown`; constructors do not register cleanup. Shutdown discards buffered items and interrupts an open queue. For normal completion after draining, include `Cause.Done` in the queue's error type, call `Queue.end`, and wait for the consumer before closing the scope.

Expose only the enqueue or dequeue capability callers need. For stream consumers and keyed serial processing, read `STREAMS.md`.

For exact lifecycle behavior, consult `packages/effect/src/{Effect,FiberSet,FiberMap,Queue}.ts` in the matching Effect source.
