---
name: setup-macklinu-machine
description: Configure the local GitHub App RSA PEM path and installation IDs for macklinu-machine, and add its instruction to the current Git repository. Use for first-time setup, legacy migration, or a new checkout.
compatibility: macOS only. Requires Node.js 22+, pnpm 10.2+ (pnpx), and Git.
---

# Set up macklinu-machine

Stay in the target Git checkout. Setup validates an existing local GitHub App RSA PEM; it stores only its path and installation IDs. It does not copy the key, call a credential provider, or use GitHub authentication. An SSH-agent or general OpenSSH key is not the App PEM.

Resolve `scripts/setup.ts` to an absolute path from this checked-out or installed skill; global installation is not required. First run with no arguments. Valid existing configuration is reused without reading stdin or replacing its path or custom IDs; setup still adds the checkout instruction.

```sh
pnpx --allow-build=esbuild tsx@4.23.15 /absolute/path/to/setup-macklinu-machine/scripts/setup.ts
```

If setup reports a missing App PEM path, ask the user for the **real local file path**, never key contents. `~/.config/macklinu-machine/private-key.pem` is a suggested location, not an existing file assumption. Do not infer a path from examples or export a vault key. Rerun the same command with `--key-path-stdin`, supplying the path through captured stdin, not arguments, an echoed command, or shell history. Missing/legacy configuration accepts `~/` expanded against `$HOME`, or a relative path resolved from the current directory; it stores an absolute path. Other `~` forms are rejected. The script asks no questions and reads stdin only with that flag and no configured path.

An invalid configured path stops; correct it in private local configuration, then rerun. Setup never replaces an existing `private_key_path` with stdin input.

Use this tested version pin and a trusted package source. `pnpx` can fetch and execute third-party code; the pin does not lock transitive dependencies. The esbuild allowance applies only to the isolated pnpx cache, not project/global build policy. `tsx` executes TypeScript without type checking.

Setup atomically saves `$HOME/.config/macklinu-machine/config.json` with `private_key_path` and the `installation_ids` owner-to-positive-safe-integer map. It fills missing public defaults for `macklinu` and `fairfield-consulting`, preserves custom IDs and other fields, and removes legacy `private_key_reference` only after successful PEM validation. A legacy reference cannot establish a local path. Valid complete configuration needs no rewrite. Directory/file modes are `0700`/`0600`; configuration symlinks and unsafe root `AGENTS.md` targets are rejected.

The PEM must be a readable, unencrypted RSA private key in PEM format, with no group/other file permissions (normally `0600` or `0400`). Its immediate directory must not be group/other-writable; neither may be a symlink. Setup validates but does not change the key or its directory. Keep actual paths, configuration, key contents and former provider metadata out of logs, responses and tracked files.

It preserves root `AGENTS.md` and adds this instruction once:

> Before using the `gh` CLI, always read and follow the `/macklinu-machine` skill.

Report readiness or the fixed error, not configuration contents. If saving succeeds but the instruction update fails, fix the cause and rerun setup without path input. For authorized publication, follow `/macklinu-machine`.
