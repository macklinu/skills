# Draft preference questions

This worksheet is non-normative. Unanswered questions and draft examples do not change agent policy; the [current rules](../SKILL.md) remain in force.

Use invented names and data in examples.

## API signatures

Current rules: [APIs and state](../SKILL.md#apis-and-state), [library patterns](../SKILL.md#libraries-and-validation).

Should the options-object rule distinguish APIs you control from library-required callback signatures?

- Answer: [Pending.]
- Example: [Before/after signatures and call sites, or a rationale.]

## Validation state

Current rules: [State lifecycle](../SKILL.md#apis-and-state).

For a form that shows a validation error after submission, when should that error clear as the user edits?

- Answer: [Pending. Say whether this is a default or product-specific.]
- Example: [Before/after state transitions, or a rationale.]

## Abstraction and module boundaries

Current rules: [Design](../SKILL.md#design), [module responsibilities](../SKILL.md#reviewability).

In one small entry point, which responsibility would you extract before it repeats, and why?

- Answer: [Pending.]
- Example: [Before/after code, or a reason to keep it inline.]

## Tests and dependency fakes

Current rules: [Tests](../SKILL.md#tests).

For an operation that retries a failed send, where do you want a fake instead of a real adapter?

- Answer: [Pending. Name the behavior and plausible defect the test must detect.]
- Example: [Before/after tests, or a rationale for the test boundary.]

## Documentation placement

Current rules: [Documentation and dependencies](../SKILL.md#documentation-and-dependencies).

For a domain validation check that is stricter than its parser, what rationale belongs in a code comment, a permanent document, or only the PR?

- Answer: [Pending.]
- Example: [Before/after code and explanation, or a rationale for its location.]

## Related guides

- For TypeScript callback signatures, see [callback parameters](https://www.typescriptlang.org/docs/handbook/2/functions.html#optional-parameters-in-callbacks).
- For Effect module boundaries, follow [module surfaces](https://github.com/macklinu/skills/blob/main/skills/effect/references/SERVICES_LAYERS.md#module-surface).
- For Effect test fakes, follow [first-class app test stubs](https://github.com/macklinu/skills/blob/main/skills/effect/references/TESTING.md#first-class-app-test-stubs).
