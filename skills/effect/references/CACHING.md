# Caching, Memoization, And Request Dedupe

Use this when memoizing expensive lookups, caching per-key results with TTL, deduplicating concurrent identical calls, or considering request batching.

Prefer `effect/Cache` over a `Map` + timestamp + prune-loop cache when its keyed memoization, TTL, capacity, lifecycle, and eviction semantics fit.

## Core Rules

- `Cache.make({ capacity, lookup, timeToLive })` caches per-key lookups with one fixed TTL for all entries. `timeToLive` is optional and defaults to no expiration; set it explicitly when staleness matters.
- `Cache.makeWith(lookup, { capacity, timeToLive(exit, key) })` computes TTL per entry from the lookup's `Exit`, which lets you cache successes without retaining failures.
- Concurrent `Cache.get` calls for the same missing key share one pending lookup while its entry remains in the cache; eviction or invalidation can allow another lookup. Do not add your own in-flight tracking when these semantics fit.
- One interrupted waiter does not cancel a lookup that still has other waiters; the last waiter's departure interrupts and removes a pending lookup. Interrupted lookups are not cached. `Effect.cached` and `Effect.cachedWithTTL` follow the same ownership rule.
- `capacity` is required and bounds the cache; stop writing manual prune/evict loops.
- Return a zero TTL (`0` or `"0 millis"`) from `timeToLive` to avoid caching transient failures or degraded fallbacks. TTL does not change the lookup's success or failure for the caller. A short negative-cache TTL can be appropriate for stable failures such as not-found results.
- TTL starts when the lookup completes. Fixed TTLs retain failures as well as successes unless the cause contains interruption.
- `Cache.invalidate(cache, key)` / `Cache.refresh(cache, key)` handle explicit staleness; `Cache.has` checks without triggering a lookup.
- Cache construction is effectful. Build the cache once in the owning layer/scope and share the handle; a cache built per call caches nothing. Lookup services are required at construction by default; `requireServicesAt: "lookup"` leaves them required by lookup operations.
- For a single value (no key), use `Effect.cached(effect)` or `Effect.cachedWithTTL(effect, ttl)`. The latter also accepts `(exit) => Duration.Input`, so `Effect.cachedWithTTL(effect, (exit) => Exit.isSuccess(exit) ? "1 minute" : 0)` skips failed results. Allocate the returned memoized effect once and reuse it.
- For cached resources, construct `ScopedCache` in its owning scope. Entry scopes close on invalidation, eviction, or cache shutdown; expiration cleanup is lazy on access or scans. `ScopedCache.get` does not keep resources alive during use, so use it only when callers can tolerate that closure.

## Exit-Aware TTL (cache successes, skip degraded results)

```ts
import { Cache, Duration, Effect, Exit } from "effect"

const makeResolver = Effect.gen(function* () {
  const cache = yield* Cache.makeWith(
    (channelRef: string) => resolveUncached(channelRef), // never-failing, returns { where, cacheable }
    {
      capacity: 300,
      timeToLive: (exit) =>
        Exit.isSuccess(exit) && exit.value.cacheable ? "10 minutes" : Duration.zero,
    },
  )
  return (channelRef: string) =>
    Cache.get(cache, channelRef).pipe(Effect.map((resolved) => resolved.where))
})
```

This replaces a hand-rolled `Map<string, { value, expiresAtMs }>` plus prune logic. Repeated rows pointing at the same key share a pending provider call while its entry remains in the cache.

## Expensive Client Acquisition Belongs In The Layer, Not The Lookup

A cache reduces lookup calls, not the acquisition cost of a miss. If a lookup constructs a fresh client layer, or independently provides a layer not already built by an enclosing scope, each miss acquires and releases that client. In v4, nested `Effect.provide` calls can reuse the same layer object already built by an enclosing provide/runtime; separate sibling calls do not share new acquisitions.

Prefer a service dependency or build the client once in the owning layer's scope:

```ts
// Bad: this factory creates a fresh client layer for each cache miss
const lookup = (id: string) =>
  getRecord(id).pipe(Effect.provide(apiClientLayer(options)))

// Good: client built once for the layer's lifetime; misses are one API call
// Layer.build requires Scope.Scope; acquire this inside the owning layer's scope.
const context = yield* Layer.build(apiClientLayer(options))
const lookup = (id: string) => Context.get(context, ApiClient).getRecord(id)
```

See [v4 layer memoization](https://github.com/Effect-TS/effect/blob/506eef143bcc1750ce58920aac1e45da7265d103/migration/layer-memoization.md#L8-L13). Reuse requires the same layer object, not another call to an equivalent factory.

## Request Batching (`Effect.request` + `RequestResolver`)

Batching exists for backends with a real batch endpoint: the resolver receives an array of pending requests and can collapse them into one wire call.

- Use it when the API can answer N keys in one call (SQL `IN (...)`, DataLoader-style endpoints, batch GET).
- Do not reach for it when the backend only has per-item endpoints (most REST provider APIs): a batched resolver still loops one call per entry, so it buys nothing over `Effect.forEach(items, f, { concurrency })` plus `Cache` for dedupe/memoization.
- `RequestResolver.batchN(resolver, n)` bounds batch size; `RequestResolver.makeGrouped` groups requests that must resolve through different targets.

Selection guide:

- Same key requested repeatedly over time → `Cache`.
- Same key requested concurrently in one burst → `Cache` (shared pending lookup).
- Many distinct keys, backend has a batch endpoint → `Effect.request` + `RequestResolver`.
- Many distinct keys, per-item endpoint only → `Effect.forEach(..., { concurrency: n })`, optionally through a `Cache`.

## Do Nots

- Do not hand-roll Map/TTL/prune caches, in-flight dedupe maps, or LRU logic when `Cache` fits.
- Choose failure TTLs by semantics. Skip transient failures and degraded fallbacks by default; bounded negative caching can protect an upstream from repeated stable failures.
- Do not build a cache inside the request handler or per call. Hoist it to the owning layer.
- Do not adopt `RequestResolver` batching for per-item REST endpoints just because "batching" sounds faster.
- Do not put scoped client acquisition inside the cache lookup; acquire once in the layer.

Sources:

- [Cache constructors and service requirements](https://github.com/Effect-TS/effect/blob/506eef143bcc1750ce58920aac1e45da7265d103/packages/effect/src/Cache.ts#L198-L318).
- [Pending lookup ownership and TTL](https://github.com/Effect-TS/effect/blob/506eef143bcc1750ce58920aac1e45da7265d103/packages/effect/src/Cache.ts#L430-L505).
- [Exit-aware single-value TTL](https://github.com/Effect-TS/effect/blob/506eef143bcc1750ce58920aac1e45da7265d103/packages/effect/src/Effect.ts#L7505-L7517).
- [Scoped entry lifetime](https://github.com/Effect-TS/effect/blob/506eef143bcc1750ce58920aac1e45da7265d103/packages/effect/src/ScopedCache.ts#L120-L158).
