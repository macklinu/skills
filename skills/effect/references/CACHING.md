# Caching and batching

Choose the cache by its value and owner, not by the number of calls you hope to remove.

- Use `Cache` for bounded, keyed lookups with shared pending work and an explicit staleness policy.
- Use `Effect.cached` or `Effect.cachedWithTTL` for one memoized effect result without a key.
- Use `ScopedCache` when entries acquire resources and entry removal should release them.
- Use `Effect.request` with `RequestResolver` when the backend can answer multiple distinct keys in one call.

Build the cache or memoized effect once in the owning layer and share it. Allocating it per request prevents reuse. Prefer these mechanisms over a hand-maintained map, prune loop, or in-flight deduplication table when their semantics fit.

## Choose what can remain cached

Set capacity and choose TTL from the application's staleness tolerance. `Cache.make` has no expiration unless configured, and a fixed TTL retains failures as well as successes. TTL starts when the lookup completes, not when it begins.

Use exit-aware TTL with `Cache.makeWith` or `Effect.cachedWithTTL` when failures and successes need different retention. Give transient failures and degraded fallbacks zero TTL by default; this changes retention, not the result returned to the caller. A short negative-cache TTL can protect an upstream from repeated stable not-found results.

Use invalidation or refresh for known state changes instead of waiting for TTL. Shared pending lookups deduplicate a key only while its entry remains cached; eviction or invalidation can allow another lookup.

## Cancellation and resource lifetime

One interrupted waiter does not cancel a lookup with other waiters. When the last waiter leaves, the pending lookup is interrupted and removed rather than retained. Single-value memoization follows the same ownership rule.

Acquire expensive clients once in the owning layer, not inside each cache miss. Decide whether lookup dependencies are captured when the cache is built or supplied per call.

`ScopedCache` closes entry scopes on eviction, invalidation, or cache shutdown; expiration cleanup is lazy on access or scans. **`ScopedCache.get` does not keep a resource alive while a caller uses it.** Use it only when callers can tolerate that closure, because TTL is not a lease.

## Batch only real batch operations

A resolver that loops over per-item endpoints still makes one wire call per key. Prefer bounded `Effect.forEach`, optionally through a cache, for those endpoints. For a real batch endpoint, bound batch size and separate requests that target different backends.

For exact retention and resource semantics, consult `packages/effect/src/{Cache,ScopedCache,RequestResolver}.ts` and the memoization section of `Effect.ts` in the matching source.
