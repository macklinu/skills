---
name: setup-macklinu-machine
description: Configure the local 1Password key reference and installation IDs for macklinu-machine, and add its instruction to the current Git repository. Use for first-time setup, a changed reference, or migration from the Fish workflow.
compatibility: Requires Node.js 22.18+ and Git.
---

# Set up macklinu-machine

Run from the target Git checkout. Setup does not read the key or use GitHub credentials. Publishing later also needs `op` and `gh`, but not Fish, jq, or `gh-token`.

## Ask one question

> Where is the GitHub App private key stored in 1Password?

Ask for an `op://<vault>/<item>/<field>` reference, never key contents or separate account/vault/item details. Do not repeat the real reference in responses, logs, repository files, or commits.

## Run setup

Resolve `scripts/setup.ts` to its absolute path from this installed skill. Run it with Node from the checkout. Supply the reference on stdin through the tool's input channel, not in arguments, an echoed command, or shell history. Disable shell tracing. The script takes no arguments and asks no questions.

Example with generic input only:

```sh
node /absolute/path/to/setup-macklinu-machine/scripts/setup.ts <<'REFERENCE'
op://<vault>/<item>/<field>
REFERENCE
```

Setup writes `$HOME/.config/macklinu-machine/config.json` atomically with `private_key_reference` and an owner-to-ID `installation_ids` object. It adds the public defaults (`macklinu`: `169669532`, `fairfield-consulting`: `169669603`), preserves custom IDs and other fields, and sets directory/file modes to `0700`/`0600`. To change an installation, edit its positive integer ID in this local file. On Windows, also restrict access with local ACLs. Never copy the real file into a repository. Symlink configuration paths and a symlink root `AGENTS.md` are rejected.

Setup preserves root `AGENTS.md` and adds this line once:

> Before using the `gh` CLI, always read and follow the `/macklinu-machine` skill.

Report success or the fixed error message, never configuration contents. If setup fails after saving configuration, the repository instruction might still need an update; rerun setup after fixing the cause.
