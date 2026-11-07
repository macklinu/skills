# Observability

Use this when adding logging, spans, structured context, metrics, tracing, or telemetry integrations.

## Defaults

- Give externally meaningful workflows and adapter boundaries stable operation names with `Effect.fn` or `Effect.withSpan`. Do not span every trivial helper.
- Attach operation, provider, and route-template context with `Effect.annotateLogs` and `Effect.annotateSpans`. Request/correlation ids and entity ids can help logs and spans, but they are high-cardinality values and do not belong in metric labels.
- Never annotate secrets, credentials, authorization headers, raw request/response bodies, or sensitive user data. Redact or summarize boundary evidence before logging it.
- Configure `Logger.layer([...])` and `Layer.succeed(References.MinimumLogLevel, "Info")` at the composition root. `Logger.layer` replaces the current logger set by default, including `Logger.tracerLogger`; retain that logger when logs must remain span events, or use `{ mergeWithExisting: true }` to add sinks.
- Keep metric names and labels intentional; do not put unbounded ids or payload values in metric labels.

Telemetry exporters are opt-in deployment integrations. Add OTLP, Prometheus, or vendor exporters only when the application has chosen that backend and validate unstable exporter APIs against its pinned Effect version.

See [logger replacement and merge behavior](https://github.com/Effect-TS/effect/blob/506eef143bcc1750ce58920aac1e45da7265d103/packages/effect/src/Logger.ts#L1025-L1078).
