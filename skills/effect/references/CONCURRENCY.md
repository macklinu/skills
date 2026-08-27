# Concurrency, Fibers, And Back-Pressure

Use this for parallel Effect workflows, background fibers, supervision, shared capacity limits, or queue-based work outside Stream pipelines.

## Bounded Parallelism

- Set `concurrency` explicitly on `Effect.forEach`, `Effect.all`, and similar combinators when work can overlap. Prefer a measured finite bound; use `"unbounded"` only when the input and downstream capacity are already bounded.
- Use `Semaphore` for one shared external capacity constraint such as a connection, provider, or CPU-heavy section. Use `PartitionedSemaphore` when limits are keyed and the project-pinned version provides it.
- A local concurrency option bounds one traversal; a semaphore coordinates capacity across independent callers. Choose by ownership, not syntax.

## Fiber Ownership And Supervision

- Prefer structured operators such as `Effect.forkChild` and `Effect.forkScoped` so child work cannot silently outlive its owner.
- Use `FiberSet` for a scoped collection of unkeyed jobs and `FiberMap` for scoped keyed jobs, replacement, or keyed cancellation instead of hand-maintained maps of fibers.
- Join, interrupt, or intentionally supervise spawned work. If failures should be observed centrally, encode that policy in the owning fiber, layer, `FiberSet`, or `FiberMap`; never fire and forget an unscoped fiber.
- Keep restart/recovery policy at the owning boundary and preserve interruption.

## Queue Policy

- `Queue.bounded` suspends producers when full and is the default when loss is unacceptable.
- `Queue.dropping` rejects new items when full; use it only when losing newest work is truthful.
- `Queue.sliding` evicts older items to retain recent state; use it for latest-value or refresh semantics.
- Avoid `Queue.unbounded` unless growth is provably bounded elsewhere.
- Shut down owned queues with their layer/scope, and expose only the enqueue/dequeue side that callers actually need.
