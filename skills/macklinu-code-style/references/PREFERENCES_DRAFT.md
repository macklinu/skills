# Draft preference questions

This is non-normative material for you to edit. The [current style rules](../SKILL.md) remain authoritative. Blank fields, alternatives in questions, and supplied examples do not establish policy; an approved decision needs a separate update to the relevant rule.

## Assessment

The reviewed directives do not establish a direct contradiction. The open points below are unclear boundaries or compatible conditional guidance that would benefit from your examples. They do not justify new exceptions, precedence rules, or numeric thresholds.

Use public-safe examples with invented names and data. Each topic has fields for your answer and a representative before/after example or rationale; leave fields pending when you have no preference.

## API signatures

**Current rules.** [APIs and state](../SKILL.md#apis-and-state) says, "Use a named options object instead of positional arguments when a function takes more than one input." [Libraries and validation](../SKILL.md#libraries-and-validation) says, "Use the installed library's standard patterns for resources, errors, discriminated data, and cleanup."

**Finding.** The scope is unclear when a library requires a multi-argument callback, such as an array comparator receiving `(left, right)`. The options-object rule does not state a callback exception, and the library-pattern rule does not explicitly resolve argument shape. This is an unclear boundary, not proof that the two directives contradict each other.

**Question.** Should the options-object rule distinguish APIs you control from library-required callback signatures?

- Your answer: [Pending.]
- Before example: [Add a representative multi-input function or callback.]
- After example or rationale: [Show the desired signature and its call site, or explain the boundary.]

The [callback contract reference](APPLYING_RULES.md#callback-contracts) explains TypeScript behavior, not your preferred exception policy.

## Validation state

**Current rules.** [APIs and state](../SKILL.md#apis-and-state) requires defining when user-visible state is "created, updated, and cleared" and testing "show the error, edit the input, and recover to a valid state." It also requires a discriminated union or state machine for fixed mutually exclusive states, while allowing independent booleans.

**Finding.** The error lifecycle is required, but its timing is not specified. Clearing on the first edit, after revalidation, or after a successful submission produces different visible behavior. This is an unclear product-dependent boundary, not a conflict between unions and simple design.

**Question.** For a form that shows a validation error after submission, when should that error clear as the user edits?

- Your answer: [Pending. State whether this is a default preference or specific to the example.]
- Before example: [Add a short state model and the sequence that exposes the unwanted behavior.]
- After example or rationale: [Show the desired states and visible transitions, or explain why the product decides.]

The [state model reference](APPLYING_RULES.md#state-models) explains type mechanisms without choosing the lifecycle.

## Abstraction and module boundaries

**Current rules.** [Design](../SKILL.md#design) says, "Add an abstraction only when repeated code or a real domain boundary justifies it." It forbids a helper, wrapper, union type, or configuration layer "merely to hide one call." [Reviewability](../SKILL.md#reviewability) requires one responsibility per module and separating view rendering, runtime wiring, and domain logic when an entry point mixes concerns.

**Finding.** A domain boundary can justify extraction without repetition, so these rules are compatible. The unclear boundary is what counts as a real domain responsibility in a small module. The rules supply no size or repetition threshold, and this draft does not add one.

For Effect code, the [service module convention](https://github.com/macklinu/skills/blob/main/skills/effect/references/SERVICES_LAYERS.md#module-surface) explicitly defers to established module style. It is compatible conditional guidance, not a requirement to add service layers or namespace exports to every module.

**Question.** In one small entry point, which responsibility would you extract before it repeats, and why?

- Your answer: [Pending.]
- Before example: [Add a short entry point with the relevant responsibilities.]
- After example or rationale: [Show the extraction you prefer, or explain why you would keep it inline.]

## Tests and dependency fakes

**Current rules.** [Tests](../SKILL.md#tests) says, "Test observable behavior and state or resource transitions that are likely to fail." It forbids tests that "merely confirm that a mock returns its configured value" and requires cases that fail for a plausible defect. It also prefers framework test utilities and explicit resource ownership.

**Finding.** For Effect tests, [first-class app test stubs](https://github.com/macklinu/skills/blob/main/skills/effect/references/TESTING.md#first-class-app-test-stubs) allow reusable/stateful fakes, while [testing defaults](https://github.com/macklinu/skills/blob/main/skills/effect/references/TESTING.md#defaults) require explicit lifecycles and deterministic synchronization. This guidance is compatible because the fake controls a dependency rather than proving consumer behavior. The style skill does not specify the preferred boundary between a fake-based test and a real-adapter test.

**Question.** For an operation that retries a failed send, where do you want a fake instead of a real adapter?

- Your answer: [Pending. Name the consumer behavior and plausible defect the test must detect.]
- Before example: [Add a test whose evidence you find insufficient.]
- After example or rationale: [Show the preferred test and assertion, or explain the required test boundary.]

## Documentation placement

**Current rules.** [Documentation and dependencies](../SKILL.md#documentation-and-dependencies) says to skip documentation updates "when code already explains the change" and not repeat clear API names, control flow, or file structure. It also calls for docs about "enduring rationale and constraints" and says to explain exclusions and policy choices that could surprise reviewers or affect user decisions.

**Finding.** These are compatible conditions, not conflicting demands to always write or never write docs. The unclear boundary is where a rationale belongs when the implementation is clear but the reason for a policy is not.

**Question.** For a domain validation check that is stricter than its parser, what rationale belongs in a code comment, a permanent document, or only the PR?

- Your answer: [Pending.]
- Before example: [Add a short validation check with its existing explanation, if any.]
- After example or rationale: [Show the explanation and location you prefer, or explain why no permanent text is needed.]
