# Atom and reactivity

Use this reference only when the project uses `effect/reactivity` or an `@effect/atom-*` binding. Keep atoms at the reactive UI/application boundary; domain rules, persistence, and integrations remain Effect services.

Hoist stable atom definitions instead of recreating them during rendering. Use `Atom.family` for parameterized identity rather than maintaining an ad hoc atom map. Let an `AtomRegistry` or framework provider own subscriptions, atom lifetimes, and shared runtime context within its boundary; do not create a registry or runtime per render or event.

Use writable atoms for local state and derived atoms for pure projections. Use `Atom.fn` for Effect actions without application Layer dependencies, or `Atom.runtime(AppLayer)` when evaluation needs those services. Model asynchronous loading, success, and failure with `AsyncResult` instead of independent boolean and error fields.

## Branching on asynchronous results

```tsx
import { AsyncResult } from "effect/reactivity"

// Bad: chain state predicates before reading .value.
function BadProfile({ result }: { result: AsyncResult.AsyncResult<string, Error> }) {
  if (AsyncResult.isInitial(result)) {
    return <p aria-busy={result.waiting}>{result.waiting ? "Loading..." : "Not loaded."}</p>
  }
  if (AsyncResult.isFailure(result)) {
    return <p role="alert" aria-busy={result.waiting}>Unable to load profile.</p>
  }
  return <p aria-busy={result.waiting}>{result.value}</p>
}

// Good: prefer match for rendering; keep focused predicates for yes/no checks.
function GoodProfile({ result }: { result: AsyncResult.AsyncResult<string, Error> }) {
  return AsyncResult.match(result, {
    onInitial: ({ waiting }) => <p aria-busy={waiting}>{waiting ? "Loading..." : "Not loaded."}</p>,
    onFailure: ({ waiting }) => <p role="alert" aria-busy={waiting}>Unable to load profile.</p>,
    onSuccess: ({ value, waiting }) => <p aria-busy={waiting}>{value}</p>,
  })
}
```

## Cancellation and serialized state

Tie refreshes and optimistic updates to the atom lifecycle so stale work does not race newer state. `Atom.fn` interrupts its previous evaluation on a new write by default.

Choose `{ concurrent: true }` only when earlier invocations must continue; disposal still interrupts those fibers. Cancellation cannot undo an external mutation that has already committed.

Decode URL, storage, hydration, and server values with Schema-backed serialization rather than trusting browser state. `Atom.serializable` needs a stable key and a codec without encoding or decoding service requirements because serialization is synchronous.

Hydrating an Effect or Stream atom reruns it by default. Choose `skipInitialRun: true` when the hydrated value should remain until refresh or a dependency change; do not mistake hydration for a promise that no work will run.

## Source hints

Read `packages/effect/src/reactivity/AsyncResult.ts` for matching, waiting, and failure semantics, and `packages/effect/src/reactivity/Atom.ts` for action cancellation, runtime construction, and hydration behavior in the matching Effect checkout.
