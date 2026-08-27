# HttpApi

Read this only when the project uses `effect/unstable/httpapi` or an existing `HttpApi` definition. These modules are unstable; confirm exports against the pinned Effect version.

- Keep `HttpApi`, groups, endpoints, schemas, and middleware contracts separate from server implementations so handlers, clients, OpenAPI, and tests share one contract.
- Build handler implementations as Layers with `HttpApiBuilder`. Keep handlers thin: accept decoded input, call application services, and return declared success or error values.
- Put authentication and cross-cutting transport policy in `HttpApiMiddleware`; keep business authorization in domain/application services when it depends on domain state.
- Compose the final routes and platform server at the application root. Use `HttpRouter.toWebHandler` only at serverless or external-framework edges, and dispose the returned handler resources when the host shuts down.

## In-Memory Typed Tests

Prefer `HttpApiTest` when testing an existing HttpApi implementation. `HttpApiTest.groups(Api, [...])` builds an in-memory typed client that exercises request encoding, routing, middleware, handlers, error mapping, and response decoding without opening a socket.

- Provide the real handler Layers with test service implementations and `HttpServer.layerServices`.
- Provide client-side middleware, such as test authorization, separately from server middleware.
- Assert through the generated typed client rather than invoking handler functions directly.
- Keep a smaller number of live-server tests only for platform wiring that the in-memory pipeline does not cover.
