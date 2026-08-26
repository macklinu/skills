# Persistence Adapters

Read this only when the project imports `effect/unstable/persistence`. Confirm the unstable modules and adapter Layers against the pinned Effect version.

## Choose By Semantics

- Use `KeyValueStore` for direct string/binary key-value state; use its Schema store view when values have a durable encoded contract.
- Use `Persistence` with `Persistable` requests when successful or failed results should be schema-encoded and reused across fibers, processes, or workers.
- Use `PersistedCache` when an in-memory cache should fall through to durable storage before running a lookup.
- Use `PersistedQueue` only for durable work handoff whose identifiers, retry attempts, and completion semantics are part of the product contract.

## Adapter And Lifecycle Rules

- Select memory, filesystem, browser storage, SQL, or Redis adapters explicitly in the composition root. Memory Layers are useful defaults for tests, not silent production durability.
- Build adapter Layers and scoped stores once in their owning application scope, not per request or lookup.
- Make store ids, keys, schemas, encoding changes, TTLs, and migration/cleanup policy stable and reviewable. A schema change to persisted data is a compatibility change.
- Preserve persistence and schema failures until a repository/application boundary can map them truthfully. Do not silently treat corruption or adapter outage as a cache miss.
- Keep durable queue retry policy bounded and idempotent; distinguish retryable processing failure from poison work that needs explicit handling.
