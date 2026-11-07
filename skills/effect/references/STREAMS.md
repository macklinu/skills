# Streams

Use `Stream` when a source emits many values over time and needs effectful transformation, pull-based consumption, or backpressure. For one repeated operation with no useful emitted values, use `Effect.repeat` with `Schedule` instead.

Keep ordinary stream composition direct. Use bounded concurrency for effectful transformations, and drop ordering only when the domain permits it. Collect only small finite streams; consume production event streams incrementally.

## Choose the producer boundary

Use a queue when each item goes to one consumer, `PubSub` for broadcast to active subscribers, and `SubscriptionRef` for current state plus updates. Late PubSub subscribers receive past events only when replay is configured. Keep writable queues and refs private when callers should only consume a stream.

Prefer `Stream.paginate` for pull-based paginated APIs. It emits page elements, including the final page when there is no next state. Adapt an async iterable only when no native Effect source fits, and translate iterator exceptions into a typed boundary error.

Pull-based consumption does not slow an external callback producer automatically. Bound that boundary and decide whether overflow suspends, rejects new events, or replaces old events.

Prefer natural backpressure; add a buffer only when producer and consumer need decoupling. Dropping and sliding buffers lose data.

Throttling costs whole chunks. If pacing must apply per element, use `Stream.rechunk(1)` first. Choose shaping to delay excess work; enforcement drops it.

## Own completion and failure

The producing scope owns queue or PubSub shutdown; `Stream.fromQueue` does not close its queue. Shutdown discards buffered items, so end and drain the queue before releasing the scope when work must finish normally. See [concurrency](CONCURRENCY.md) for queue ownership and completion.

Own a long-lived consumer in its layer scope with `Effect.forkScoped`. This controls lifetime, not failure propagation.

Observe failure from a supervising workflow rather than blocking layer acquisition on a long-lived join. Recover only where the owner has a meaningful policy; see [scheduling](SCHEDULING.md) for recovery and strict cancellation handling.

## Keep keyed policy explicit

Reuse an existing keyed-run helper for per-key serialization with concurrent work across keys. For reconciliation, it may also coalesce pending updates into one latest-value rerun. Make that choice explicit because it discards intermediate updates.

`FiberMap` owns keyed fibers but does not implement serialization or coalescing. Default replacement interrupts the previous fiber; `onlyIfMissing` skips new work while a key runs. If the project needs a serial/latest-rerun helper, implement that policy once rather than scattering fiber maps through consumers.

For exact pagination, chunking, and overflow behavior, consult `packages/effect/src/Stream.ts` and its focused tests in the matching source. See `TESTING.md` for deterministic event-driven tests.
