# Clock And DateTime

Use this when reading the current time, parsing or formatting dates, handling time zones, or doing temporal arithmetic.

- Use `Clock.currentTimeMillis` or `Clock.currentTimeNanos` for Unix wall-clock values, `Clock.monotonicTimeNanos` for elapsed-time measurement, and `DateTime.now` when the domain needs a typed instant.
- Do not use `Date.now()` or `new Date()` for current time in effectful domain/application code. Clock-backed access keeps time testable with `TestClock` and matches Effect-aware lint rules.
- Parse untrusted inputs with `DateTime.make` or `DateTime.makeZoned`; handle the returned `Option` rather than using unsafe constructors.
- Use `DateTime.setZoneNamed` for an untrusted IANA zone and `setZoneNamedUnsafe` only after the zone is known valid. Use `DateTime.nowInCurrentZone` when code intentionally depends on the provided `CurrentTimeZone` service.
- Distinguish attaching a zone to an instant from interpreting local wall-clock input. `DateTime.makeZoned(input, { timeZone, adjustForTimeZone: true })` interprets input in that zone.
- Choose `disambiguation` explicitly when daylight-saving gaps or repeated times matter; `"reject"` returns `None` instead of selecting an instant. Unsafe constructors can throw for rejected times even when the zone is valid.
- Use immutable `DateTime.add` / `subtract` for calendar arithmetic and `DateTime.distance` for differences rather than manual millisecond math when calendar or zone semantics matter.
- Reach for `DateTime.formatIso`, `formatIsoZoned`, and `formatIntl` according to the boundary. Preserve a zone only when it is part of the contract.
- Prefer Schema DateTime codecs at JSON, persistence, and transport boundaries so encoded strings and decoded `DateTime` values remain explicit.

In tests, use `it.effect` plus `TestClock.setTime` / `TestClock.adjust`; use `it.live` only when the real system clock is the behavior under test.

See [zoned construction and disambiguation](https://github.com/Effect-TS/effect/blob/506eef143bcc1750ce58920aac1e45da7265d103/packages/effect/src/DateTime.ts#L734-L778).
