---
name: code-style
description: Apply my preferences for design, APIs, state, tests, and documentation. Use whenever implementing, refactoring, testing, documenting, reviewing code, or changing dependencies.
---

# Code style

Use these as judgment-based defaults, not reasons to add lint rules for line length, function size or complexity, or magic numbers. Follow explicit task-specific exceptions.

## Design

- Satisfy the current requirement with the simplest design. Do not add speculative configuration, extension points, or fallbacks.
- Prefer small, focused functions that can be composed and tested independently. Compose them into larger functions that coordinate behavior; do not split cohesive logic merely to meet a size target.
- Prefer self-documenting names and structure. Use named constants for meaningful numeric values, especially domain limits, units, and repeated values. Keep literals when their meaning is obvious and a name adds no clarity.
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

- Prefer self-documenting code. Add brief comments or documentation only for non-obvious constraints, rationale, behavior, or operations. Distinguish intended behavior from the current implementation.
- Keep conversation history out of repository changes, including paraphrased requests, agent plans, progress reports, and session summaries. This applies to READMEs, comments, docstrings, and other tracked files.
- Write for a maintainer who has never seen the conversation. Record enduring technical facts, not who requested or agreed to them.
- Keep quick starts task-focused. Put temporary implementation, migration, and review notes in the conversation or pull request, not repository files, unless explicitly requested as a repository artifact.
