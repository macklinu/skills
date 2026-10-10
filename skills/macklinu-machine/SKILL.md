---
name: macklinu-machine
description: Use the macklinu-machine GitHub App for PR/API commands, commits, and HTTPS pushes in macklinu or fairfield-consulting repositories. Use when asked to publish as the machine or when AGENTS.md requires it. Never fall back to personal credentials.
compatibility: macOS only. Requires Node.js 22+, pnpm 10.2+ (pnpx), and Git; publication also needs gh and a local GitHub App RSA PEM.
---

# macklinu-machine

Read the target checkout's `AGENTS.md` and identify `OWNER/REPO`; only `macklinu` and `fairfield-consulting` are supported. Stay in that checkout. Resolve `scripts/run.ts` to an absolute path from this checked-out or installed skill. Global installation is not required. Do not copy its authentication commands into an agent shell.

```sh
pnpx --allow-build=esbuild tsx@4.23.15 /absolute/path/to/macklinu-machine/scripts/run.ts OWNER/REPO OPERATION ARGS...
```

| Operation | Prerequisites |
| --- | --- |
| `commit` | Git; no machine configuration, key, or token. |
| `gh pr`, `gh api`, `push` | Private local configuration, a readable App RSA PEM, and `gh`. |

## Commands

- Stage only intended files, then use `commit -m 'Describe the change'`. Do not override `--author`. Include `--reset-author` when amending or reusing a commit message. Verify both author and committer as `macklinu-machine[bot] <340227694+macklinu-machine[bot]@users.noreply.github.com>`.
- Use `gh pr` with its normal subcommand and arguments, such as `gh pr view 9`. For repository REST calls, put the endpoint immediately after `api`, such as `gh api repos/{owner}/{repo}/pulls`.
- Use `push HEAD:refs/heads/BRANCH` to update the intended branch at `https://github.com/OWNER/REPO.git`. Refs and normal push flags follow the operation. Do not change the destination, transport, or submodule behavior. Remove Git URL rewrites before pushing.

Use the same repository for every operation. No cross-repository URLs/endpoints, repository/host overrides, replacement authentication headers, or verbose HTTP logging. Auth commands, extensions, and other `gh` commands are blocked. Stop on authentication failure; do not retry with personal credentials.

## Private configuration and credentials

`$HOME/.config/macklinu-machine/config.json` uses this contract:

| Field | Constraint |
| --- | --- |
| `private_key_path` | Absolute local path to an unencrypted GitHub App RSA PEM, not an SSH-agent or OpenSSH key. |
| `installation_ids` | Object mapping owners to positive safe-integer installation IDs; the target owner must be present. |

Use `/setup-macklinu-machine` for missing or legacy configuration. Keep the config directory/file at `0700`/`0600`. The key must be an owner-readable regular file with no group/other permission bits (normally `0600` or `0400`); its immediate directory must not be group/other-writable. Config/key files and their immediate directories must not be symlinks. The runner never rewrites them.

App and installation IDs are public identifiers, not credentials. The PEM is a credential; its actual path and local configuration are private metadata. Never include them, JWTs, tokens, or former provider metadata in source, logs, issues, PRs, or output.

Publication reads the configured PEM, signs an App JWT in memory, and requests a fresh token limited to the named repository. The child receives `GH_TOKEN`, `GH_REPO`, and `GH_HOST=github.com`; inherited personal tokens and Git/gh tracing are removed. Pushes clear generic and URL-specific credential helpers and extra headers, then use `gh auth git-credential` with that token. Interactive fallback and submodule pushes are disabled. Failures return fixed errors; downstream exit status is preserved.

No key copy, token file/cache, retry, or permanent Git change is created. The PEM buffer is cleared after signing, but JavaScript/crypto copies can remain. The local key deliberately trusts the same user: tools, hooks, editors, pagers, process inspection and memory dumps can expose credentials. This is not a sandbox. Tokens can remain valid for up to one hour. Keep App permissions and installed repositories at the minimum needed.

## Runner and verification

Use the tested `tsx@4.23.15` pin. `pnpx` can fetch and execute third-party code; the pin does not lock transitive dependencies or remove package-source risk. `--allow-build=esbuild` permits only tsx's build dependency in the isolated pnpx cache, not project/global build policy. Trust the runner and package source. Do not enable shell tracing, debugging, or extra diagnostic loaders around credentials.

From this skills repository's root:

```sh
pnpx --allow-build=esbuild tsx@4.23.15 --test skills/macklinu-machine/scripts/run.test.ts
```

`tsx` runs TypeScript but does not type-check; check types separately.

Sources: [tsx](https://tsx.hirok.io/getting-started), [pnpx build policy](https://pnpm.io/cli/dlx), [App JWTs](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-json-web-token-jwt-for-a-github-app), [installation tokens](https://docs.github.com/en/rest/apps/apps#create-an-installation-access-token-for-an-app), and [Git helpers](https://git-scm.com/docs/gitcredentials).
