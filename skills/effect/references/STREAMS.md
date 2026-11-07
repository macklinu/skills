# Streams

Use this when working with `Stream`, event sources, async iterables, queue/pubsub-backed streams, pagination, backpressure, throttling, debouncing, or long-lived stream consumers.

## Mental Model

`Stream<A, E, R>` is an effectful source that can emit many `A` values over time, fail with `E`, and require services `R`. Consumption pulls values and controls downstream demand. A queue or callback source needs its own capacity and overflow policy; a stream does not automatically slow an external producer.

Use streams for sources that are naturally many-valued and time-ordered:

- gateway events
- provider callbacks adapted through queues
- subscription/event logs
- paginated APIs
- file/stdin/platform streams
- scheduled ticks when values matter
- pipelines with filtering, mapping, buffering, throttling, or bounded concurrent processing

Do not use streams just to loop forever. For one repeated effect with no emitted values, use `Effect.repeat(...)` with `Schedule`; read `SCHEDULING.md`.

## Source Chooser

- In-memory values: `Stream.make(...)` or `Stream.fromIterable(...)`.
- Test fixtures: `Stream.fromIterable(...)`, often with `Stream.concat(Stream.never)` for an open subscription.
- Queue-backed callback boundary: `Queue` plus `Stream.fromQueue(...)`.
- Broadcast events: `PubSub` plus `Stream.fromPubSub(...)`.
- Latest-value state plus updates: `SubscriptionRef`.
- Schedule-generated ticks/values: `Stream.fromSchedule(...)`.
- Paginated pull APIs: `Stream.paginate(...)`; its step returns `Effect<readonly [ReadonlyArray<A>, Option<nextState>]>`. The stream emits each page's elements, not the page array; a final page is emitted even when the next state is `Option.none()`.
- Async iterable/platform source: `Stream.fromAsyncIterable(iterable, onError)` when no native Effect source exists. Map iterator exceptions into a typed boundary error with `onError`.
- Effect that produces a stream after reading services/config: `Stream.unwrap(...)`.

## Transformation Chooser

- Pure transformation: `Stream.map(...)`.
- Effectful transformation: `Stream.mapEffect(...)`.
- Bounded concurrent effectful transformation: `Stream.mapEffect(fn, { concurrency })`.
- Drop ordering when order is irrelevant and latency matters: `Stream.mapEffect(fn, { concurrency, unordered: true })`.
- One input to zero/many outputs: `Stream.flatMap(...)`.
- Multiple inner streams concurrently: `Stream.flatMap(fn, { concurrency })`.
- Keep only matching values: `Stream.filter(...)` / `Stream.filterEffect(...)`.
- Stateful transformation: `Stream.mapAccum(...)` / `Stream.mapAccumEffect(...)`.
- Paginated pull-to-elements: prefer `Stream.paginate(...)` over hand-rolled loops. There is no separate `Stream.paginateEffect`.

## Consumption Chooser

- Side-effecting consumer: `Stream.runForEach(...)`.
- Ignore elements but run the stream: `Stream.runDrain`.
- Tests/small finite streams: `Stream.runCollect`.
- First N values in tests: `Stream.take(n)` plus `Stream.runCollect`.
- Fold into a value: `Stream.runFold(...)`.
- Long-lived consumer in a layer: `stream.pipe(Stream.runForEach(...), Effect.forkScoped)`.

Avoid `Stream.runCollect` on unbounded or production event streams.

## Long-Lived Consumers

Own long-lived stream consumers in layers and fork them into the layer scope.

```ts
export const layer = Layer.effectDiscard(
  Effect.gen(function* () {
    const gateway = yield* Gateway.Service

    yield* gateway.events.pipe(
      Stream.filter(isMessageEvent),
      Stream.runForEach(handleEvent),
      Effect.forkScoped,
    )
  }),
)
```

Guidance:

- Let the layer own the stream lifetime.
- Use `Effect.forkScoped` for the ordinary case.
- If methods need to fork work into the layer lifetime, capture `Scope.Scope` during layer acquisition and use `Effect.forkIn(scope)` internally. Do not expose the scope as public service API.
- Preserve stream failures unless the owning boundary has a truthful recovery policy.

## Queues, PubSub, And SubscriptionRef

- Use `Queue` when each event/item should be consumed by one consumer or worker.
- Use `PubSub` to broadcast to active subscribers. Dropping/sliding overflow can lose events, and late subscribers receive past events only when replay is configured.
- Use `SubscriptionRef` when consumers need the current value and a stream of changes.
- Own queue/pubsub shutdown in the producing scope, for example with `Effect.acquireRelease(Queue.bounded<Event, Cause.Done>(capacity), Queue.shutdown)`. `Stream.fromQueue` does not own queue shutdown. To finish normally after draining, call `Queue.end`; `Stream.fromQueue` removes `Cause.Done` from its error channel.
- Expose a `Stream` from service interfaces when callers should consume events, not push into the queue.
- Keep producer queues/private refs inside the implementation or test service.

Good service shape:

```ts
export interface Interface {
  readonly events: Stream.Stream<ProviderEvent, ProviderError>
  readonly status: Stream.Stream<ProviderStatus>
}
```

Implementation can use private `Queue` / `SubscriptionRef`; consumers see streams.

## Backpressure And Buffers

Prefer natural stream backpressure first.

Use `Stream.buffer(...)` only when producer and consumer should decouple.

- `strategy: "suspend"`: apply backpressure when full.
- `strategy: "dropping"`: drop new values when full.
- `strategy: "sliding"`: keep the latest values by dropping old ones.
- `capacity: "unbounded"`: rare; use only when growth is bounded elsewhere.

Use `Stream.debounce(...)` for quiet-period behavior.

`Stream.throttle({ cost, units, duration, strategy })` and `Stream.throttleEffect(...)` use a token bucket and cost whole chunks. The default `"shape"` strategy delays chunks; `"enforce"` drops chunks that exceed the rate. Use `Stream.rechunk(1)` first when pacing must apply one element at a time.

## Error Handling

- Prefer typed stream errors over defects.
- Use `Stream.mapError(...)` to translate errors at boundaries.
- Use `Stream.catchIf(...)`, `Stream.catchTag(...)`, or `Stream.catchFilter(...)` for typed recovery.
- Typed stream recovery skips every cause containing a defect, even when a typed error is also present. A typed error mixed only with interruption can still be recovered, so use a cause-level guard if every interruption-containing cause must propagate.
- Use `Stream.catchCause(...)` only at explicit supervision boundaries.
- Do not hide stream defects by default. `Effect.forkScoped` owns the consumer lifetime but does not propagate its failure to the layer that forked it. Join from a supervising workflow or use an explicit supervisor when failure must fail the owner; do not block layer acquisition on a long-lived join.

## Keyed Concurrency

For streams of work keyed by session/channel/id, prefer a named helper over ad hoc maps of fibers.

If the codebase already has a keyed-run helper (for example a `runForEachKeyed` that runs different keys concurrently while serializing each key and coalescing pending values into one latest-value rerun), use it. Otherwise build one named helper with `FiberMap` rather than scattering fiber bookkeeping through consumers.

`FiberMap` manages keyed fiber lifetime; it does not itself serialize work or coalesce pending values. Its default replacement interrupts the previous fiber, while `onlyIfMissing` skips new work for a running key. The helper must implement any serial/latest-rerun policy explicitly.

Use this for projection/reconciliation streams where each key needs ordered processing but different keys can run in parallel.

## Tests

- Use `Stream.fromIterable(...)` for finite fixtures.
- Use `Stream.empty` for no events.
- Use `Stream.fromQueue(...)` with a test-owned `Queue` when the test needs to drive events interactively.
- Use `Stream.take(n)` plus `Stream.runCollect` for finite assertions.
- Avoid real sleeps; coordinate with `Deferred`, `Queue`, `Latch`, and `TestClock`.

Sources:

- [Pagination signature](https://github.com/Effect-TS/effect/blob/506eef143bcc1750ce58920aac1e45da7265d103/packages/effect/src/Stream.ts#L1540-L1594).
- [Queue streams](https://github.com/Effect-TS/effect/blob/506eef143bcc1750ce58920aac1e45da7265d103/packages/effect/src/Stream.ts#L1163-L1191).
- [Throttling semantics](https://github.com/Effect-TS/effect/blob/506eef143bcc1750ce58920aac1e45da7265d103/packages/effect/src/Stream.ts#L8369-L8447).
