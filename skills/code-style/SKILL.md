---
name: code-style
description: Apply my preferences for design, APIs, state, tests, and documentation. Use whenever implementing, refactoring, testing, documenting, reviewing code, or changing dependencies.
---

# Code style

Use these as judgment-based defaults, not reasons to add lint rules for line length, function size or complexity, or magic numbers. Follow explicit task-specific exceptions.

## Design

- Satisfy the current requirement with the simplest design. Do not add speculative configuration, extension points, or fallbacks.
- Prefer a little duplication to coupling unrelated behavior. Extract code for a shared rule, domain boundary, or clear resource ownership, not merely similar syntax.
- Start with a simple, cohesive module. As it grows, prefer small, composable modules, views, and UI components. Split responsibilities that change independently, not to impose upfront layers or arbitrary size limits.
- Remove obsolete code, comments, tests, and transitional paths when replacing an implementation. Keep unrelated refactors separate.
- Use self-documenting names and structure, including clear callback parameter names. Reserve `x`, `y`, and similar names for coordinates; conventional loop counters such as `i` are fine.
- Prefer small, named, composable pure functions that express intent and can be tested independently. Larger functions should coordinate them rather than accumulate inline logic.
- Extract meaningful rules and operations, not trivial expressions. Do not split cohesive logic merely to meet a size target.
- Use named constants for meaningful values, especially domain limits, units, and repeated values. Keep literals when their meaning is obvious and a name adds no clarity.
- Separate pure logic from effects where practical. Follow the framework's effect and message mechanisms.
- Prefer immutable transformations when clearer; local mutation is fine otherwise. Justify optimizations with benchmarks, not style rules.

## APIs and state

- Expose only APIs and fields that current behavior requires.
- For functions you design with two or more inputs, use a named options object. Preserve library-required signatures.
- Derive values from existing state instead of storing synchronized copies. If a stored copy is necessary, define its updates and invalidation.
- Model mutually exclusive states with discriminated unions or state machines to prevent contradictory combinations. Keep independent conditions as booleans.
- Define who creates, updates, and clears state, and who releases resources.
- Parse and validate at boundaries. Trust valid objects internally and convert them to other valid types without repeating defensive checks.
- At boundaries, enforce domain constraints even when a general-purpose parser accepts or normalizes forbidden input.
- Prefer branded types for domain values that must not be interchangeable.
- In plain JavaScript APIs, represent expected absence with `undefined`. Follow the Effect skill for Effect-specific absence and error handling.

## Tests

- Test observable outcomes, failures, and state or resource transitions, including recovery. Choose cases that catch a plausible defect.
- Test behavior through meaningful entry points. For UI behavior, prefer user actions with Playwright or React Testing Library; do not force UI testing patterns onto unit tests.
- Test pure functions directly when useful. Exercise pure helpers through their real implementations unless stronger control is needed.
- Avoid replacing imported modules with mocks or stubs unless there is no practical alternative. When control is needed, prefer the framework's dependency injection mechanisms.
- Do not write tautological tests. Derive expectations independently. Do not reproduce implementation logic or test that a mock returns its configured value.
- Keep tests deterministic. Test the contract, not source layout or incidental implementation details.
- Prefer framework test and lifecycle utilities to custom wrappers.

## Libraries

- Use installed libraries' standard resource, error, and cleanup patterns before adding wrappers.
- In Effect projects, check Effect's APIs first. For work with many edge cases, prefer widely used, battle-tested npm packages to improvised helpers.
- Use dependencies directly or through framework adapters as needed. Do not add wrappers without a concrete purpose.
- Read primary documentation or source before changing unfamiliar library behavior or configuration.

## Errors and observability

- Log errors at higher handling boundaries, rather than logging the same failure at each layer.
- Keep personally identifiable information out of trace context. Follow the framework's instrumentation mechanisms.

## Documentation

- Prefer self-documenting code. Add brief, technical comments or documentation only for non-obvious constraints, rationale, behavior, or operations.
- Implement decisions in code first. Distinguish intended behavior from the current implementation.
- Keep conversation history out of repository changes, including paraphrased requests, agent plans, progress reports, and session summaries. This applies to READMEs, comments, docstrings, and other tracked files.
- Write for a maintainer who has never seen the conversation. Record enduring technical facts, not who requested or agreed to them.
- Keep quick starts task-focused. Put temporary implementation, migration, and review notes in the conversation or pull request, not repository files, unless explicitly requested as a repository artifact.
