---
name: effect
description: |
  Opinionated guide for building TypeScript applications with Effect v4. Use for Effect workflows, services, layers, schemas, resources, concurrency, streams, HTTP, or tests.
license: MIT
---

# Effect

Use this skill for design choices and local preferences. Use the project's Effect source for exact APIs. Follow established project conventions unless the task changes them.

## Work from project source

1. Read repository instructions and nearby application code before choosing a pattern.
2. Locate the Effect subtree or checkout through repository guidance and directory structure, often under `repos/` or `vendor/`. Compare its version and revision with the application's manifest and lockfile; a vendored checkout can differ from the dependency actually used.
3. Read only relevant sections of its `LLMS.md` and linked `ai-docs` examples. Check the matching module under `packages/effect/src`, nearby runtime tests, and `typetest` cases for signatures, failures, lifecycle, and inference.
4. If local source is missing or mismatched, use the installed package or the matching upstream release. Do not copy unreleased APIs or change dependencies to make an example fit.
5. Type-check and exercise the changed path in the application. Source reading does not replace verification.

Keep the subtree unchanged unless the task requires a dependency update. Check exports and `@stability`; an import path without `unstable` does not guarantee API stability. Upstream examples explain the library, but do not override the preferences here.

## Design boundaries

- Keep business rules in services or domain functions and transport handlers thin.
- Make required services, authority, and resource ownership explicit. Run effects only at process or framework edges.
- Recover only when the boundary can provide a meaningful response. Retry only when repeating the operation is safe, and leave exhausted failures visible.
- Infer types from canonical schemas and constructors. Do not bypass validation or Effect typing with casts, non-null assertions, or `as any`.

## Read the relevant reference

Before editing, read every reference that applies, not every reference in the skill. New data or error types require the Schema reference; service definitions require Services and layers. Each reference owns its topic's defaults and consequential warnings.

| Task | Reference |
| --- | --- |
| Models, variants, validation, errors | [Schema](references/SCHEMA.md) |
| Module style, services, layers, operation names | [Services and layers](references/SERVICES_LAYERS.md) |
| Resources, entry points, framework bridges | [Resources and runtime](references/RESOURCES_RUNTIME.md) |
| Promises, callbacks, cancellation | [Async interop](references/ASYNC_INTEROP.md) |
| Time and zones | [Time](references/TIME.md) |
| Parallel work, fibers, queues | [Concurrency](references/CONCURRENCY.md) |
| Logs, spans, metrics | [Observability](references/OBSERVABILITY.md) |
| Runtime settings | [Config](references/CONFIG.md) |
| Retry, polling, pacing | [Scheduling](references/SCHEDULING.md) |
| Memoization, caches, batching | [Caching](references/CACHING.md) |
| Event sources and consumers | [Streams](references/STREAMS.md) |
| Outgoing HTTP | [HTTP clients](references/HTTP_CLIENTS.md) |
| Effect tests and fakes | [Testing](references/TESTING.md) |

Read these only when the project uses the corresponding module or package:

| Integration | Reference |
| --- | --- |
| `effect/http-api` | [HttpApi](references/HTTP_API.md) |
| `effect/sql`, `@effect/sql-*` | [SQL](references/SQL.md) |
| `effect/reactivity`, `@effect/atom-*` | [Atoms](references/ATOM.md) |
| `effect/cli` | [CLI](references/CLI.md) |
| `effect/persistence` | [Persistence](references/PERSISTENCE.md) |
