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

Reuse `.fields` and field transformations for semantically related contracts. Use explicit mapping when domain translation, joins, or behavior differ; use `Schema.encodeKeys` when only wire names differ. Add identifiers only when diagnostics or tooling consume them.

**Field transformations can lose validation.** `.mapFields` and `Schema.fieldsAssign` drop whole-record checks by default. Reapply checks for the new contract; preserve them with `unsafePreserveChecks` only after confirming they remain valid.

## Absence and construction

Use `Schema.optionalKey` for absent keys and `Schema.optional` when explicit `undefined` belongs in the contract. Accept `null` only when it is a real boundary value. Keep normalized domain fields required and apply defaults during decoding or construction instead of weakening the domain type.

Decode unknown boundary input with `Schema.decodeUnknownEffect`. For construction, `schema.makeEffect` validates the decoded/type-side representation and applies constructor defaults; it does not decode encoded input. Reserve throwing `schema.make` for trusted construction.

Construction failures use `SchemaIssue.Issue`; boundary decoding uses `Schema.SchemaError`. Choose a pure decoder only when decoding is service-free and its failure policy fits: throwing, explicit failure, or intentionally discarded mismatch details.

## Internal states and boundary variants

Use `Data.TaggedEnum` with `Data.taggedEnum` for internal workflow decisions and exhaustive `$match`. Its `$is` checks only the tag, not untrusted fields. Do not add a schema solely to obtain matching utilities.

Use `Schema.TaggedStruct` for a reusable boundary variant and `Schema.TaggedUnion` when a union needs decoding, encoding, persistence, or schema composition. Derive their types with `type Event = typeof Event.Type`; do not hand-write tags or duplicate fields. Use `.cases`, `.guards`, and `.match` where useful.

For external discriminators such as `type`, use `Schema.tag` in the contract and `Schema.toTaggedUnion("type")` when you need union helpers. Use `Schema.tagDefaultOmit` only when the encoded contract intentionally omits the discriminator.

## Typed errors

`Schema.TaggedError` is the class exception to these data-model defaults. Map infrastructure failures into domain-specific tagged errors at service boundaries, retaining useful operation labels and `Schema.Defect()` payloads. Use schema unions for public transport error contracts.

Prefer typed recovery with `Effect.catchTag`, `Effect.catchTags`, or `Effect.catch`. For tagged `reason` fields, `Effect.catchReason` and `Effect.catchReasons` preserve the service's error model.

At supervision boundaries, handle broad causes only when the recovery policy requires it and preserve interruption. Check the chosen combinator's mixed-cause behavior rather than assuming typed recovery handles defects or preserves every interruption-containing cause.

For exact construction, field-transformation, and variant behavior, read `packages/effect/src/Schema.ts` in the Effect checkout. For mixed-cause recovery, read the `catch` combinators in `packages/effect/src/Effect.ts`; for reason errors, read `ai-docs/src/01_effect/04_errors/20_reason-errors.ts`.
