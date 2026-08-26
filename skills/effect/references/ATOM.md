# Atom And Reactivity

Read this only when the project uses `effect/unstable/reactivity` or an `@effect/atom-*` framework binding. Verify these unstable APIs against the pinned Effect version.

- Keep atoms at the reactive UI/application boundary. Domain rules, persistence, and external integrations should remain Effect services that atoms call.
- Hoist stable atom definitions rather than recreating them during rendering. Use `Atom.family` for parameterized identity instead of ad hoc atom maps.
- Use `Atom.make` for simple writable state and derived atoms for pure projections. Use `Atom.fn` for Effect actions without additional Layer context; use `Atom.runtime(AppLayer).atom` / `.fn` when evaluation requires services from a Layer.
- Model loading, success, and failure explicitly with the package's `AsyncResult` rather than parallel boolean/error state.
- Let one `AtomRegistry` / framework provider own atom lifetimes, mounted subscriptions, and shared runtime context. Do not create a registry or runtime per render or event.
- Use Schema-backed serialization helpers for URL, storage, hydration, or server values; do not trust decoded browser state.
- Keep refresh, optimistic updates, and cancellation tied to atom lifecycle so stale work is interrupted rather than racing newer state.
