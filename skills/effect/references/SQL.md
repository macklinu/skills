# Effect SQL

Read this only when the project uses `effect/sql` or an `@effect/sql-*` driver. Verify unstable SQL APIs against the pinned Effect version.

- Acquire the chosen driver Layer once in the application composition and run the migrator Layer explicitly before repositories serve traffic.
- Keep SQL access behind repository services so application code depends on domain operations rather than `SqlClient`.
- Import `SqlClient`, `SqlSchema`, and `SqlModel` from `effect/sql`. Import `Model` from `effect/schema`, not `effect/sql`. Use `SqlModel` and `Model.Class` only when the project has chosen the Effect SQL model stack and benefits from its select/insert/update/JSON variants.
- Use `SqlSchema` to encode requests and decode rows for custom queries. Its `execute` callback receives `Request["Encoded"]`; callers pass `Request["Type"]`.
- Use `findOneOption` for expected absence. `findOne` fails with `NoSuchElementError` when no row exists, and returns the first row rather than enforcing exactly one row.
- Treat migrations as ordered, reviewable application artifacts; do not hide schema creation inside request-time repository calls.
- Translate absence, constraints, and expected persistence conditions into typed domain errors at the repository boundary. Preserve unexpected SQL/schema failures for the owning boundary to report or defect according to project policy.
- Keep provider/network calls outside authoritative database transactions. Retry a transaction only when the complete transaction is safe and the failure class is known retryable.
- Test repository behavior with a dedicated database/test Layer and the same migrations. Keep unit-level application service tests on repository fakes.

## Upgrading To 4.1

- Import filesystem migration loading from `effect/sql/MigratorFileSystem`, not `effect/sql/Migrator` or the `effect/sql` barrel. Most driver migrators still re-export `fromFileSystem`; the React Native driver does not.
- `sql.insert(rows)` and `sql.updateValues(rows, ...)` require a non-empty row array. Narrow dynamic arrays with `Array.isReadonlyArrayNonEmpty` and handle the empty case before building the statement.

See the [migration-loader move](https://github.com/Effect-TS/effect/blob/506eef143bcc1750ce58920aac1e45da7265d103/packages/effect/CHANGELOG.md#L285) and [non-empty row requirement](https://github.com/Effect-TS/effect/blob/506eef143bcc1750ce58920aac1e45da7265d103/packages/effect/CHANGELOG.md#L327).

## Sources

- [SQL request encoding and result/absence contracts](https://github.com/Effect-TS/effect/blob/506eef143bcc1750ce58920aac1e45da7265d103/packages/effect/src/sql/SqlSchema.ts#L20-L179).
- [SQL model import and repository API](https://github.com/Effect-TS/effect/blob/506eef143bcc1750ce58920aac1e45da7265d103/packages/effect/src/sql/SqlModel.ts#L14-L78).
