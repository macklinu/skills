# Effect SQL

Use this reference only when the project uses `effect/sql` or an `@effect/sql-*` driver.

Acquire the chosen driver layer once at the composition root. Run migrations explicitly before repositories serve traffic, not during request-time queries.

## Keep persistence behind services

Expose domain operations through repository services rather than passing `SqlClient` into application code. Use `SqlSchema` to encode custom-query inputs and decode rows. Translate expected absence, constraint violations, and persistence conditions into typed domain errors; preserve unexpected SQL or schema failures for the owning boundary to handle according to project policy.

Choose `findOneOption` when absence is expected. `findOne` fails on absence but only returns the first row; it does not enforce uniqueness. Let database constraints express uniqueness requirements.

`SqlModel` and `Model.Class` are a local opt-in for projects that benefit from SQL select, insert, update, and JSON variants. They do not replace the general preference for Schema records. Import `SqlModel` from `effect/sql` and `Model` from `effect/schema` when using that stack.

## Own transactions and migrations

Keep provider and network calls outside authoritative database transactions. Retry only when the entire transaction is safe to repeat and its failure class is known to be retryable; retrying an individual statement is not a substitute for that decision.

Treat ordered migrations as reviewed application artifacts. Test repository behavior against a dedicated database Layer with the same migrations. Use repository fakes for application-service unit tests.

During upgrades, consult the matching release notes for driver, migration-loader, and statement-construction changes rather than copying an older import or helper signature.

## Source hints

Read `packages/effect/src/sql/SqlSchema.ts` and `SqlModel.ts`, plus the chosen driver's source. Check `packages/effect/CHANGELOG.md` for upgrade changes in the matching Effect checkout.
