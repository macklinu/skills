# HTTP API

Use this reference only when the project uses `effect/http-api` or an existing `HttpApi` contract. Do not introduce the unstable API stack merely to wrap an existing router.

Keep endpoint schemas and middleware contracts separate from handler implementations so the server, generated clients, OpenAPI, and tests share one contract. Build handlers as Layers with `HttpApiBuilder`. Handlers accept decoded input, call application services, and return declared success or error values.

Put authentication and cross-cutting transport policy in `HttpApiMiddleware`. Keep authorization that depends on domain state in application services, where non-HTTP callers receive the same checks.

Compose routes and the platform server at the application root. At serverless or external-framework edges, `HttpRouter.toWebHandler` bridges to the host. Dispose its returned resources when the host shuts down.

## Test the contract and transport separately

Prefer `HttpApiTest` for contract-level tests. Its in-memory typed client exercises encoding, routing, middleware, handlers, and response decoding without opening a socket. Provide real handler Layers with test application services and `HttpServer.layerServices`; provide client-side middleware separately.

Create the client in a test-owned scope, and assert through it instead of calling handlers directly. A streaming response keeps request resources alive until its body finishes or the owning scope closes.

Only call groups selected by `HttpApiTest.groups`. The client type still includes other groups, but calling them defects. Keep live-server tests for client aborts, socket behavior, and platform wiring; the in-memory client does not emulate those behaviors.

## Source hints

Read `packages/effect/src/http-api/HttpApiTest.ts` for test scope and group behavior, and `packages/effect/src/http/HttpRouter.ts` for web-handler lifecycle in the matching Effect checkout.
