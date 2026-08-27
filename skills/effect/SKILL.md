---
name: effect
description: |
  Opinionated guide for building production TypeScript applications with Effect v4. Use when implementing Effect workflows, services, layers, schemas, configuration, schedules, caches, streams, HTTP clients, or tests.
license: MIT
---

# Effect

Use current Effect v4 APIs and the production defaults in this skill. Established project conventions still take precedence unless the task is explicitly changing them.

## Source Rule

Check these before guessing:

- the nearest `AGENTS.md` and any project-local Effect practices doc
- the project-pinned `effect` package source and version
- current upstream Effect source when the installed package does not answer the question

This local guidance was last reviewed against `effect@4.0.0-rc.111`. Before introducing an unstable or version-sensitive API, confirm its export path and signature in the project's pinned Effect version. The review version is a gardening baseline, not a substitute for the project source.

## Branch Chooser

Read only the branch references that match the task.

- Data models, schemas, brands, variants, optional keys, or decoders: read `references/SCHEMA.md`.
- Services, module surfaces, layers, runtime wiring, errors, `Effect.fn`, or test services: read `references/SERVICES_LAYERS.md`.
- Resource acquisition/release, scopes, application entry points, runtime ownership, or framework bridges: read `references/RESOURCES_RUNTIME.md`.
- Promise/callback APIs, JavaScript interop, `AbortSignal`, or cancellation: read `references/ASYNC_INTEROP.md`.
- Current time, parsing/formatting dates, time zones, or temporal calculations: read `references/TIME.md`.
- Parallel effects, fibers, supervision, semaphores, queues, or non-Stream back-pressure: read `references/CONCURRENCY.md`.
- Logging, spans, structured annotations, metrics, tracing, or telemetry: read `references/OBSERVABILITY.md`.
- Runtime config, env variables, `ConfigProvider`, or `layerConfig`: read `references/CONFIG.md`.
- Retry, repeat, polling, backoff, jitter, rate-limit-aware policies, or pass loops: read `references/SCHEDULING.md`.
- Memoization, per-key TTL caches, deduplicating concurrent lookups, or request batching: read `references/CACHING.md`.
- Streams, event sources, async iterables, queues/pubsubs, pagination, backpressure, or stream consumers: read `references/STREAMS.md`.
- Outgoing HTTP calls, Effect HttpClient, status handling, or HTTP rate limiting: read `references/HTTP_CLIENTS.md`.
- Effect tests, time, sleeps, concurrency synchronization, or fakes: read `references/TESTING.md`.

Load these opt-in package branches only after confirming the project uses the named package or module:

- `effect/unstable/httpapi` / `HttpApi`: read `references/HTTP_API.md`.
- `effect/unstable/sql` or an `@effect/sql-*` driver: read `references/SQL.md`.
- `effect/unstable/reactivity` or an `@effect/atom-*` binding: read `references/ATOM.md`.
- `effect/unstable/cli`: read `references/CLI.md`.
- `effect/unstable/persistence`: read `references/PERSISTENCE.md`.

If a task spans several branches, read all matching files before editing.

## Core Defaults

- Compose workflows with `Effect.gen(function* () { ... })`.
- Define public service methods and non-trivial internal service methods with `Effect.fn("Domain.operation")`.
- Use `Effect.fnUntraced` only for internal helpers where stack-frame/span metadata is intentionally unnecessary.
- Prefer `Context.Service` for application services when the codebase has not standardized on another current service-tag style.
- Build real service implementations with `Layer.effect(Service, Effect.gen(...))` and return `Service.of({ ... })`.
- Acquire resources in their owning scope and run effects only at process or framework edges.
- Adapt Promise and callback APIs with Effect constructors that preserve laziness, typed failures, and cancellation.
- Use `Clock` for current time and `DateTime` for parsing, zones, arithmetic, and formatting in effectful application code.
- Choose bounded concurrency explicitly and keep spawned fibers scoped, joined, interrupted, or deliberately supervised.
- Give meaningful boundaries spans and safe structured annotations; configure loggers at the composition root and keep exporters opt-in.
- Infer TypeScript types from their canonical schemas or constructors whenever the API exposes the type instead of restating the shape by hand.
- Model records with `Schema.Struct(...)` plus a same-name `interface`.
- Model typed Effect errors with `Schema.TaggedError`.
- Read runtime config through `Config`, not direct `process.env` access in application logic.
- Use `Schedule` for retry, repeat, polling, pacing, and backoff policies.
- Use `Stream` for effectful sources that emit many values over time and need pull, backpressure, interruption, or transformation.
- Prefer Effect HTTP client modules for outgoing HTTP in Effect applications when their typed errors, layers, and client transforms are useful.
- Prefer Effect-aware tests, explicit layers, and deterministic synchronization over sleeps.
- Prefer decoders and `schema.makeEffect(...)` at untrusted boundaries; reserve throwing `schema.make(...)` for trusted construction, and never use casts to skip validation.

## Quick Selection Guide

- Ordinary object record: `Schema.Struct(...)` plus same-name `interface`.
- Scalar ID/value object: constrained branded schema.
- Internal workflow decision or state: `Data.TaggedEnum<...>` plus `Data.taggedEnum<...>()` constructors and exhaustive `$match`.
- Reusable boundary-crossing tagged variant: `Schema.TaggedStruct(...)` plus `type Foo = typeof Foo.Type`.
- Boundary-crossing tagged union: `Schema.TaggedUnion(...)` plus `type Foo = typeof Foo.Type`, with `.cases`, `.guards`, and `.match`.
- External/custom discriminator such as `type`: `Schema.Struct({ type: Schema.tag("variant"), ... })` plus `Schema.toTaggedUnion("type")` when union helpers are needed.
- Expected typed failure: `Schema.TaggedError`.
- Unknown boundary payload: `Schema.decodeUnknownEffect(...)`.
- Service boundary: `Context.Service<Service, Interface>()(...)` plus `Layer.effect(...)` plus `Service.of(...)`.
- Public or non-trivial internal service method: `Effect.fn("Domain.operation")`.
- Runtime configuration: `Config` recipes read in layers; override with `ConfigProvider` in tests.
- Event source: `Stream` consumed with `Stream.runForEach(...)` and forked with `Effect.forkScoped` in the owning layer.
- Queue-backed event source: `Queue` for the producer boundary, `Stream.fromQueue(...)` for consumers.
- Broadcast event source: `PubSub` / `Stream.fromPubSub(...)` or `SubscriptionRef` for latest-value state.
- Polling worker: `runPass().pipe(Effect.repeat(Schedule.spaced(...)))`, with typed pass failures handled before repeat.
- Retry transient operation: `Effect.retry(...)` / `Effect.retryOrElse(...)` with a bounded `Schedule`.
- Keyed lookup cache with TTL and concurrent-lookup dedupe: prefer `Cache.make(...)` / exit-aware `Cache.makeWith(...)` when their lifecycle and eviction model fit.
- Memoize a single effect result: `Effect.cached(...)` / `Effect.cachedWithTTL(...)`.
- Batch N keys into one backend call (only when a real batch endpoint exists): `Effect.request(...)` + `RequestResolver`.
- HTTP request in an Effect application: prefer Effect `HttpClient` plus request/response schema decoding.
- HTTP transient retry: `HttpClient.retryTransient(...)`.
- Time-sensitive test: `TestClock`, not real sleeping.
- Concurrent/background test synchronization: `Deferred`, `Queue`, `Latch`, `Ref`, or explicit test hooks.

## Boundary Rules

- Keep HTTP handlers thin: decode input, read context, call services, map typed errors to transport responses.
- Keep business rules in services or domain functions, not transport handlers.
- Wrap HTTP clients, SDKs, CLIs, and external integrations in named effects at adapter boundaries.
- Decode persisted rows with Schema or SQL-specific helpers when values are not trivially trusted.
- Keep provider/network calls outside authoritative database transactions.
- Catch or retry only when the current boundary has a truthful response.
- Retry only when the operation has proven idempotency.
- Let exhausted failures remain visible unless the boundary has a real fallback.

## Do Nots

- Do not use `as any`, non-null assertions, or unchecked casts to silence Effect typing problems.
- Do not introduce `Schema.Class` or `Schema.TaggedClass` as default app data-modeling patterns.
- Do not hand-roll `_tag` error classes when `Schema.TaggedError` fits.
- Do not use cause-level recovery when typed-error recovery is enough.
- Do not use `Layer.mergeAll(...)` or `provideMerge(...)` as blind make-it-compile tools.
- Do not hide required application authority, credentials, persistence, transports, or external services behind `Context.Reference` defaults.
- Do not add arbitrary `Effect.sleep(...)` to tests when a deterministic synchronization primitive is available.
- Do not hand-roll Map/TTL/prune caches or in-flight dedupe when `effect/Cache` fits.
