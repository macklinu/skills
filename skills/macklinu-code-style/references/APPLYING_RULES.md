# Applying the current rules

Use this reference for TypeScript callback contracts, state models, and Effect-specific implementations. The [style rules](../SKILL.md) remain authoritative. These sources explain language and library behavior, not personal preferences.

## Callback contracts

When a library calls your function, read its declared callback type and invocation contract. The TypeScript handbook explains [callback parameters](https://www.typescriptlang.org/docs/handbook/2/functions.html#optional-parameters-in-callbacks), including why a callback may ignore supplied arguments and what an optional parameter means.

This explains the type contract, not whether the options-object rule permits an exception. That scope question remains in the [draft API question](PREFERENCES_DRAFT.md#api-signatures).

## State models

When representing mutually exclusive states, use the TypeScript handbook's [discriminated unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions) and [exhaustiveness checking](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#exhaustiveness-checking) to understand narrowing and missing-case detection. These mechanisms do not decide which states the product needs or when validation errors clear.

For Effect applications, follow the [Effect branch chooser](https://github.com/macklinu/skills/blob/main/skills/effect/SKILL.md#branch-chooser) for schemas and internal state. It distinguishes internal tagged data from boundary-crossing schemas; do not copy a plain TypeScript example as an Effect-specific default.

## Effect services and tests

When changing Effect code, follow the [Effect source rule](https://github.com/macklinu/skills/blob/main/skills/effect/SKILL.md#source-rule) for the project's pinned APIs and applicable project conventions.

- For service boundaries and module surfaces, follow [Services, layers, and modules](https://github.com/macklinu/skills/blob/main/skills/effect/references/SERVICES_LAYERS.md). Its namespace style is conditional, not a universal module rule.
- For Effect test lifecycles, deterministic synchronization, and reusable fakes, follow [Testing](https://github.com/macklinu/skills/blob/main/skills/effect/references/TESTING.md). A fake controls a dependency; the style skill still requires assertions that can detect a defect in observable behavior.

These references do not set a new abstraction threshold, API exception, or test coverage target. Personal choices remain in [Draft preference questions](PREFERENCES_DRAFT.md).
