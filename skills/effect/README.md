# Effect

This skill was initially copied from [kitlangton/skills](https://github.com/kitlangton/skills), from `skills/effect`, and has subsequently been modified locally.

## Scope

`SKILL.md` contains the source workflow, application boundaries, and topic index. References explain local choices, their reasons, and warnings that change a design. They are not a replacement for Effect's API documentation.

Agents should use the application's matching Effect subtree or installed package for exact signatures and behavior. Compare the subtree's version and revision with the dependency being used before relying on it.

## Maintenance

- Keep each preference in its owning reference rather than repeating it in the entry point and selection lists.
- Keep examples that teach local conventions or non-obvious composition. Check changed examples against the matching package.
- Point to source modules or upstream guides instead of copying overloads, option catalogs, and implementation details.
- Retain warnings about data loss, cancellation, and resource lifetime when source discovery alone would make the risk easy to miss.
- Apply clear-voice to skill prose. Do not hide instructions or remove needed guidance to satisfy a generic document-length limit.

## Review baseline

The API review used stable `effect@4.1.2` on 2026-11-07 ([reviewed source](https://github.com/Effect-TS/effect/tree/506eef143bcc1750ce58920aac1e45da7265d103)). This records what was checked, not a version requirement for applications.
