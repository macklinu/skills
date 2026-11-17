# Testing

Use `it.effect` from `@effect/vitest` for Effect tests. It runs the effect with test services and closes a fresh scope afterward.

Do not return an Effect from a plain Vitest callback or add a redundant `Effect.scoped` inside the Effect-aware test.

Use `it.live` only when live runtime services or real time are the behavior under test. Keep `expect` for ordinary assertions; prefer focused `@effect/vitest/utils` helpers for Effect values, such as `assertSome` for `Option` and `assertFailure` for `Result`.

## Let the test framework own fixtures

For service-backed tests, use `layer` from `@effect/vitest` and the callback's `it.effect`. The runner acquires the layer graph, supplies its services, and closes its scope at the configured test or suite boundary, including on failure.

Compose fixture dependencies with `Layer.provide`, `Layer.provideMerge`, and `Layer.mergeAll`. Use `Layer.effect` for effectful setup and `Layer.unwrap` when scoped setup, such as a temporary directory, determines the layer configuration. Keep fixtures as ordinary services and layers, not a custom fixture framework.

Yield services inside setup and tests, for example `const reviews = yield* Reviews.Service`. Do not build a layer into a context and retrieve services with `Context.get`.

Do not use `Layer.build`, `Layer.buildWithMemoMap`, manual scopes, `ManagedRuntime`, or `Effect.run*` to assemble fixtures. Those approaches duplicate the runner's acquisition and cleanup responsibilities and can return clients after their scope has closed.

These fixture rules do not replace [production entry points and framework bridges](RESOURCES_RUNTIME.md#run-at-the-application-edge). If shutdown, interruption, release, or reopening is the behavior under test, retain the explicit lifecycle boundary and its assertions. Let the framework own the surrounding fixtures; do not move the tested transition to suite teardown or remove it to avoid a manual scope.

## Isolate mutable fixtures

Use `layer(fixtureLayer, { buildPerTest: true })` when tests mutate a database, fake, queue, or other service state. Each test gets a new acquisition and releases it when finished. A shared layer acquires once per block and releases after that block; use it only when sharing is intentional.

Put the whole mutable dependency graph inside the per-test layer. A nested per-test layer does not reset services from an enclosing shared layer. Acquire temporary directories with scoped filesystem operations in that graph so clients close before their files are removed.

Create mutable state during acquisition. `Layer.succeed` with an already-created mutable object still shares that object even when the layer builds per test.

## Test persistence through independent clients

To prove on-disk persistence, open two independent client graphs against the same file in a per-test temporary directory. Write through one and read through the other. A second service tag alone does not open another connection: layer memoization follows layer identity. Use a separate acquisition, or `Layer.fresh` around the client graph, to prevent reuse.

Expose the second client under a test-local service tag and yield it in the test. Compose initialization before the second graph when migrations or seed data must exist first. Do not substitute an in-memory database, reuse the first client, or weaken stale-write, isolation, finalization, or reopen assertions.

This SQLite example demonstrates fixture composition; repository tests should use the application's layers and migrations:

```ts
import { NodeServices } from "@effect/platform-node"
import { SqliteClient } from "@effect/sql-sqlite-node"
import { expect, layer } from "@effect/vitest"
import { Context, Effect, FileSystem, Layer, Path } from "effect"
import { SqlClient } from "effect/sql"

class Fixture extends Context.Service<Fixture>()("test/Fixture", {
  make: Effect.gen(function* () {
    const sql = yield* SqlClient.SqlClient
    yield* sql`CREATE TABLE drafts (id INTEGER PRIMARY KEY, text TEXT NOT NULL)`
    return { sql }
  }),
}) {}

class Reopened extends Context.Service<Reopened>()("test/Reopened", {
  make: SqlClient.SqlClient,
}) {}

const fixtureLayer = Layer.unwrap(
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem
    const path = yield* Path.Path
    const directory = yield* fs.makeTempDirectoryScoped()
    const database = SqliteClient.layer({
      filename: path.join(directory, "drafts.sqlite"),
    })
    const first = Layer.effect(Fixture, Fixture.make).pipe(
      Layer.provideMerge(database),
    )
    return Layer.effect(Reopened, Reopened.make).pipe(
      Layer.provide(Layer.fresh(database)),
      Layer.provideMerge(first),
    )
  }),
).pipe(Layer.provide(NodeServices.layer))

layer(fixtureLayer, { buildPerTest: true })("Persistence", (it) => {
  it.effect("reads committed text through an independent client", () =>
    Effect.gen(function* () {
      const { sql } = yield* Fixture
      const reopened = yield* Reopened
      yield* sql`INSERT INTO drafts (id, text) VALUES (1, ${"  draft  "})`
      expect(yield* reopened`SELECT text FROM drafts WHERE id = 1`).toEqual([
        { text: "  draft  " },
      ])
    }),
  )
})
```

Both clients remain open here, so this proves cross-client visibility, not shutdown and reopening. For close-and-reopen behavior, close the first client's owning scope before acquiring the second and retain assertions about release and persisted state.

## Control time and ordering

Use `TestClock` from `effect/testing` for retries, schedules, leases, and deadlines. Fork sleeping work before advancing the clock. Outside `it.effect`, provide `TestClock.layer()` so advancement also installs the tracking scheduler.

Do not sleep to guess when a worker is ready. Use `Deferred` for a one-shot readiness signal, `Queue` for controlled inputs or observed events, and `Latch` for reusable gates.

Keep test queues in the test's scope and register shutdown. Use `Ref` for observations, not as a substitute for a readiness handshake.

For finite stream fixtures, use `Stream.fromIterable`; add `Stream.never` when the subscription must remain open. For interactive events, drive a test-owned queue. Bound collection with `Stream.take` when the source does not end.

Assert behavior that can fail, including retry bounds, duplicate-write prevention, per-key ordering, interruption, and finalization where relevant. Do not assert only that a mock or fake returns its configured value. Assert calls only when the interaction itself is part of the contract.

Use property tests for invariants, with generators that shrink to useful failures, alongside explicit malformed boundary cases.

## Choose test implementations

When tests need stronger control, supply controlled or mocked service methods through test layers instead of module-import mocks or stubs. Do not replace real pure domain functions merely to isolate a workflow. Use stateful fakes for workflows that need controlled transitions or recovery.

For reusable or stateful service fakes, keep `TestInterface extends Interface`, `TestService`, and `testLayer` alongside the service's established module conventions. Production code depends only on `Service`; tests use `TestService` to drive failures, publish events, or inspect observations.

Build one implementation object and register it under both tags with `Layer.effectContext`. This ensures controls and production calls share the same state. Keep operations function-valued, including zero-argument observations, so `Effect.fn` fits consistently.

Use `Layer.succeed` for complete static implementations. Reserve `Layer.mock` for tiny local partial mocks where omitted members should fail loudly.

## Supply configuration

Use `ConfigProvider.layer(ConfigProvider.fromUnknown(...))` when testing config decoding. Otherwise provide the application's decoded configuration service directly instead of mutating global environment variables.

For runner lifecycle and shared-layer details, consult `packages/vitest/src/index.ts`; for clock scheduling requirements, use `packages/effect/src/testing/TestClock.ts` in the matching source.
