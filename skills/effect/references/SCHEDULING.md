# Scheduling And Retry

Use this when writing retries, repeats, polling workers, backoff, jitter, rate-limit-aware policies, timeouts, or pass loops.

Use `Schedule` for retry, polling, pacing, and repeated background work instead of hand-rolled `while (true)` loops with sleeps.

## Core Rules

- `Effect.retry(...)` retries recoverable typed failures. Pure interruption and any cause containing a defect are not retried; a typed failure mixed with interruption can still be recovered.
- `Effect.repeat(...)` repeats successful effects; failures stop repetition unless the pass handles them first.
- The source effect runs once before the schedule is stepped.
- `Schedule.recurs(3)` means three retries/repetitions after the initial run.
- `Schedule.spaced(...)` waits after work completes.
- `Schedule.fixed(...)` aligns executions to a cadence. Work that overruns the interval can recur immediately; missed intervals are not replayed.
- Use `Schedule.exponential(...)` or `Schedule.fibonacci(...)` for backoff.
- Add `Schedule.jittered` to avoid synchronized retry storms.
- Use `Schedule.recurs(...)` for a counter schedule or `Schedule.upTo({ times })` to bound a delay schedule.
- Use `Schedule.tap(({ input, output, duration, attempt }) => ...)` to observe retry inputs and schedule metadata.
- Use `Effect.retryOrElse(...)` when exhausted retries need a fallback/reporting effect.
- Retry only at the narrowest boundary with proven idempotency.
- Exhausted failures should remain visible unless the boundary has a truthful fallback.

## Polling Workers

Prefer typed pass failures over cause recovery.

```ts
const pass = runPass().pipe(
  Effect.tapError((error) =>
    Effect.logError("Worker.pass_failed", error),
  ),
  Effect.ignore,
)

const run = pass.pipe(
  Effect.repeat(Schedule.spaced("1 second")),
)
```

This shape logs and discards recoverable typed pass failures so the worker continues. Causes containing defects still reach supervision, with typed failures converted to defects. `Effect.ignore` can discard a typed failure mixed with interruption, so do not use it where every interruption-containing cause must propagate.

Use cause-level recovery only at supervision boundaries where the policy is truly "report non-interrupt failure and continue".

```ts
const logNonInterruptCauseAndContinue = (message: string) =>
  Effect.catchCauseIf(
    (cause) => !Cause.hasInterrupts(cause),
    (cause) => Effect.logError(message, cause),
  )
```

Do not catch causes just to make failures disappear. If only expected typed failures should be recoverable, use `Effect.catchIf(...)`, `Effect.catchFilter(...)`, `Effect.catchTag(...)`, or `Effect.retry(...)` on those typed errors instead.

## Per-Item Failure Isolation

For batch workers, catch expected item-level typed failures around each item so one bad item does not stall the batch.

```ts
yield* Effect.forEach(
  items,
  (item) =>
    processItem(item).pipe(
      Effect.tapError((error) =>
        Effect.logError("Worker.item_failed", error).pipe(
          Effect.annotateLogs({ itemId: item.id }),
        ),
      ),
      Effect.ignore,
    ),
  { discard: true, concurrency: 5 },
)
```

Only do this when retrying the item later is truthful or skipping the item is the product policy.

## Reusable Retry Policy

```ts
const projectionRetrySchedule: Schedule.Schedule<unknown, ProjectionError> =
  Schedule.exponential("100 millis").pipe(
    Schedule.jittered,
    Schedule.upTo({ times: 5 }),
  )

const reconcileWithRetry = (target: Target) =>
  reconcile(target).pipe(
    Effect.retryOrElse(
      projectionRetrySchedule.pipe(
        Schedule.tap(({ input: error }) =>
          Effect.logWarning("Agent.Projection.reconcile.retrying").pipe(
            Effect.annotateLogs({ operation: error.operation }),
          ),
        ),
      ),
      (error) => Effect.logError("Agent.Projection.reconcile.stopped", error),
    ),
  )
```

Use this when the operation is idempotent and retry state is useful for logs or metrics.

## Rate-Limit-Aware Typed Retry

For provider errors that carry `retryAfterMs`, let the schedule use the larger of the backoff delay and the provider delay.

```ts
type RateLimited = {
  readonly retryAfterMs?: number | undefined
}

const providerRetrySchedule: Schedule.Schedule<RateLimited, RateLimited> =
  Schedule.exponential("200 millis").pipe(
    Schedule.jittered,
    Schedule.upTo({ times: 5 }),
    Schedule.setInputType<RateLimited>(),
    Schedule.passthrough,
    Schedule.modifyDelay(({ input, duration }) =>
      Effect.succeed(
        input.retryAfterMs === undefined
          ? duration
          : Duration.max(duration, Duration.millis(input.retryAfterMs)),
      ),
    ),
  )
```

Use this for operation-level retries over typed provider errors. For Effect HttpClient-level 429 handling and proactive pacing, read `HTTP_CLIENTS.md`.

## Timeouts And Delays

- Use `Effect.timeout(...)` when the operation has a real deadline.
- Use `Effect.delay(...)` when one operation should start later.
- Use `Effect.sleep(...)` inside production workflows only when sleeping itself is the domain behavior.
- Avoid manual sleep loops; use `Effect.repeat(...)` with `Schedule` for recurring work.
- In tests, use `TestClock` rather than real time. Read `TESTING.md`.

Sources:

- [Retry control flow](https://github.com/Effect-TS/effect/blob/506eef143bcc1750ce58920aac1e45da7265d103/packages/effect/src/internal/schedule.ts#L49-L79).
- [`Effect.ignore` failure precedence](https://github.com/Effect-TS/effect/blob/506eef143bcc1750ce58920aac1e45da7265d103/packages/effect/src/Effect.ts#L4403-L4424).
- [Schedule metadata and delay changes](https://github.com/Effect-TS/effect/blob/506eef143bcc1750ce58920aac1e45da7265d103/packages/effect/src/Schedule.ts#L1082-L1113).
