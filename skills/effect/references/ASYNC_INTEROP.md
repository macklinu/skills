# Async Interop And Cancellation

Use this when adapting synchronous exceptions, Promise APIs, callbacks, event listeners, or cancellation signals.

## Constructor Choice

- Use `Effect.sync` for lazy synchronous work that does not throw and `Effect.try` when synchronous exceptions must become typed failures.
- Use `Effect.promise` only for Promise work that cannot reject. Use `Effect.tryPromise` for rejecting or throwing Promise APIs and map the caught value to a specific tagged boundary error.
- Start Promise work inside the constructor thunk. Passing an already-started Promise breaks Effect laziness, retries, repetition, timing, and cancellation.
- Pass the `AbortSignal` supplied to `Effect.tryPromise` into the underlying API when supported. For a longer scoped integration that needs a signal, acquire `Effect.abortSignal` in the owning scope instead of constructing `AbortController` inside Effect code.
- Declare cancellation parameters normally, as `(signal) => ...` for Promise thunks or `(resume, signal) => ...` for callbacks. Signal allocation depends on the function's declared arity; rest parameters, defaulted signal parameters, and rest-forwarding wrappers can receive `undefined` instead.
- Interruption stops waiting and aborts the supplied signal. The underlying operation only stops if it observes that signal or the callback cleanup cancels it.
- Use `Effect.callback` for one-shot callback APIs. Resume at most once, and return a cleanup Effect that unregisters the listener or cancels the source when interrupted.
- Callback cleanup runs on interruption, not ordinary success. If successful completion also needs resource cleanup, use scope-owned acquisition/release instead.
- Return the tagged error from `try` / `tryPromise` catch mappers. Throwing inside a mapper creates a defect, not a typed failure.
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

Sources:

- [Promise cancellation contract](https://github.com/Effect-TS/effect/blob/506eef143bcc1750ce58920aac1e45da7265d103/packages/effect/src/Effect.ts#L929-L966).
- [Callback registration contract](https://github.com/Effect-TS/effect/blob/506eef143bcc1750ce58920aac1e45da7265d103/packages/effect/src/Effect.ts#L1241-L1294).
- [Scope-managed AbortSignal](https://github.com/Effect-TS/effect/blob/506eef143bcc1750ce58920aac1e45da7265d103/packages/effect/src/Effect.ts#L7779-L7804).
