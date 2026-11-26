---
name: setup-macklinu-machine
description: Set up the local GitHub App RSA PEM path, installation IDs, and repository instruction for macklinu-machine. Use for first-time setup, legacy migration, or a new checkout.
compatibility: macOS only; requires Node.js 22+, pnpm 10.2+ (pnpx), and Git
---

# Set up macklinu-machine

Run setup from the target Git checkout. Setup validates an existing local GitHub App RSA PEM and stores only its path and installation IDs.

It does not copy the key, call a credential provider, or use GitHub authentication.

## First run

Resolve `scripts/setup.ts` to an absolute path from the checked-out or installed skill. No global installation is required. Run it without arguments:

```sh
pnpx --allow-build=esbuild tsx@4.23.15 /absolute/path/to/setup-macklinu-machine/scripts/setup.ts
```

Setup reuses valid configuration without reading stdin or replacing the path or custom IDs. It preserves the root `AGENTS.md` and adds this instruction once:

> Before using the `gh` CLI, always read and follow the `/macklinu-machine` skill.

<details>
<summary>Runner and package source</summary>

Use the tested version pin above and a trusted package source. `pnpx` can fetch and execute third-party code, and the pin does not lock transitive dependencies.

The esbuild allowance applies only to the isolated `pnpx` cache, not project or global build policy. `tsx` executes TypeScript without type checking.

</details>

## Missing path

If setup reports a missing App PEM path:

1. Ask the user for the **real local file path**, never the key contents. Do not infer a path from examples or export a vault key.
2. Rerun the same command with `--key-path-stdin`. Pass the path through captured stdin, not arguments, an echoed command, or shell history.

`~/.config/macklinu-machine/private-key.pem` is a suggested location, not an assumed file. A legacy `private_key_reference` does not supply a local path.

Setup never prompts. It reads stdin only with the flag and no configured path.

Setup expands `~/` against `$HOME`, rejects other `~` forms, and resolves relative paths from the current directory. It stores an absolute path.

## Invalid configured path

If the configured path is invalid, setup stops. Set `private_key_path` to a valid absolute path in the private local configuration, then rerun without arguments. Stdin cannot replace an existing `private_key_path`.

## Recovery after partial setup

If setup saves configuration but cannot update `AGENTS.md`, fix the cause and rerun without path input.

<details>
<summary>PEM validation, configuration, and migration</summary>

### PEM validation

- Use a readable, unencrypted RSA private key in PEM format. An SSH-agent or general OpenSSH key is not the App PEM.
- The PEM must have no group or other permissions (normally `0600` or `0400`).
- The immediate directory must not be writable by group or others. Neither the file nor its immediate directory may be a symlink.

Setup does not change the PEM or its directory.

### Configuration and migration

Setup saves `$HOME/.config/macklinu-machine/config.json` atomically when it needs to write configuration. It stores `private_key_path` and `installation_ids`, a map from owners to positive safe integers.

- Setup fills missing public defaults for `macklinu` and `fairfield-consulting`. It preserves custom IDs and other fields.
- Setup removes the legacy `private_key_reference` only after successful PEM validation. It does not rewrite valid, complete configuration.
- Setup sets the configuration directory to `0700` and the file to `0600`. It rejects configuration symlinks and unsafe root `AGENTS.md` targets.

</details>

## Reporting

Report readiness or the script's fixed error message. Keep actual paths, configuration, key contents, and former provider metadata out of logs, responses, and tracked files.

For authorized publication, follow `/macklinu-machine`.
