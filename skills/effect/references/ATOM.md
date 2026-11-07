# Atom And Reactivity

Read this only when the project uses `effect/reactivity` or an `@effect/atom-*` framework binding. Verify these unstable APIs against the pinned Effect version.

- Keep atoms at the reactive UI/application boundary. Domain rules, persistence, and external integrations should remain Effect services that atoms call.
- Hoist stable atom definitions rather than recreating them during rendering. Use `Atom.family` for parameterized identity instead of ad hoc atom maps.
- Use `Atom.make` for simple writable state and derived atoms for pure projections. Use `Atom.fn` for Effect actions without additional Layer context; use `Atom.runtime(AppLayer).atom` / `.fn` when evaluation requires services from a Layer.
- Model loading, success, and failure explicitly with the package's `AsyncResult` rather than parallel boolean/error state.
- Let one `AtomRegistry` / framework provider own atom lifetimes, mounted subscriptions, and shared runtime context. Do not create a registry or runtime per render or event.
- Use Schema-backed serialization helpers for URL, storage, hydration, or server values; do not trust decoded browser state.
- Keep refresh, optimistic updates, and cancellation tied to atom lifecycle so stale work is interrupted rather than racing newer state.
- `Atom.fn` interrupts its previous evaluation on a new write by default. Use `{ concurrent: true }` only when previous invocations must keep running; atom disposal still interrupts those fibers. Cancellation cannot undo an external mutation that has already committed.
- `Atom.serializable({ key, schema })` requires a stable key and a codec with no encoding or decoding services because serialization is synchronous. Hydrating an Effect/Stream atom reruns it by default; use `skipInitialRun: true` when the hydrated value should remain until invalidation.

## Sources

- [Action concurrency and disposal](https://github.com/Effect-TS/effect/blob/506eef143bcc1750ce58920aac1e45da7265d103/packages/effect/src/reactivity/Atom.ts#L1214-L1318).
- [Serialization and hydration contract](https://github.com/Effect-TS/effect/blob/506eef143bcc1750ce58920aac1e45da7265d103/packages/effect/src/reactivity/Atom.ts#L2649-L2694).
