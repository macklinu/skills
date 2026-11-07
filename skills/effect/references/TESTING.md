# Testing

Use `it.effect` from `@effect/vitest` for Effect tests. It runs the effect with test services and closes a fresh scope afterward.

Do not return an Effect from a plain Vitest callback or add a redundant `Effect.scoped` inside the Effect-aware test.

Use `it.live` only when live runtime services or real time are the behavior under test. Keep `expect` for ordinary assertions; prefer focused `@effect/vitest/utils` helpers for Effect values, such as `assertSome` for `Option` and `assertFailure` for `Result`.

## Control time and ordering

Use `TestClock` from `effect/testing` for retries, schedules, leases, and deadlines. Fork sleeping work before advancing the clock. Outside `it.effect`, provide `TestClock.layer()` so advancement also installs the tracking scheduler.

Do not sleep to guess when a worker is ready. Use `Deferred` for a one-shot readiness signal, `Queue` for controlled inputs or observed events, and `Latch` for reusable gates.

Keep test queues in the test's scope and register shutdown. Use `Ref` for observations, not as a substitute for a readiness handshake.

For finite stream fixtures, use `Stream.fromIterable`; add `Stream.never` when the subscription must remain open. For interactive events, drive a test-owned queue. Bound collection with `Stream.take` when the source does not end.

Assert behavior that can fail, including retry bounds, duplicate-write prevention, per-key ordering, interruption, and finalization where relevant. Do not assert only that a fake returns its configured value. Use property tests for invariants, with generators that shrink to useful failures, alongside explicit malformed boundary cases.

## Give fakes a local control surface

For reusable or stateful service fakes, keep `TestInterface extends Interface`, `TestService`, and `testLayer` alongside the service's established module conventions. Production code depends only on `Service`; tests use `TestService` to drive failures, publish events, or inspect observations.

Build one implementation object and register it under both tags with `Layer.effectContext`. This ensures controls and production calls share the same state. Keep operations function-valued, including zero-argument observations, so `Effect.fn` fits consistently.

Use `Layer.succeed` for complete static implementations. Reserve `Layer.mock` for tiny local partial mocks where omitted members should fail loudly.

## Isolate test state

Shared test layers intentionally share state and release resources after the suite. Prefer per-test provision or `{ buildPerTest: true }` when tests need fresh services. Nested per-test layers do not reset enclosing shared services.

Use `ConfigProvider.layer(ConfigProvider.fromUnknown(...))` when testing config decoding. Otherwise provide the application's decoded configuration service directly instead of mutating global environment variables.

For runner lifecycle and shared-layer details, consult `packages/vitest/src/index.ts`; for clock scheduling requirements, use `packages/effect/src/testing/TestClock.ts` in the matching source.
