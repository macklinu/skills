# Async interop and cancellation

Adapt foreign APIs at their boundary, then keep service implementations Effect-native with `Effect.gen` or `Effect.fn`. An `async` handler is appropriate when a non-Effect host awaits a managed-runtime call, not as the implementation of an Effect service.

## Keep work lazy and failures typed

Use `Effect.sync` for non-throwing synchronous work and `Effect.try` for synchronous exceptions. Use `Effect.tryPromise` for Promise APIs that can reject or throw; reserve `Effect.promise` for work that cannot reject. Map foreign failures to a specific tagged boundary error.

Start the operation inside the constructor thunk. An already-started Promise bypasses Effect's control over retries, repetition, timing, and cancellation. Do not put a Promise in the success channel through `Effect.succeed`, `Effect.sync`, or `Effect.map` when you mean to await its result.

Return the error from a `try` or `tryPromise` catch mapper. Throwing from the mapper creates a defect rather than a typed failure.

## Give cancellation a real mechanism

Pass the supplied `AbortSignal` to the foreign API when it supports one. Interruption stops waiting, but the operation itself stops only if it observes that signal or has an effective cleanup action. For a longer scoped integration, acquire `Effect.abortSignal` in its owning scope instead of managing an `AbortController` yourself.

Use `Effect.callback` for a one-shot callback API. Resume at most once and return a cleanup Effect to cancel or unregister the source on interruption. That cleanup does not run on ordinary success; use scope-owned acquisition/release when successful completion also needs cleanup.

Use a scoped `Queue`, `PubSub`, or `Stream` for multi-shot sources. Repeated callback resumes do not create an event stream.

### Signal parameter hazard

Declare `signal` as an ordinary thunk parameter, or as the second callback-registration parameter after `resume`. Signal allocation depends on declared function arity, so rest parameters, defaulted signal parameters, and rest-forwarding wrappers can receive `undefined` instead of a signal.

For exact constructor and cancellation behavior, read `tryPromise`, `callback`, and `abortSignal` in `packages/effect/src/Effect.ts` in the Effect checkout. See [resource ownership](RESOURCES_RUNTIME.md) when the adapter also owns a lifecycle.
