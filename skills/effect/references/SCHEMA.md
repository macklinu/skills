# Schema and data modeling

Use schemas to define contracts, not to duplicate TypeScript shapes. Keep the project's established modeling patterns unless the task changes them.

## Records and scalar values

Default to `Schema.Struct` plus a same-name interface. Derive scalar IDs and value objects from constrained branded schemas so a brand carries a checked domain rule, not only a label.

```ts
import { Schema } from "effect"

export const UserId = Schema.NonEmptyString.pipe(Schema.brand("UserId"))
export type UserId = typeof UserId.Type

export const User = Schema.Struct({
  id: UserId,
  name: Schema.NonEmptyString,
  email: Schema.optionalKey(Schema.String),
})
export interface User extends Schema.Schema.Type<typeof User> {}
```

Use `Schema.fromBrand` when an existing `Brand` constructor owns the check. Avoid `Schema.Class` and `Schema.TaggedClass` as defaults for application data.

Validate domain constraints at boundaries, then trust branded values internally. Do not repeat validation merely to pass values between internal functions. Constructors that establish another valid domain type remain appropriate.

Reuse `.fields` and field transformations for semantically related contracts. Use explicit mapping when domain translation, joins, or behavior differ; use `Schema.encodeKeys` when only wire names differ. Add identifiers only when diagnostics or tooling consume them.

**Field transformations can lose validation.** `.mapFields` and `Schema.fieldsAssign` drop whole-record checks by default. Reapply checks for the new contract; preserve them with `unsafePreserveChecks` only after confirming they remain valid.

## Absence and construction

Prefer library constructors and combinators over manually assembling Effect values or objects containing `_tag`. Use `Option` for expected absence in Effect APIs.

Use `Schema.optionalKey` for absent keys and `Schema.optional` when explicit `undefined` belongs in the contract. Accept `null` only when it is a real boundary value. Keep normalized domain fields required and apply defaults during decoding or construction instead of weakening the domain type.

Decode unknown boundary input with `Schema.decodeUnknownEffect`. For recoverable construction, `schema.makeEffect` validates the decoded/type-side representation and applies constructor defaults; it does not decode encoded input. Reserve throwing `schema.make` for trusted construction.

Construction failures use `SchemaIssue.Issue`; boundary decoding uses `Schema.SchemaError`. Choose a pure decoder only when decoding is service-free and its failure policy fits: throwing, explicit failure, or intentionally discarded mismatch details.

## Internal states and boundary variants

Use `Data.TaggedEnum` with `Data.taggedEnum` for internal workflow decisions. Construct values with its named variant constructors instead of object literals containing `_tag`.

Do not add a schema solely for construction or matching.

Use `Schema.TaggedStruct` for a reusable boundary variant and `Schema.TaggedUnion` when a union needs decoding, encoding, persistence, or schema composition. Derive their types with `type Event = typeof Event.Type`; do not hand-write tags or duplicate fields.

Construct variants through their schemas, such as `Event.cases.Created.makeEffect(fields)`, or `.make` for trusted construction. Use `.cases` to reuse variant schemas.

Preserve external discriminators and encoding contracts; do not impose internal `_tag` conventions on wire formats. For external discriminators such as `type`, use `Schema.tag` in the contract and `Schema.toTaggedUnion("type")` when you need union helpers. Use `Schema.tagDefaultOmit` only when the encoded contract intentionally omits the discriminator.

## Tag checks and matching

Prefer type-owned predicates and exhaustive matchers over manual `_tag` comparisons. Raw comparisons already narrow TypeScript unions. These APIs add reusable predicates, constrained tag names where supported, and exhaustiveness checking, not automatic payload validation.

- For built-in types, use module predicates such as `Option.isSome`, `Result.isSuccess`, and `Exit.isFailure`, or their matching and transformation combinators.
- For `Data.taggedEnum`, use `Variant.$is("Tag")(value)` for guards and `Variant.$is("Tag")` for filtering. Use `Variant.$match` for exhaustive dispatch.
- For Schema tagged unions, use `.match` for exhaustive dispatch and `.isAnyOf(["Tag"])` for tag-only narrowing of trusted values.
- For existing `_tag` unions without helpers, use `Match.valueTags(value, handlers)` or `Match.typeTags<Variant>()(handlers)` for exhaustive dispatch.
- For grouped or nested patterns, compose `Match.tag` or `Match.when` cases and end with `Match.exhaustive`. Use `Match.tagsExhaustive` for an exhaustive tag-handler map.
- As a fallback, `Predicate.isTagged` checks only `_tag` and accepts arbitrary tag strings. Prefer type-owned predicates that constrain tag names.

Schema's `.guards.Tag` validates the full type-side value, not only its tag. Use it when validation is needed, not to select a variant of an already-validated value. `Data.taggedEnum`'s `$is` and tag matchers do not validate payloads; decode unknown input at the boundary first.

```ts
import { Data } from "effect"

type Job = Data.TaggedEnum<{
  Ready: { id: string }
  Failed: { message: string }
}>
const Job = Data.taggedEnum<Job>()

const jobs: ReadonlyArray<Job> = [
  Job.Ready({ id: "job-1" }),
  Job.Failed({ message: "Queue unavailable" }),
]
const readyJobs = jobs.filter(Job.$is("Ready"))
const describe = Job.$match({
  Ready: ({ id }) => `Ready: ${id}`,
  Failed: ({ message }) => `Failed: ${message}`,
})
const descriptions = jobs.map(describe)
```

Do not introduce schemas or wrappers solely to avoid a comparison. Do not add catch-all branches to hide missing cases.

## Typed errors

Represent expected failures in the typed error channel, not by throwing. Default to `Schema.TaggedError` for typed errors; it is the class exception to these data-model defaults. Instantiate the error class instead of constructing a plain tagged object.

Map infrastructure failures into domain-specific tagged errors at service boundaries, retaining useful operation labels and `Schema.Defect()` payloads. Use schema unions for public transport error contracts.

Prefer `Effect.orElseSucceed` over catch-then-succeed when all typed failures should become pure fallback values. For selective tagged recovery, use `Effect.catchTag` or `Effect.catchTags` instead of catching everything with `Effect.catch` and branching on `_tag`. Use `Effect.catch` when recovery itself is effectful and applies to the whole typed error channel. For tagged `reason` fields, `Effect.catchReason` and `Effect.catchReasons` preserve the service's error model.

Propagate failures unless the contract requires partial results. When it does, model failures explicitly rather than returning empty success.

Expose stable error tags and safe structured fields in public responses. Clients derive presentation text unless the contract explicitly requires display-ready text. Keep internal causes and raw provider messages out of public responses.

At supervision boundaries, handle broad causes only when the recovery policy requires it and preserve interruption. Check the chosen combinator's mixed-cause behavior rather than assuming typed recovery handles defects or preserves every interruption-containing cause.

For exact construction, field-transformation, and variant behavior, read `packages/effect/src/Schema.ts` in the Effect checkout. Check `Data.ts`, `Match.ts`, and `Predicate.ts` in the same directory for tag checks and matching. For mixed-cause recovery, read the `catch` combinators in `Effect.ts`; for reason errors, read `ai-docs/src/01_effect/04_errors/20_reason-errors.ts`.
