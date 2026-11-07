# Persistence adapters

Use this reference only when the project imports `effect/persistence`. Choose storage by the durability contract, not by which Layer is easiest to provide.

- Use `KeyValueStore` for direct key-value state, with a Schema store when encoded values form a durable contract.
- Use `Persistence` with `Persistable` requests to store and reuse schema-encoded success or failure results.
- Use `PersistedCache` when a memory cache should consult durable storage before running its lookup.
- Use `PersistedQueue` for durable work handoff with explicit identity, retry, and completion semantics.

Select the backing adapter at the composition root and acquire it once in its owning application scope. Memory Layers suit tests; they are not production durability. Treat store IDs, keys, schemas, TTLs, and cleanup policy as compatibility decisions.

## Failure and delivery semantics

Do not turn every persistence failure into a cache miss. `PersistedCache` treats invalid stored exits as misses but propagates backing-store and write failures.

Direct `PersistenceStore.get` exposes invalid exits as `SchemaError`; `getMany` treats them as missing and schedules removal. Account for that difference when stored results matter beyond caching.

Queue delivery is at-least-once. Make handlers idempotent because a crash after an external mutation but before acknowledgement can redeliver the item.

`take` processes one item; run a continuing worker explicitly with bounded attempts. Claims lost to crashes also consume attempts, and undecodable items become failed records rather than caller-visible decode errors.

Custom offer IDs deduplicate even after success until cleanup removes the record. Run `PersistedQueue.layerCleanup` with a deliberate retention policy; failed records remain indefinitely unless `failedTimeToLive` is set. Cleanup therefore affects both diagnosis and deduplication.

## Persistence upgrade warning

**The 4.1 key-layout change can make existing durable data unreachable.** `Persistence.layerKvs` and `layerBackingKvs` change keys from `<storeId><key>` to `<encodedStoreId>:<key>`. All entries written in the old layout become unreadable, including persisted chat histories, not only disposable cache results.

Redis backing keys change when the store ID contains `%` or `:`. Old entries are neither migrated nor removed automatically. Plan an explicit migration, or consciously accept the loss of stored results, before upgrading affected stores.

## Source hints

Read the matching checkout's `packages/effect/src/persistence/` modules for the selected abstraction and adapter. Read `packages/effect/CHANGELOG.md` for key-layout and other storage compatibility changes before an upgrade.
