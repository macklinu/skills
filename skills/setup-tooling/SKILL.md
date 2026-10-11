---
name: setup-tooling
description: Create a pnpm 12 and Turborepo monorepo, or add Oxlint, Oxfmt, Lefthook, and local skills to an existing repository without changing its structure. Hand off project choices to Matt Pocock's setup.
---

# Setup tooling

Read repository instructions and `macklinu-code-style` first. Inspect manifests, pins, lockfiles, configs, ignores, local skills, and Git hooks before changing them.

## Fresh project: pnpm 12 + Turborepo

Use a framework-neutral monorepo unless project context specifies an application stack. Follow the [pnpm workspace guide](https://pnpm.io/workspaces) and [Turborepo structure guide](https://turborepo.dev/docs/crafting-your-repository/structuring-a-repository); do not select a framework starter.

```sh
pnpm init --no-init-package-manager
```

Require pnpm 12 and compatible Node/tool versions. Make the new root private and set `packageManager` to the exact selected pnpm 12 version. The init flag avoids an implicit registry upgrade. Remove only its generated failing test script; do not force TypeScript 7 or Vitest.

Declare `apps/*` and `packages/*` under `packages` in `pnpm-workspace.yaml`. Put applications in `apps/` and libraries/tooling in `packages/`, with unique package names and `workspace:*` for internal dependencies. Create only needed packages, not fake applications.

```sh
pnpm add -D -w --allow-build=lefthook turbo oxlint oxfmt lefthook
```

Create root `turbo.json` using the [task guide](https://turborepo.dev/docs/crafting-your-repository/configuring-tasks). Start with:

```json
{
  "$schema": "https://turborepo.dev/schema.json",
  "tasks": {
    "build": { "dependsOn": ["^build"], "cache": false }
  }
}
```

Register real package scripts only. Enable build caching after declaring their actual output globs; unknown outputs must not produce incomplete cache restores. Add root `build: "turbo run build"`. Keep repository-wide OxC checks at the root rather than duplicating them in every package.

## Existing repository: preserve its structure

Keep its package manager, pins, lockfiles, layout, package type, scripts, and workspace/build conventions. Do not add Turborepo, move packages, initialize a manifest, or convert to a monorepo unless requested.

Add only missing `oxlint`, `oxfmt`, and `lefthook` development dependencies with its package manager. For pnpm, use `pnpm add -D --allow-build=lefthook` with the missing names, adding `-w` only at a workspace root. Preserve existing dependency versions and build permissions, including explicit denials. Group script/tool conflicts into one migration decision; do not keep competing active tools.

## Shared tooling

- Inspect hook ownership and `core.hooksPath` before allowing Lefthook's postinstall. Preserve foreign hooks; do not use `--force`, reset hook paths, approve unrelated builds, or change global policy.
- Run `oxlint --init` and `oxfmt --init` through the local package-manager executor only when no supported root config exists. Reuse JSONC/JS/TS variants and preserve rules/style; Oxlint init can overwrite files.
- Merge tool ignores for `vendor/**`, `repos/**`, installed third-party skills, and actual generated output. Append missing Node/output rules to `.gitignore`, including `.turbo/` when used. Do not ignore lockfiles or tracked source.

Add unused script names; preserve working scripts and intentional existing workspace boundaries:

| Script         | Command                                 |
| -------------- | --------------------------------------- |
| `lint`         | `oxlint --disable-nested-config .`      |
| `format`       | `oxfmt --write --disable-nested-config` |
| `format:check` | `oxfmt --check --disable-nested-config` |

Merge Lefthook jobs instead of replacing configuration. For pnpm, use sequential staged-file jobs:

```yaml
pre-commit:
  commands:
    format:
      glob: "*.{js,mjs,cjs,jsx,ts,mts,cts,tsx,json,jsonc,md,mdx,yml,yaml,css,scss,html,vue}"
      run: pnpm exec oxfmt --write --disable-nested-config --no-error-on-unmatched-pattern -- {staged_files}
      stage_fixed: true
    lint:
      glob: "*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}"
      run: pnpm exec oxlint --disable-nested-config --no-error-on-unmatched-pattern -- {staged_files}
```

Adapt executors for an existing package manager. Follow [Lefthook staged-file handling](https://lefthook.dev/configuration/run/) and [stage_fixed](https://lefthook.dev/configuration/stage_fixed/); do not add manual stash/staging commands or disable its guard. Partial staging needs Git history: use complete intended files for the first commit. Validate configuration and install without force using the local Lefthook CLI; its postinstall is not proof that hooks installed.

## Local skills and project handoff

Follow the [Skills CLI guide](https://github.com/vercel-labs/skills#readme). Before running these commands, append explicit `--agent` targets for only this project's active agents, using supported names. Use project scope, omit already-installed skills, and preserve customized destinations: the CLI can auto-confirm replacement. Never use `--all` or `--global`.

```sh
npx --yes skills@latest add github/awesome-copilot --skill conventional-commit --yes
npx --yes skills@latest add macklinu/skills --skill macklinu-code-style pr-description --yes
npx --yes skills@latest add mattpocock/skills --skill setup-matt-pocock-skills grill-with-docs grilling domain-modeling codebase-design to-spec to-tickets implement-spec implement tdd code-review triage writing-for-agents --yes
```

Read the installed skills and their references. Reuse this setup skill; add domain/machine skills only when applicable and publicly available. Exclude `todo-txt` and `obsidian-inbox-triage`. Do not activate an alternative hook setup. If an existing pnpm engine contract rejects npx, use `pnpm dlx skills@latest` with the same arguments; do not weaken that contract.

Run lint/format checks, validate and exercise the actual hook, and list local skills. For fresh projects, run real workspace builds and verify dependency order and output handling; a zero-task run is not build proof. Run existing type/test checks when applicable. On reruns, skip initializers and skill reinstalls; use the existing lockfile without upgrades and verify preservation. Do not reformat unrelated user work.

Give one grouped handoff: tooling evidence, installed/reused skills, and pending project choices. Installation is not Matt configuration. Reuse confirmed configuration only when valid; otherwise ask the user to invoke **`/setup-matt-pocock-skills`** and follow its [living setup instructions](https://github.com/mattpocock/skills/blob/main/skills/engineering/setup-matt-pocock-skills/SKILL.md). Let it confirm tracker, applicable domain layout, labels, instruction-file choices, and the draft; do not copy its questionnaire.

Report configuration pending until choices and required access are confirmed. Treat tracker writes and label creation as real side effects. Only then offer `/grill-with-docs`; do not automatically run it or create issues, product specs, or domain docs.

Do not commit, publish, or install globally unless authorized. Use current [pnpm install/build-approval guidance](https://pnpm.io/cli/add), [Oxlint CLI](https://oxc.rs/docs/guide/usage/linter/cli), [Oxfmt CLI](https://oxc.rs/docs/guide/usage/formatter/cli.html), and [Lefthook install guidance](https://lefthook.dev/usage/commands/install/) rather than copied API rules.
