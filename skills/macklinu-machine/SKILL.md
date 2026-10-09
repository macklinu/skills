---
name: macklinu-machine
description: Use the macklinu-machine GitHub App identity for GitHub API and PR commands, Git commits, and HTTPS pushes in macklinu or fairfield-consulting repositories. Use when asked to publish as the machine, or when the repository AGENTS.md requires this identity. Do not use personal GitHub credentials for these operations.
compatibility: Requires Fish and Git. GitHub commands and pushes also require jq, the 1Password CLI (op), GitHub CLI (gh), and the Link-/gh-token extension.
---

# macklinu-machine

Publish with the GitHub App, not the user's personal GitHub account. Use the bundled `scripts/run.fish`; do not reproduce its authentication commands in an agent shell.

## Public identity

| Setting | Value |
| --- | --- |
| App ID | `5252838` |
| Installation for `macklinu` | `169669532` |
| Installation for `fairfield-consulting` | `169669603` |
| Git author and committer | `macklinu-machine[bot]` |
| Git author and committer email | `340227694+macklinu-machine[bot]@users.noreply.github.com` |
| GitHub host | `github.com` |

These are public identifiers. The 1Password account, vault, item, field, IDs, and private-key reference are private. Never put them in repository files, issues, PRs, logs, examples, or command output.

## Local configuration

The only configuration file is `$HOME/.config/macklinu-machine/config.json`. Its `private_key_reference` value is a string that points to the private key in 1Password. The reference has this generic form: `op://<vault>/<item>/<field>`.

The script reads the reference with `jq` and captures it. It does not print it. This Fish example shows the same capture pattern; it is not a separate publishing workflow:

```fish
set --global --unexport fish_trace ''
set --local --unexport private_key_reference (jq --exit-status --raw-output \
    '.private_key_reference | strings | select(test("^op://[^/[:cntrl:]]+/[^/[:cntrl:]]+/[^/[:cntrl:]]+$"))' \
    "$HOME/.config/macklinu-machine/config.json" 2>/dev/null)
set --local config_status $status
# Check config_status before using the captured value. Never echo it.
set --erase private_key_reference
```

If configuration is missing or invalid, use `/setup-macklinu-machine`. Do not ask for the key, copy it into the checkout, or fall back to personal authentication. The runtime does not write or change local configuration.

## Workflow

1. Read the checkout's `AGENTS.md` and identify its `OWNER/REPO`. Only `macklinu` and `fairfield-consulting` owners are supported.
2. Keep the working directory in that repository's Git checkout. Use the same target for Git commits, pushes, and GitHub API or PR commands.
3. Resolve `scripts/run.fish` to its absolute path from this installed skill's location. Do not assume the skill is inside the target checkout. The absolute path in the examples below is a placeholder; replace it with the resolved path.
4. Invoke the script with `fish --no-config`, the target, an operation, and its arguments. Do not omit the command or arguments.
5. Stop if authentication fails. Do not run the publishing command again with personal credentials. Each separate authenticated invocation obtains a new token; there is no retry or cache.

Do not change `GH_TOKEN`, `GH_HOST`, or `GH_REPO` to bypass the script. Do not use conflicting repository or host flags, cross-repository URLs, API endpoints for another repository, `gh auth login`, or `gh auth setup-git`. The script rejects `-R`, `--repo`, and `--hostname` overrides. Keep the target repository in API endpoint paths. Do not pass a different push destination or flags that change it.

### GitHub PR and API commands

```sh
fish --no-config /absolute/path/to/macklinu-machine/scripts/run.fish macklinu/example-repo gh pr create --title 'Describe the change' --body 'Describe the result'
fish --no-config /absolute/path/to/macklinu-machine/scripts/run.fish macklinu/example-repo gh pr edit 123 --body 'Updated description'
fish --no-config /absolute/path/to/macklinu-machine/scripts/run.fish macklinu/example-repo gh pr view 123
fish --no-config /absolute/path/to/macklinu-machine/scripts/run.fish fairfield-consulting/example-repo gh api repos/fairfield-consulting/example-repo/pulls
```

For each `gh` operation, the script selects the owner's explicit installation, reads the private key with `op read`, and checks that command's own exit status. It holds the key only in a non-exported Fish variable, then feeds it to `gh token generate --app-id 5252838 --installation-id ID` through `psub --fifo`. Token JSON is captured and the nonempty token is read with `jq`.

Fish's default `psub` writes a regular file; this script explicitly uses a FIFO instead. The documented safe FIFO limit is 8 KiB, and the RSA-2048 PEM fits within it. Fish removes the FIFO after the generation command exits. The script erases the key variable after generation. It never saves a PEM or token to a regular file.

The fresh token is scoped to the child command with `GH_TOKEN`, `GH_REPO`, and `GH_HOST=github.com`. Configuration, 1Password, token-generation, and token-parsing failures stop before the requested command runs. Error messages are generic; private references and authentication stderr are not printed. Inherited Fish tracing is disabled before private data is read.

### Git commits

Stage the intended files with normal Git commands, then commit through the script:

```sh
fish --no-config /absolute/path/to/macklinu-machine/scripts/run.fish macklinu/example-repo commit -m 'Describe the change'
```

The child `git commit` receives the bot's `GIT_AUTHOR_NAME`, `GIT_AUTHOR_EMAIL`, `GIT_COMMITTER_NAME`, and `GIT_COMMITTER_EMAIL`. It needs no configuration, private key, 1Password access, or token. Do not override the author with a different `--author` value. When amending a commit, include `--reset-author` so Git does not retain the previous author.

### Git pushes

```sh
fish --no-config /absolute/path/to/macklinu-machine/scripts/run.fish macklinu/example-repo push HEAD
fish --no-config /absolute/path/to/macklinu-machine/scripts/run.fish fairfield-consulting/example-repo push HEAD:refs/heads/example-branch --force-with-lease
```

The script obtains a fresh token and runs `git push` against the explicit `https://github.com/OWNER/REPO.git` URL. Refs and flags follow that destination. Per-command Git options first clear credential helpers, then use `!gh auth git-credential` with the child token. Personal credential helpers and interactive credential prompts cannot supply fallback credentials. Authorization extra headers are cleared for this command as well.

No token cache, daemon, saved PEM, Git credential store, global Git identity change, remote edit, or permanent credential-helper change is used. Do not configure URL rewrites that replace the explicit HTTPS destination with SSH or a different host. The script returns the downstream command's exit status.

Sources: [Fish FIFO behavior](https://fishshell.com/docs/current/cmds/psub.html), [gh-token interface](https://github.com/Link-/gh-token), and [Git credential helpers](https://git-scm.com/docs/gitcredentials).
