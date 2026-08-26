# Effect SQL

Read this only when the project uses `effect/unstable/sql` or an `@effect/sql-*` driver. Verify unstable SQL APIs against the pinned Effect version.

- Acquire the chosen driver Layer once in the application composition and run the migrator Layer explicitly before repositories serve traffic.
- Keep SQL access behind repository services so application code depends on domain operations rather than `SqlClient`.
- Use `SqlSchema` to encode requests and decode rows for custom queries. Use `SqlModel` and `Model.Class` only when the project has chosen the Effect SQL model stack and benefits from its select/insert/update/JSON variants.
- Treat migrations as ordered, reviewable application artifacts; do not hide schema creation inside request-time repository calls.
- Translate absence, constraints, and expected persistence conditions into typed domain errors at the repository boundary. Preserve unexpected SQL/schema failures for the owning boundary to report or defect according to project policy.
- Keep provider/network calls outside authoritative database transactions. Retry a transaction only when the complete transaction is safe and the failure class is known retryable.
- Test repository behavior with a dedicated database/test Layer and the same migrations. Keep unit-level application service tests on repository fakes.
