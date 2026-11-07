# Resources and runtime boundaries

Choose who owns a resource before acquiring it. A layer usually owns shared clients and connections; a local operation owns resources that must close when that operation finishes.

## Keep acquisition and release together

Use `Effect.acquireRelease` and keep the release action next to acquisition. Release receives the resource and closing `Exit`; handle expected cleanup failures explicitly because finalizers cannot return typed failures. Make cleanup safe during interruption.

Use `Effect.scoped` when the caller needs to create and close a local scope, not as extra wrapping around a layer that already owns one. Never return a resource to code that can outlive its scope. Reach for `Pool`, `ScopedCache`, or `ScopedRef` only when their sharing or replacement semantics match the actual lifecycle.

Acquisition is uninterruptible by default, and release is registered only after it succeeds. Choose `{ interruptible: true }` only when canceling acquisition cannot leave a partially acquired resource behind.

## Run at the application edge

For a standalone long-running application, compose layers, use `Layer.launch`, and run once with the platform's `NodeRuntime.runMain` or `BunRuntime.runMain`. These entry points connect process shutdown to fiber interruption and finalizers.

When a framework owns the event loop, create one `ManagedRuntime.make(AppLayer)` at the host adapter and dispose it during host shutdown. Its layer builds lazily and services are cached. Use `runPromise` for asynchronous handlers; `runSync` throws if either initial acquisition or the requested effect crosses an asynchronous boundary.

Keep runners out of domain services. Map typed failures to host responses at the adapter; choose `runPromiseExit` when the host must distinguish typed failures, defects, and interruption. A rejected `runPromise` does not provide a typed Promise error channel.

## Bridge an existing scope

If an Effect scope already owns the services, capture `Effect.context<R>()` and use the matching `Effect.run*With(services)` runner instead of creating a second resource owner. Capturing a context does not extend resource lifetime, so stop host work before that scope closes. Do not copy v3 `Runtime<R>` or `Effect.runtime` bridges.

For exact acquisition and runner contracts, read `packages/effect/src/Effect.ts` and `packages/effect/src/ManagedRuntime.ts` in the Effect checkout. Consult `migration/runtime.md` when replacing an older bridge.
