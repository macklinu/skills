---
name: setup-macklinu-machine
description: Configure the local 1Password private-key reference for the macklinu-machine GitHub App and add its gh instruction to the current Git repository. Use for first-time setup or to change the stored private-key reference.
---

# Set up macklinu-machine

Use this skill from the target Git checkout. Setup needs Fish, jq, and Git. Later, `/macklinu-machine` also needs the 1Password CLI (`op`), GitHub CLI (`gh`), and `gh-token`.

## Ask one question

Ask exactly one question:

> Where is the GitHub App private key stored in 1Password?

Tell the user to supply an `op://<vault>/<item>/<field>` secret reference, never the private-key contents. Do not ask for the account, vault, item, or field separately. Do not repeat the supplied reference in responses, command output, repository files, or commits. Do not read the private key during setup.

## Run setup

Resolve `scripts/setup.fish` relative to this installed skill and use its absolute path. Keep the caller's working directory in the target Git checkout. Pass the supplied reference as the only argument, with shell quoting that preserves spaces and does not evaluate its contents. Disable shell tracing and do not echo the command or reference.

Usage example with a generic reference:

```sh
fish --no-config "/absolute/path/to/setup-macklinu-machine/scripts/setup.fish" 'op://<vault>/<item>/<field>'
```

The script runs without questions. It stores `private_key_reference` in `$HOME/.config/macklinu-machine/config.json`, preserves other existing object fields, and sets directory/file permissions to `0700`/`0600`. It does not require 1Password sign-in or GitHub authentication.

It preserves the repository's root `AGENTS.md` and adds this instruction once:

> Before using the `gh` CLI, always read and follow the `/macklinu-machine` skill.

If setup fails, report its fixed error message without the reference. On success, report that local configuration and the repository instruction are ready. Do not include the configuration contents.
