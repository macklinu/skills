---
name: setup-macklinu-machine
description: Configure the local 1Password key reference and installation IDs for macklinu-machine, and add its instruction to the current Git repository. Use for first-time setup or a changed reference.
compatibility: macOS only. Requires Node.js 22+, pnpm 10.2+ (pnpx), and Git.
---

# Set up macklinu-machine

Stay in the target Git checkout. Setup stores a reference, not a key; it does not read 1Password or use GitHub credentials.

Ask for the App key field's **Copy Secret Reference** from 1Password, never key contents or separate account/vault/item details. Reuse only validated local configuration. Do not infer a real reference from chat examples: syntax validation does not prove that the item exists. Never repeat the real reference or private metadata in responses, logs, repository files, or commits.

Resolve `scripts/setup.ts` to an absolute path from this checked-out or installed skill; global installation is not required. Supply the actual reference through the tool's captured stdin, not arguments, an echoed command, or shell history. Disable shell tracing. The script takes no arguments and asks no questions.

```sh
pnpx --allow-build=esbuild tsx@4.23.15 /absolute/path/to/setup-macklinu-machine/scripts/setup.ts
```

Use this tested version pin and a trusted package source. `pnpx` can fetch and execute third-party code; the pin does not lock transitive dependencies. The esbuild allowance applies only to the isolated pnpx cache, not project/global build policy. `tsx` executes TypeScript without type checking.

Setup atomically writes `$HOME/.config/macklinu-machine/config.json` with `private_key_reference` and the owner-to-ID `installation_ids` object. It fills missing public defaults for `macklinu` and `fairfield-consulting`, preserves custom IDs and other fields, and sets directory/file modes to `0700`/`0600`. To change an installation, edit its positive integer ID locally. Never copy the real configuration into a repository. Configuration symlinks and a symlink root `AGENTS.md` are rejected.

It preserves root `AGENTS.md` and adds this instruction once:

> Before using the `gh` CLI, always read and follow the `/macklinu-machine` skill.

Report success or the fixed error, not configuration contents. If saving succeeds but the instruction update fails, fix the cause and rerun setup. For publication, follow `/macklinu-machine`; key access can require user approval for that CLI session, not a different working directory.
