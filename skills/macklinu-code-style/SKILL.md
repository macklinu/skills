---
name: macklinu-code-style
description: Apply Macklinu's code style to keep designs small, APIs focused, state explicit, tests useful, and changes reviewable. Use when implementing, refactoring, testing, documenting, or reviewing code and dependencies.
---

# Macklinu Code Style

## Design

- Prefer the smallest coherent design that satisfies the current requirement.
- Add an abstraction only for proven repetition or a real domain boundary. Do not hide a single call behind a helper, wrapper, union, or configuration layer.
- Remove obsolete code, comments, tests, and transitional paths. Do not retain implementation debris without a current purpose.

## APIs and state

- Expose only the API the product needs now. Do not add speculative commands, extension points, or configuration machinery.
- Use a named option object when a function has more than one input.
- Model only meaningful data. Do not pass empty objects to fieldless errors.
- Give visible state an explicit lifetime. Test validation through error, edit, and recovery.

## Tests

- Test observable contracts and risky state or resource transitions.
- Keep tests deterministic and minimal. Do not test source shape, deleted fields, intentional stubs, or incidental implementation details.
- Use the framework's own test and lifecycle utilities before building local wrappers.
- Make ownership and cleanup clear when sequencing or resources matter.

## Libraries and validation

- Check primary documentation and source behavior before changing an unfamiliar rule, parser, or configuration.
- Use a parser only when its accepted input matches the domain. Keep narrow validation when a general parser accepts or normalizes invalid input.
- Use the installed library's idiomatic constructs for resources, errors, discriminated data, and cleanup.

## Documentation and dependencies

- Keep user documentation focused on the user task. Do not put internal merge mechanics or implementation rationale in the quick-start path.
- Preserve existing wording unless the change requires a user-visible update.
- Separate tested versions from supported version ranges. Do not prescribe exact consumer versions without a verified compatibility constraint.
- Explain surprising exclusions and policy choices where they affect review or user decisions.

## Reviewability

- Keep modules cohesive and reviewable. Split mixed-responsibility entry points into focused view, runtime, or domain modules.
- Split dependent work into a small PR stack when it improves review without mixing unrelated refactors into the feature change.
