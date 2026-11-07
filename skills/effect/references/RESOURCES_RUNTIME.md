# Resources, Scopes, And Runtime Boundaries

Use this when acquiring resources, managing scopes, starting an application, or bridging Effect services into a non-Effect host.

## Resource Lifetime

- Use `Effect.acquireRelease(acquire, release)` for connections, clients, file handles, listeners, and SDK resources that require cleanup.
- Acquire the resource once in its owning `Layer` or scope. Keep the release action next to acquisition and make it safe to run during interruption.
- `acquireRelease` protects acquisition from interruption by default and registers release only after acquisition succeeds. Use its third argument `{ interruptible: true }` only when acquisition can safely be canceled without leaving a partially acquired resource.
- Release receives `(resource, exit)` and must return an Effect with no typed failures. Handle expected cleanup failures explicitly rather than casting them away.
- Use `Effect.scoped` only when the caller should own and close a local scope. Layers and other scoped callers already provide scope ownership.
- Use specialized tools such as `Pool`, `ScopedCache`, or `ScopedRef` only when their sharing and replacement semantics match the resource; do not replace a simple acquire/release pair with a lifecycle catalog.
- Never return a scoped resource to code that can outlive its owning scope.

## Process Entry Points

Represent a long-running application as layers, convert it with `Layer.launch`, and run it once at the process edge with the platform runtime:

```ts
import { Layer } from "effect"
import { NodeRuntime } from "@effect/platform-node"

const main = Layer.launch(AppLive)
NodeRuntime.runMain(main)
```

Use the corresponding `BunRuntime.runMain` on Bun. Platform `runMain` installs process shutdown handling so interruption reaches fibers and finalizers.

## Non-Effect Hosts

- For Hono, Express, Fastify, or another host that owns the event loop, create one `ManagedRuntime.make(AppLayer)` at the integration boundary.
- Call that managed runtime from host handlers, and dispose it during host shutdown so layer finalizers run.
- `ManagedRuntime.make` builds its layer lazily and caches the resulting services. `runSync` throws if first-time layer acquisition or the requested effect crosses an asynchronous boundary; use `runPromise` for asynchronous hosts.
- Use `runtime.runPromiseExit(...)` when the host must inspect typed failures, defects, or interruption before producing a response. `runPromise(...)` rejects on failure and does not preserve a typed Promise rejection channel.
- Keep `ManagedRuntime.runPromise`, `runSync`, or `runCallback` in the host adapter. Do not scatter `Effect.runPromise` through services or application workflows.
- Map typed failures to the host's response/error model at this boundary; do not erase the Effect error channel inside domain services.

Do not copy v3 `Runtime<R>` / `Effect.runtime` bridges. v4 runners live on `Effect`; when an existing Effect scope owns the services, use `Effect.context<R>()` with a corresponding `Effect.run*With(services)` runner rather than creating a second resource owner. Capturing a context does not extend resource lifetime; stop host work before the owning scope closes.

Sources:

- [Acquisition contract](https://github.com/Effect-TS/effect/blob/506eef143bcc1750ce58920aac1e45da7265d103/packages/effect/src/Effect.ts#L6802-L6872).
- [Managed runtime methods](https://github.com/Effect-TS/effect/blob/506eef143bcc1750ce58920aac1e45da7265d103/packages/effect/src/ManagedRuntime.ts#L145-L220).
- [Runtime migration guide](https://github.com/Effect-TS/effect/blob/506eef143bcc1750ce58920aac1e45da7265d103/migration/runtime.md#L15-L17).
