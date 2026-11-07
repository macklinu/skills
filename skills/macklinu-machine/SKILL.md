---
name: macklinu-machine
description: Use your normal GitHub login for everyday commands and the machine identity for commits, new issues and PRs, and comments.
compatibility: macOS/Linux, Node.js 22+, pnpm 10.2+, and Git; machine publication needs gh and a configured GitHub App RSA PEM.
---

# macklinu-machine

Use normal Git and `gh` authentication by default. Commit attribution is separate from the login used to read or push a repository.

| Task | How to run it |
| --- | --- |
| Create or amend a commit | Use the runner's `commit` operation for bot author and committer attribution. |
| Open an issue or PR | Use the runner's `gh issue create` or `gh pr create` operation. |
| Post a comment or reply, or edit a bot-owned comment | Use the runner's `gh issue comment`, `gh pr comment`, or repository `gh api` operation. |
| Everything else | Use normal `git` or `gh` with your existing login. |

Reads, checks, review requests, PR metadata edits, uploads, and extensions need no machine runner or App configuration. Authentication does not grant permission to merge, approve, or make destructive changes.

## Use the runner

Read the checkout's `AGENTS.md` and identify `OWNER/REPO`. The runner supports `macklinu` and `fairfield-consulting` repositories. Resolve `scripts/run.ts` from this checked-out or installed skill, and run it from the target checkout.

```sh
pnpx --allow-build=esbuild tsx@4.23.15 /absolute/path/to/macklinu-machine/scripts/run.ts OWNER/REPO OPERATION ARGS...
```

Stage intended files before `commit -m 'Describe the change'`. Include `--reset-author` when amending or reusing a message, rather than overriding `--author`.

Both author and committer should be `macklinu-machine[bot] <340227694+macklinu-machine[bot]@users.noreply.github.com>`. Commits need no App configuration or key.

For REST replies, put the repository endpoint immediately after `api`, such as `gh api repos/{owner}/{repo}/pulls/42/comments/123/replies -f body='Reply'`.

## Credentials

Use `/setup-macklinu-machine` if App configuration is missing. Keep keys, tokens, and private configuration out of logs and published content.

The runner scopes App credentials to the target repository without changing your normal login. If machine publication fails, stop that operation rather than publishing the same content as you. Unrelated commands can continue with normal authentication.

## Verify runner changes

```sh
pnpx --allow-build=esbuild tsx@4.23.15 --test skills/macklinu-machine/scripts/run.test.ts
```

Run from the skills repository root. `tsx@4.23.15` is the tested version; check types separately.
