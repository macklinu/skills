# HTTP clients

Prefer Effect `HttpClient` in application and provider adapters when its typed errors, layers, and client transforms fit the project. Do not replace an established transport without a reason.

Raw `fetch` is a deliberate alternative for platform transports, browser or edge constraints, small adapters, or libraries that avoid unstable Effect HTTP dependencies.

## Own the provider boundary

Give each adapter operation a named effect that constructs the request, attaches credentials, classifies status, decodes the body, and maps failures into errors its callers understand. Keep provider details inside the adapter and network calls outside authoritative database transactions. Preserve diagnostic evidence without exposing credentials or private payloads.

With `HttpClient`, classify unsuccessful status before decoding a success payload. Choose body-only or full-response Schema decoding according to whether headers and status belong to the contract. For raw `fetch`, pass the `Effect.tryPromise` signal into the request, classify status explicitly, and decode unknown bodies with Schema.

## Bound retries and deadlines

Use `HttpClient.retryTransient` for ordinary transient transport/status failures. Set a finite retry bound and a pacing schedule, for example `HttpClient.retryTransient({ times: 3, schedule: Schedule.exponential("200 millis") })`. Without a bound, retries can continue indefinitely; `Retry-After` sets a minimum delay.

Retry only when the operation is idempotent and the request body is replayable. Retry transient responses before success-body decoding.

Client retries do not cover later body reads or decoding; use operation-level `Effect.retry` only when the adapter can safely retry that whole operation. See [scheduling](SCHEDULING.md) for domain-specific policies.

Use `HttpClient.withRateLimiter` when proactive pacing fits the provider. Bound or disable its automatic `429` retries separately; they are otherwise unlimited.

`HttpClient.timeout` covers the wrapped client until it returns a response, normally when headers arrive. Put a deadline around the full adapter when body reading and decoding must share it. Decide whether the deadline covers each attempt or the entire retry loop; transform order changes that budget.

## Source hints

In the matching Effect checkout, read `packages/effect/src/http/HttpClient.ts` for retry, timeout, and rate-limit composition, and `packages/effect/src/http/HttpClientResponse.ts` for decoding.
