---
name: macklinu-machine
description: Use the macklinu-machine GitHub App for PR/API commands, commits, and HTTPS pushes in macklinu or fairfield-consulting repositories when asked to publish as the machine or when AGENTS.md requires it. Existing personal authentication is allowed for routine Git reads, gh stack, and the image-upload exception below.
compatibility: Requires macOS or Linux, Node.js 22+, pnpm 10.2+ (pnpx), and Git; machine publication also needs gh and a local GitHub App RSA PEM.
---

# macklinu-machine

Before using the runner, read the target checkout's `AGENTS.md` and identify `OWNER/REPO`; only `macklinu` and `fairfield-consulting` are supported. Stay in that checkout and resolve `scripts/run.ts` to an absolute path from this checked-out or installed skill. Global installation is not required; do not copy its authentication commands into an agent shell.

```sh
pnpx --allow-build=esbuild tsx@4.23.15 /absolute/path/to/macklinu-machine/scripts/run.ts OWNER/REPO OPERATION ARGS...
```

| Operation | Prerequisites |
| --- | --- |
| `commit` | Git; no machine configuration, key, or token. |
| `gh pr`, `gh api`, `push` | Private local configuration, a readable App RSA PEM, and `gh`. |
| `gh stack` | The official `github/gh-stack` extension and the existing active, valid `macklinu` login on `github.com`; no App configuration, key, or token. |

## Routine Git reads

Use normal `git clone`, `git fetch`, and `git pull` with the repository's existing authentication, including configured personal credentials. If requested, `gh repo clone` may use the existing GitHub CLI authentication. These reads do not require the machine runner or App configuration unless repository instructions explicitly require a particular identity for reads.

For a requested update to main, check local changes, then run `git pull --ff-only origin main`. Try the standard command before treating authentication as blocked. Escalate only an observed failure, a concrete risk to local work, or an explicit instruction that prevents the operation.

A missing runner operation is not a Git limitation. Do not extend the runner, alter authentication configuration, or ask the user to choose an authentication path merely because the runner lacks a read operation.

## Commands

- Stage only intended files, then use `commit -m 'Describe the change'`. Do not override `--author`. Include `--reset-author` when amending or reusing a commit message. Verify both author and committer as `macklinu-machine[bot] <340227694+macklinu-machine[bot]@users.noreply.github.com>`.
- Use `gh pr` with its normal subcommand and arguments, such as `gh pr view 9`. For repository REST calls, put the endpoint immediately after `api`, such as `gh api repos/{owner}/{repo}/pulls`.
- Use `push HEAD:refs/heads/BRANCH` to update the intended branch at `https://github.com/OWNER/REPO.git`. Refs and normal push flags follow the operation. Do not change the destination, transport, or submodule behavior. Remove Git URL rewrites before pushing.

For runner operations, use the same repository throughout. No cross-repository URLs/endpoints, repository/host overrides, replacement authentication headers, or verbose HTTP logging. Auth commands, other extensions, aliases, and other `gh` commands remain blocked by the runner.

Stop on machine authentication failure. Routine Git reads do not authorize retrying a failed machine command with personal credentials; only the exceptions below permit personal publication.

## Stack exception

Use the runner's existing `gh` operation for repository-scoped `gh stack *` commands, including `link`, `init`, `view`, `rebase`, and `sync`. Only the official `github/gh-stack` extension may use this path. Follow its installed help and the user's requested operation; this exception does not authorize unrelated stack mutations.

```sh
pnpx --allow-build=esbuild tsx@4.23.15 /absolute/path/to/macklinu-machine/scripts/run.ts OWNER/REPO gh stack view
pnpx --allow-build=esbuild tsx@4.23.15 /absolute/path/to/macklinu-machine/scripts/run.ts OWNER/REPO gh stack link https://github.com/OWNER/REPO/pull/42
```

The runner first checks `gh auth status --active --hostname github.com` with JSON restricted to host, login, active-account state, and authentication status. It requires exactly one active, valid `macklinu` account before starting the extension. Both children receive `GH_HOST=github.com` and `GH_REPO=OWNER/REPO`, which takes precedence over remote-based repository discovery.

Inherited `GH_*TOKEN`, `GITHUB_*TOKEN`, debugging, and Git tracing settings are removed only from child environments; the parent environment is unchanged. This path never reads the App PEM or requests an installation token.

To link existing PRs, pass full `https://github.com/OWNER/REPO/pull/NUMBER` URLs for every PR, in the order required by installed help. Numeric arguments can resolve as local branches or stack IDs, which can push branches or create PRs instead of only linking existing PRs. Full repository-scoped PR URLs select existing-PR handling; the runner rejects other stack URL forms.

Stack metadata and recovery journals live in Git's common directory and are shared across linked worktrees. Coordinate mutations across the clone; do not treat a fresh worktree as an isolated stack catalog. Use deterministic tests, not live stack mutations, to verify this runner.

Keep commits on the runner's `commit` path rather than stack commit shortcuts. Pushes and PR changes performed by a requested stack command use the personal login; standalone pushes, PR creation, review requests, review replies, and other GitHub commands still use machine authentication.

Do not switch logins, output/copy/store tokens, change global authentication state, or fall back to personal authentication for a failed machine command. Stop if account verification or the stack command fails.

## Image-upload exception

Outside the stack exception, keep commits, pushes, PR creation, review replies, review requests, and all other publication machine-authenticated. Only image attachment uploads unsupported by CLI App authentication may use the existing active `macklinu` login on `github.com`. Accept a reported `unsupported authentication type` error without repeating the failed upload.

- Follow installed CLI help for syntax. Prefer a separate user-authenticated image upload and machine-authenticated URL insertion only if help documents standalone attachment uploads. Otherwise, create the PR through the runner without attachments, verify its machine author, then allow only an image-only body edit on that existing PR through the user login. Preserve all non-image content; change no other PR fields.
- For the account check and upload/edit, use direct `gh` children, not the runner. Remove inherited `GH_TOKEN`, `GITHUB_TOKEN`, `GH_ENTERPRISE_TOKEN`, `GITHUB_ENTERPRISE_TOKEN`, `GH_DEBUG`, and `DEBUG` only from those children; target the same repository and host explicitly. Follow `gh auth status --help` to verify the active login is `macklinu` on `github.com` and authentication is valid. Output only host, login, and status fields, never tokens.
- Stop if the expected login is unavailable or an operation fails. Do not switch logins, copy/store personal tokens, change global authentication state, or use this exception as a generic failure fallback. Return to the runner for all remaining publication.

## Private configuration and credentials

`$HOME/.config/macklinu-machine/config.json` uses this contract:

| Field | Constraint |
| --- | --- |
| `private_key_path` | Absolute local path to an unencrypted GitHub App RSA PEM, not an SSH-agent or OpenSSH key. |
| `installation_ids` | Object mapping owners to positive safe-integer installation IDs; the target owner must be present. |

Use `/setup-macklinu-machine` for missing or legacy configuration. Keep the config directory/file at `0700`/`0600`.

The key must be an owner-readable regular file with no group/other permission bits (normally `0600` or `0400`); its immediate directory must not be group/other-writable. Config/key files and their immediate directories must not be symlinks. The runner never rewrites them.

App and installation IDs are public identifiers, not credentials. The PEM is a credential; its actual path and local configuration are private metadata. Never include them, JWTs, tokens, or former provider metadata in source, logs, issues, PRs, or output.

Machine publication reads the configured PEM, signs an App JWT in memory, and requests a fresh token limited to the named repository. The child receives `GH_TOKEN`, `GH_REPO`, and `GH_HOST=github.com`; inherited personal tokens and Git/gh tracing are removed.

Pushes clear generic and URL-specific credential helpers and extra headers, then use `gh auth git-credential` with that token. Interactive fallback and submodule pushes are disabled. Failures return fixed errors; downstream exit status is preserved.

No key copy, token file/cache, retry, or permanent Git change is created. The PEM buffer is cleared after signing, but JavaScript/crypto copies can remain.

The local key deliberately trusts the same user: tools, hooks, editors, pagers, process inspection and memory dumps can expose credentials. This is not a sandbox.

Tokens can remain valid for up to one hour. Keep App permissions and installed repositories at the minimum needed.

## Runner and verification

Use the tested `tsx@4.23.15` pin. `pnpx` can fetch and execute third-party code; the pin does not lock transitive dependencies or remove package-source risk. `--allow-build=esbuild` permits only tsx's build dependency in the isolated pnpx cache, not project/global build policy.

Trust the runner and package source. Do not enable shell tracing, debugging, or extra diagnostic loaders around credentials.

From this skills repository's root:

```sh
pnpx --allow-build=esbuild tsx@4.23.15 --test skills/macklinu-machine/scripts/run.test.ts
```

`tsx` runs TypeScript but does not type-check; check types separately.

Sources: [tsx](https://tsx.hirok.io/getting-started), [pnpx build policy](https://pnpm.io/cli/dlx), [App JWTs](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-json-web-token-jwt-for-a-github-app), [installation tokens](https://docs.github.com/en/rest/apps/apps#create-an-installation-access-token-for-an-app), and [Git helpers](https://git-scm.com/docs/gitcredentials).

Stack sources: [official gh-stack commands and shared worktree metadata](https://github.com/github/gh-stack#commands), [authentication status JSON](https://cli.github.com/manual/gh_auth_status), and [go-gh repository discovery and GH_REPO precedence](https://github.com/cli/go-gh/blob/trunk/pkg/repository/repository.go).
