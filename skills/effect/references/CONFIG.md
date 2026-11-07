# Config

Read runtime configuration through `Config` recipes in layers, not `process.env` inside application logic. Keep environment, `.env`, and directory sources at startup boundaries so workflows consume validated settings rather than repeatedly reading deployment state.

Use `Config.Redacted` for credentials and `Config.schema` for refined domain values. Use `Config.option` when absence is meaningful; do not invent a default that hides a required credential or application authority.

## Default absence, not invalid input

Use `Config.withDefault` only when absence has a safe domain meaning. Invalid values in a relevant provider representation and source failures still fail. `Config.orElse` can replace any `ConfigError`, including invalid values and source failures, so use it only when that broader recovery is intentional; defects and interruption still propagate.

Apply defaults to individual fields when partial configuration must be preserved. A default around `Config.all` replaces the entire group if any child is absent, unless another child fails. For example, a default port should not replace an explicitly supplied host.

### Provider-shape hazard

Missing or incompatible provider shapes can count as semantic absence. Do not assume every malformed container reaches validation as an invalid value. When this distinction matters to a required setting or safe default, read `Config.schema` and test the actual provider representation.

## Select providers at the boundary

Use `ConfigProvider.layer` to replace the active provider. Use `ConfigProvider.layerAdd` for fallbacks, or `{ asPrimary: true }` when the added provider must take precedence. Fallbacks fill missing paths; they do not recover invalid values or source failures.

Use `ConfigProvider.fromUnknown` for deterministic config tests. If the application already wraps settings in a service and the test is not exercising decoding, provide that service directly with `Layer.succeed` instead. Keep environment naming and nesting transformations in provider composition.

## Offer config-backed layers when useful

When a service naturally accepts runtime settings, keep a concrete `layer(options)` available for callers and tests. Add `layerConfig(options: Config.Wrap<Options>)` using `Config.unwrap` when config composition is useful, not as a mandatory wrapper around every layer.

For exact absence and group-default semantics, read `withDefault`, `all`, and `schema` in `packages/effect/src/Config.ts` in the Effect checkout. For provider precedence and representation rules, read `packages/effect/src/ConfigProvider.ts`.
