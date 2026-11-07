---
name: macklinu-code-style
description: Apply my preferences for design, APIs, state, tests, and documentation. Use whenever implementing, refactoring, testing, documenting, reviewing code, or changing dependencies.
---

# Code style

Use these defaults even when tooling does not enforce them.

## Design

- Satisfy the current requirement with the simplest design. Do not add speculative configuration, extension points, or fallbacks.
- Prefer a little duplication to coupling unrelated behavior. Extract code for a shared rule, domain boundary, or clear resource ownership, not merely similar syntax.
- Split modules for responsibilities that change independently, not to impose layers on small entry points.
- Remove obsolete code, comments, tests, and transitional paths when replacing an implementation. Keep unrelated refactors separate.

## APIs and state

- Expose only APIs and fields that current behavior requires.
- For functions you design with two or more inputs, use a named options object. Preserve library-required signatures.
- Derive values from existing state instead of storing synchronized copies. If a stored copy is necessary, define its updates and invalidation.
- Model mutually exclusive states with discriminated unions or state machines to prevent contradictory combinations. Keep independent conditions as booleans.
- Define who creates, updates, and clears state, and who releases resources.
- Enforce domain constraints even when a general-purpose parser accepts or normalizes forbidden input.

## Tests

- Test observable outcomes, failures, and state or resource transitions, including recovery. Choose cases that catch a plausible defect.
- Do not write tautological tests. Derive expectations independently. Do not reproduce implementation logic or test that a mock returns its configured value.
- Keep tests deterministic. Test the contract, not source layout or incidental implementation details.
- Prefer framework test and lifecycle utilities to custom wrappers.

## Libraries

- Use installed libraries' standard resource, error, and cleanup patterns before adding wrappers.
- Read primary documentation or source before changing unfamiliar library behavior or configuration.

## Documentation

- Keep chat transcripts, issue discussions, and session notes out of code, comments, and documentation. Implement decisions in code first. Document enduring technical rationale when useful, not the conversation or who requested or agreed to it.
- Explain rationale, constraints, intended behavior, and operations that code cannot express. Distinguish intended behavior from the current implementation.
- Keep quick starts task-focused. Put temporary migration and review notes in pull requests or working notes.
