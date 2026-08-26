# Observability

Use this when adding logging, spans, structured context, metrics, tracing, or telemetry integrations.

## Defaults

- Give externally meaningful workflows and adapter boundaries stable operation names with `Effect.fn` or `Effect.withSpan`. Do not span every trivial helper.
- Attach stable, low-cardinality context with `Effect.annotateLogs` and `Effect.annotateSpans`: operation, request/correlation id, provider, route template, or entity id when appropriate.
- Never annotate secrets, credentials, authorization headers, raw request/response bodies, or sensitive user data. Redact or summarize boundary evidence before logging it.
- Configure `Logger.layer(...)` and `References.MinimumLogLevel` at the composition root so application code emits structured events without choosing sinks.
- Keep metric names and labels intentional; do not put unbounded ids or payload values in metric labels.

Telemetry exporters are opt-in deployment integrations. Add OTLP, Prometheus, or vendor exporters only when the application has chosen that backend and validate unstable exporter APIs against its pinned Effect version.
