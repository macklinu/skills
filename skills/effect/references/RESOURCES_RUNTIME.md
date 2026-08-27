# Resources, Scopes, And Runtime Boundaries

Use this when acquiring resources, managing scopes, starting an application, or bridging Effect services into a non-Effect host.

## Resource Lifetime

- Use `Effect.acquireRelease(acquire, release)` for connections, clients, file handles, listeners, and SDK resources that require cleanup.
- Acquire the resource once in its owning `Layer` or scope. Keep the release action next to acquisition and make it safe to run during interruption.
- Use `Effect.scoped` only when the caller should own and close a local scope. Layers and other scoped callers already provide scope ownership.
- Use specialized tools such as `Pool`, `ScopedCache`, or `ScopedRef` only when their sharing and replacement semantics match the resource; do not replace a simple acquire/release pair with a lifecycle catalog.
- Never return a scoped resource to code that can outlive its owning scope.

## Process Entry Points

Represent a long-running application as layers, convert it with `Layer.launch`, and run it once at the process edge with the platform runtime:

```ts
const main = Layer.launch(AppLive)
NodeRuntime.runMain(main)
```

Use the corresponding `BunRuntime.runMain` on Bun. Platform `runMain` installs process shutdown handling so interruption reaches fibers and finalizers.

## Non-Effect Hosts

- For Hono, Express, Fastify, or another host that owns the event loop, create one `ManagedRuntime.make(AppLayer)` at the integration boundary.
- Call that managed runtime from host handlers, and dispose it during host shutdown so layer finalizers run.
- Keep `ManagedRuntime.runPromise`, `runSync`, or `runCallback` in the host adapter. Do not scatter `Effect.runPromise` through services or application workflows.
- Map typed failures to the host's response/error model at this boundary; do not erase the Effect error channel inside domain services.
