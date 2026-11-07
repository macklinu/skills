# Schema And Data Modeling

Use this when touching data models, DTOs, row schemas, wire contracts, brands, variants, optional fields, or decoders.

## Records

Default to `Schema.Struct(...)` plus a same-name `interface`.

```ts
export const User = Schema.Struct({
  id: UserId,
  name: Schema.NonEmptyString,
  email: Schema.optionalKey(Schema.String),
})

export interface User extends Schema.Schema.Type<typeof User> {}
```

Guidance:

- Add `.annotate({ identifier: "User" })` only when tooling consumes it: HTTP API, RPC, OpenAPI/JSON Schema, docs, diagnostics, or codegen.
- Use `schema.make(...)` when construction is trusted. It validates the decoded/type-side representation and applies constructor defaults; it does not decode encoded input.
- Use `schema.makeEffect(...)` when construction failure should stay in the Effect error channel. It fails with `SchemaIssue.Issue`, not `Schema.SchemaError`. Boundary decoders such as `Schema.decodeUnknownEffect(...)` fail with `Schema.SchemaError` instead.
- Decode unknown input at boundaries with `Schema.decodeUnknownEffect(...)` by default.
- Use `Schema.decodeUnknownSync(...)` only in scripts, tests, or startup paths where throwing is acceptable.
- Use `Schema.decodeUnknownOption(...)` only when mismatch details are intentionally discarded.
- Use `Schema.decodeUnknownResult(...)` for pure code that wants explicit success/failure without Effect.
- Synchronous, Option, and Result decoders require service-free decoding. Use the Effect decoder for service-dependent or asynchronous transformations.

See the [construction contract](https://github.com/Effect-TS/effect/blob/506eef143bcc1750ce58920aac1e45da7265d103/packages/effect/src/Schema.ts#L214-L291) and [Effect decoder error type](https://github.com/Effect-TS/effect/blob/506eef143bcc1750ce58920aac1e45da7265d103/packages/effect/src/Schema.ts#L1514-L1542).

## Field And Contract Reuse

Reuse fields directly when contracts are semantically related.

```ts
export const CreateUserInput = Schema.Struct({
  name: User.fields.name,
  email: User.fields.email,
})

export const StoredUser = User.pipe(
  Schema.fieldsAssign({
    createdAt: Schema.DateTimeUtcFromString,
  }),
)
```

Guidance:

- Use `.fields`, `Schema.fieldsAssign(...)`, and `.mapFields(...)` when contracts are genuinely related.
- Field reuse does not preserve whole-record checks. `.mapFields(...)` and `Schema.fieldsAssign(...)` drop them by default; reapply checks for the new contract. Use `unsafePreserveChecks` only after confirming the old checks remain valid.
- Use `Schema.encodeKeys(...)` when decoded TypeScript names differ from encoded wire/storage keys and naming is the only difference.
- Keep explicit mapping when behavior, joins, validation, or domain translation is involved.
- Use `Schema.extendTo(...)` sparingly for decoded-only derived fields.
- Use field reuse to build small related contracts, not one oversized inheritance-by-schema object.

## Optionality And Defaults

- Use `Schema.optionalKey(...)` for absent JSON/storage keys.
- Use `Schema.optional(...)` only when explicit `undefined` is part of the contract.
- Use `Schema.NullOr`, `Schema.UndefinedOr`, or `Schema.NullishOr` only when nullish values are truly part of the encoded contract.
- Keep normalized defaulted values as required fields and apply defaults in constructors/decoding.
- Do not make domain values optional merely for construction convenience.

## Nominal Values

- Use constrained branded schemas for scalar IDs and value objects.
- Use normal schema constraints before `Schema.brand(...)` for most code.
- Reach for `Schema.fromBrand(...)` only when the project already models brands with `Brand` constructors or wants the check packaged with the brand constructor.

## Variants

```ts
type Step = Data.TaggedEnum<{
  Continue: { readonly cursor: number }
  Finished: { readonly count: number }
}>

export const Step = Data.taggedEnum<Step>()

const next = Step.Continue({ cursor: 10 })
const label = Step.$match(next, {
  Continue: ({ cursor }) => `continue at ${cursor}`,
  Finished: ({ count }) => `finished ${count}`,
})
```

```ts
export const Event = Schema.TaggedUnion({
  Started: { runId: RunId },
  Finished: { runId: RunId, result: Schema.Json },
})

export type Event = typeof Event.Type

const event = Event.cases.Started.make({ runId })
const label = Event.match(event, {
  Started: ({ runId }) => `started ${runId}`,
  Finished: ({ runId }) => `finished ${runId}`,
})
```

Guidance:

- Use `Data.TaggedEnum` for internal control-flow algebras; it provides constructors, `$is`, and exhaustive `$match`. Do not add a Schema solely to obtain these utilities.
- `Data.taggedEnum`'s `$is` checks only the tag. It does not validate untrusted fields.
- Use `Schema.TaggedStruct` for the ordinary Effect-owned `_tag` variant.
- Use `Schema.TaggedUnion` when the union needs decoding, encoding, persistence, wire validation, JSON Schema derivation, or schema composition.
- For `Schema.TaggedStruct` and `Schema.TaggedUnion`, derive the TypeScript type from the schema with `type Foo = typeof Foo.Type`. Do not hand-write `_tag` or duplicate schema fields in an interface.
- Prefer a principled split over forcing one representation everywhere: Data internally, Schema at boundaries.
- Use `Schema.tag(...)` when an external contract has a custom discriminator field such as `type` or `kind`; combine those structs with `Schema.toTaggedUnion("type")` when union helpers are needed.
- If the encoded contract omits the discriminant, use `Schema.tagDefaultOmit(...)` deliberately.
- Avoid `Schema.Class` and `Schema.TaggedClass` for new data models.

## Errors

`Schema.TaggedError` is the explicit class exception for typed Effect errors.

```ts
export class PersistenceError extends Schema.TaggedError<PersistenceError>()(
  "UserRepo.PersistenceError",
  {
    operation: Schema.String,
    cause: Schema.Defect(),
  },
) {}
```

Guidance:

- Map infrastructure failures into domain-specific tagged errors at service boundaries.
- Include operation labels when they help diagnose adapter, persistence, provider, or transport failures.
- Recover from expected typed failures with `Effect.catchTag(...)`, `Effect.catchTags(...)`, or `Effect.catch(...)`. The v3 name `Effect.catchAll` is now `Effect.catch`.
- For an error with a tagged `reason` field, use `Effect.catchReason(errorTag, reasonTag, handler)` or `Effect.catchReasons(errorTag, handlers)` to handle reasons without flattening the service's error model.
- Typed recovery does not recover a cause containing a defect. Typed failures in such mixed causes become defects; use cause-level handling only when the boundary intentionally handles those failures.
- Use schema unions for public API or transport error surfaces.
- Use `Schema.Defect()` for defect-like payloads.
- Preserve interruption when catching broad causes at ingress, worker, or stream boundaries.

See the [error-handling migration guide](https://github.com/Effect-TS/effect/blob/506eef143bcc1750ce58920aac1e45da7265d103/migration/error-handling.md#L7-L19) and [reason-error examples](https://github.com/Effect-TS/effect/blob/506eef143bcc1750ce58920aac1e45da7265d103/ai-docs/src/01_effect/04_errors/20_reason-errors.ts#L11-L63).
