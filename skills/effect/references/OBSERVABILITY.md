# Observability

Give externally meaningful workflows and adapter boundaries stable operation names with `Effect.fn` or `Effect.withSpan`. Do not span every helper; instrument boundaries that explain work or failures.

Log errors at high-level handling or supervision boundaries rather than logging and rethrowing at every layer. Use spans and structured annotations to carry operation context through lower layers.

## Choose safe context

Use `Effect.annotateLogs` and `Effect.annotateSpans` for operation, provider, and route-template context. Request, correlation, and entity IDs can help logs and traces, but they are high-cardinality values and do not belong in metric labels. Keep metric names and labels bounded and intentional.

Never record personally identifiable information, secrets, credentials, authorization headers, raw request or response bodies, or sensitive user data. Redact or summarize boundary evidence before logging or annotating it.

## Configure sinks at the root

Choose `Logger.layer` and `References.MinimumLogLevel` at the composition root, not inside services. `Logger.layer` replaces the current logger set by default, including `Logger.tracerLogger`. Retain that logger when logs must remain span events, or use `{ mergeWithExisting: true }` when adding a sink rather than replacing sinks.

Use Effect's spans and structured annotations with the application's OpenTelemetry integration. Telemetry exporters are opt-in deployment choices. Add an exporter only for the backend the application uses, and check unstable exporter APIs against the project's pinned Effect version.

For logger composition behavior, read `layer` and `tracerLogger` in `packages/effect/src/Logger.ts` in the Effect checkout. Consult the chosen exporter's source for its configuration rather than copying a generic telemetry setup.
