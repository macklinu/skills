# Persistence Adapters

Read this only when the project imports `effect/persistence`. Confirm the unstable modules and adapter Layers against the pinned Effect version.

## Choose By Semantics

- Use `KeyValueStore` for direct string/binary key-value state; use `KeyValueStore.toSchemaStore(store, schema)` when values have a durable encoded contract. Raw store reads return `undefined` for missing keys; Schema store reads return `Option.none`.
- Use `Persistence` with `Persistable` requests when successful or failed results should be schema-encoded and reused across fibers, processes, or workers.
- Use `PersistedCache` when an in-memory cache should fall through to durable storage before running a lookup.
- Use `PersistedQueue` only for durable work handoff whose identifiers, retry attempts, and completion semantics are part of the product contract.

## Adapter And Lifecycle Rules

- Select memory, filesystem, browser storage, SQL, or Redis adapters explicitly in the composition root. Memory Layers are useful defaults for tests, not silent production durability.
- Build adapter Layers and scoped stores once in their owning application scope, not per request or lookup.
- Make store ids, keys, schemas, encoding changes, TTLs, and migration/cleanup policy stable and reviewable. A schema change to persisted data is a compatibility change.
- Preserve persistence and schema failures that reach the caller until a repository/application boundary can map them truthfully; do not add catch-all cache-miss recovery.
- `PersistenceStore.get` exposes invalid stored exits as `SchemaError`; `getMany` instead returns `undefined` for invalid exits and schedules their removal. `PersistedCache` treats a stored-exit `SchemaError` as a miss, but propagates backing-store and write failures.
- `PersistedQueue.take` marks undecodable items as failed and takes the next item; these decode failures do not reach the caller.
- Queue delivery is at-least-once, not exactly-once. `take(handler)` processes and acknowledges one item; handler failure reaches the caller while the store schedules redelivery. Run a continuing worker explicitly, with bounded attempts and idempotent handlers.
- Queue `maxAttempts` defaults to 10, including the first claim and claims lost to process crashes. Custom `offer` ids deduplicate until cleanup removes the record, including after successful processing. Run `PersistedQueue.layerCleanup` with an explicit retention policy; failed items remain indefinitely unless `failedTimeToLive` is set.

## Upgrading To 4.1

- Custom stores built with `KeyValueStore.make` or `makeStringOnly` must provide `keys`. Prefixed stores now scope `keys`, `size`, `isEmpty`, and `clear` to their prefix.
- `Persistence.layerKvs` / `layerBackingKvs` change backing keys from `<storeId><key>` to `<encodedStoreId>:<key>`, making all old entries unreachable. Redis backing keys change only when the store id contains `%` or `:`.
- Old entries are neither migrated nor removed automatically. Plan an explicit migration or accept the loss of stored results before upgrading durable stores.

See the [key enumeration requirement](https://github.com/Effect-TS/effect/blob/506eef143bcc1750ce58920aac1e45da7265d103/packages/effect/CHANGELOG.md#L269-L273) and [persistence key-layout change](https://github.com/Effect-TS/effect/blob/506eef143bcc1750ce58920aac1e45da7265d103/packages/effect/CHANGELOG.md#L289-L300).

## Sources

- [Persistence read, invalid-exit, and write behavior](https://github.com/Effect-TS/effect/blob/506eef143bcc1750ce58920aac1e45da7265d103/packages/effect/src/persistence/Persistence.ts#L152-L237).
- [Persisted cache lookup and failure handling](https://github.com/Effect-TS/effect/blob/506eef143bcc1750ce58920aac1e45da7265d103/packages/effect/src/persistence/PersistedCache.ts#L88-L114).
- [Queue delivery, attempts, deduplication, and decoding](https://github.com/Effect-TS/effect/blob/506eef143bcc1750ce58920aac1e45da7265d103/packages/effect/src/persistence/PersistedQueue.ts#L60-L172) and [cleanup retention](https://github.com/Effect-TS/effect/blob/506eef143bcc1750ce58920aac1e45da7265d103/packages/effect/src/persistence/PersistedQueue.ts#L324-L345).
- [Raw key-value reads](https://github.com/Effect-TS/effect/blob/506eef143bcc1750ce58920aac1e45da7265d103/packages/effect/src/persistence/KeyValueStore.ts#L40-L50) and [Schema store reads](https://github.com/Effect-TS/effect/blob/506eef143bcc1750ce58920aac1e45da7265d103/packages/effect/src/persistence/KeyValueStore.ts#L863-L878).
