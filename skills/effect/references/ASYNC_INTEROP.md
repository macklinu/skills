# Async Interop And Cancellation

Use this when adapting synchronous exceptions, Promise APIs, callbacks, event listeners, or cancellation signals.

## Constructor Choice

- Use `Effect.sync` for lazy synchronous work that does not throw and `Effect.try` when synchronous exceptions must become typed failures.
- Use `Effect.promise` only for Promise work that cannot reject. Use `Effect.tryPromise` for rejecting or throwing Promise APIs and map the caught value to a specific tagged boundary error.
- Start Promise work inside the constructor thunk. Passing an already-started Promise breaks Effect laziness, retries, repetition, timing, and cancellation.
- Pass the `AbortSignal` supplied to `Effect.tryPromise` into the underlying API when supported. For a longer scoped integration that needs a signal, acquire `Effect.abortSignal` in the owning scope instead of constructing `AbortController` inside Effect code.
- Use `Effect.callback` for one-shot callback APIs. Resume at most once, and return a cleanup Effect that unregisters the listener or cancels the source when interrupted.
- Adapt multi-shot event sources with a scoped `Queue`, `PubSub`, or `Stream`; repeated `resume` calls do not turn `Effect.callback` into an event stream.

```ts
const read = Effect.tryPromise({
  try: (signal) => client.read({ signal }),
  catch: (cause) => new ClientError({ operation: "Client.read", cause }),
})
```

## Effect-Native Boundary

- Keep service implementations in `Effect.gen` / `Effect.fn`; do not implement them as `async` functions and wrap the resulting Promise afterward.
- Do not let a Promise enter an Effect success channel through `Effect.succeed`, `Effect.sync`, `Effect.map`, or an unflattened callback.
- `async` / `await` is appropriate at a non-Effect framework edge that awaits a single `ManagedRuntime` call.

These practices align with the current `@effect/tsgo` recommended Oxlint diagnostics, notably `async-function`, `new-promise`, `lazy-promise-in-effect-sync`, `promise-in-effect-success`, `abort-controller-in-effect`, and typed-error checks for `Effect.try` / `Effect.tryPromise` catch callbacks.
