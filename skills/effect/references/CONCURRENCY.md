# Concurrency, Fibers, And Back-Pressure

Use this for parallel Effect workflows, background fibers, supervision, shared capacity limits, or queue-based work outside Stream pipelines.

## Bounded Parallelism

- Set `concurrency` explicitly on `Effect.forEach`, `Effect.all`, and similar combinators when work can overlap. Prefer a measured finite bound; use `"unbounded"` only when the input and downstream capacity are already bounded.
- Use `Semaphore` for one shared external capacity constraint such as a connection, provider, or CPU-heavy section. Use `PartitionedSemaphore` when keyed groups need fair access to one shared permit pool and the project-pinned version provides it; it does not create an independent limit per key.
- A local concurrency option bounds one traversal; a semaphore coordinates capacity across independent callers. Choose by ownership, not syntax.

## Fiber Ownership And Supervision

- Use `Effect.forkChild` for work owned by the parent fiber; it is interrupted when that fiber ends. Use `Effect.forkScoped` or `Effect.forkIn(scope)` for work owned by a scope, such as a layer lifetime.
- Use `FiberSet` for a scoped collection of unkeyed jobs and `FiberMap` for scoped keyed jobs, replacement, or keyed cancellation instead of hand-maintained maps of fibers.
- Join, interrupt, or intentionally supervise spawned work. If failures should be observed centrally, encode that policy in the owning fiber, layer, `FiberSet`, or `FiberMap`; never fire and forget an unscoped fiber.
- Keep restart/recovery policy at the owning boundary and preserve interruption.

## Queue Policy

- `Queue.bounded` suspends producers when full and is the default when loss is unacceptable.
- `Queue.dropping` rejects new items when full; use it only when losing newest work is truthful.
- `Queue.sliding` evicts older items to retain recent state; use it for latest-value or refresh semantics.
- Avoid `Queue.unbounded` unless growth is provably bounded elsewhere.
- Queue constructors do not register scope finalizers. Register `Queue.shutdown` with the owning layer/scope, and expose only the enqueue/dequeue side that callers need. Shutdown discards buffered items and interrupts an open queue; for normal stream completion after draining, use a queue with `Cause.Done` in its error type and call `Queue.end` before waiting for the consumer.
