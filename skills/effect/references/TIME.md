# Clock and DateTime

Keep current-time reads behind Effect's clock so tests control time. Avoid `Date.now()` and current-time `new Date()` in effectful domain or application code.

Use `Clock.currentTimeMillis` or `Clock.currentTimeNanos` for Unix timestamps, `Clock.monotonicTimeNanos` for elapsed durations, and `DateTime.now` for a typed instant.

## Make temporal meaning explicit

Parse untrusted values with `DateTime.make` or `DateTime.makeZoned` and handle `Option`, rather than throwing with unsafe constructors. Validate untrusted IANA zones with `DateTime.setZoneNamed`. Use `DateTime.nowInCurrentZone` only when the domain intentionally depends on the provided `CurrentTimeZone` service.

Distinguish an instant displayed in a zone from local wall-clock input interpreted in that zone. `DateTime.makeZoned` with `{ timeZone, adjustForTimeZone: true }` does the latter. Choose `disambiguation` explicitly when daylight-saving gaps or repeated times affect the result; `"reject"` returns `None` instead of selecting an instant.

A valid zone does not make an unsafe constructor safe: rejected local times can still throw. Reserve unsafe construction for inputs whose full temporal validity is already established.

Use immutable `DateTime` calendar arithmetic instead of manual millisecond math when zones or calendar units matter. At JSON, storage, and transport boundaries, prefer Schema DateTime codecs to keep encoded strings distinct from decoded values. Choose formatting for the contract and preserve a zone only when that zone is meaningful data.

## Test the clock policy

Use `it.effect` with `TestClock.setTime` or `TestClock.adjust`. Use `it.live` only when the real system clock is the behavior under test; see [testing](TESTING.md) for deterministic synchronization.

For exact parsing, formatting, and zoned arithmetic options, read `packages/effect/src/DateTime.ts` in the Effect checkout, especially `makeZoned` and its disambiguation contract.
