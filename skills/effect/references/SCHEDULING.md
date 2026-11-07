# Scheduling and retry

Use `Schedule` for retries, polling, pacing, and repeated work rather than a sleep loop. Retry at the narrowest boundary where the operation has proven idempotency.

A timeout does not prove that an external write failed. Retrying that write needs an idempotency key or another deduplication guarantee.

## Bound retries and preserve failure

Retry only errors that the boundary can meaningfully recover from. Add jitter to backoff so callers do not retry together, and bound the attempts. This policy allows five retries after the initial attempt:

```ts
import { Schedule } from "effect"

const retryPolicy = Schedule.exponential("100 millis").pipe(
  Schedule.jittered,
  Schedule.upTo({ times: 5 }),
)
```

Apply it with `Effect.retry` after selecting the transient typed failures. Exhaustion should remain visible. Use `Effect.retryOrElse` only when the boundary has a real fallback or a reporting policy that intentionally ends the operation.

If a provider supplies a retry delay, honor at least that delay instead of replacing it with a shorter backoff. See `HTTP_CLIENTS.md` for HTTP-specific retry and pacing.

## Own repeated work

`Effect.repeat` repeats successful passes; an unhandled failure stops the worker. Use `Schedule.spaced` when the delay belongs after each pass. Use `Schedule.fixed` for a cadence, accounting for immediate recurrence after overruns rather than replaying missed intervals.

Handle an expected pass failure before repeating only when continuing is the worker's policy. Isolate item failures inside a batch only when skipping or retrying those items later is truthful. Do not discard all failures to keep a worker alive; let defects and cancellation reach supervision.

Typed recovery has edge cases for mixed causes. If the worker requires every interruption-containing cause to propagate, inspect `packages/effect/src/internal/schedule.ts` and the chosen recovery combinator in `packages/effect/src/Effect.ts` before implementing a cause-level guard.

Use `Effect.timeout` for an actual deadline. Test delays, retry bounds, and cancellation with `TestClock` and deterministic synchronization; see `TESTING.md`.
