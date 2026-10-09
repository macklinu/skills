---
name: macklinu-machine
description: Use the macklinu-machine GitHub App for GitHub PR and repository API commands, commits, and HTTPS pushes in macklinu or fairfield-consulting repositories. Use when asked to publish as the machine or when AGENTS.md requires it. Never fall back to personal credentials.
compatibility: Requires Node.js 22+, pnpm 10.2+ (pnpx), and Git. PR/API commands and pushes also require the 1Password CLI (op) and GitHub CLI (gh).
---

# macklinu-machine

Use the bundled `scripts/run.ts`. Do not copy its authentication commands into an agent shell. Resolve the script to an absolute path from the installed skill; it need not be in the target checkout.

## Identity and configuration

The App ID (`5252838`), installation IDs, bot name (`macklinu-machine[bot]`), and email (`340227694+macklinu-machine[bot]@users.noreply.github.com`) are public identifiers, not credentials. An installation ID in source does not grant access. Local configuration keeps installation selection separate from code.

`$HOME/.config/macklinu-machine/config.json` contains:

```json
{
  "private_key_reference": "op://<vault>/<item>/<field>",
  "installation_ids": {
    "macklinu": 169669532,
    "fairfield-consulting": 169669603
  }
}
```

This is a generic example, not a file to put in the checkout. The real 1Password account, vault, item, field, IDs, and reference are private metadata. Never include them, private keys, JWTs, or tokens in source, logs, issues, PRs, or command output.

Use `/setup-macklinu-machine` if configuration is missing or invalid, including configuration from the old Fish workflow. Setup adds missing installation IDs and preserves custom IDs. Keep the directory/file at `0700`/`0600`, without symlinks. On Windows, restrict access with local ACLs; POSIX mode checks do not protect Windows files. The publishing command only reads configuration.

## Workflow

1. Read the target checkout's `AGENTS.md`. Identify `OWNER/REPO`; only `macklinu` and `fairfield-consulting` are supported.
2. Keep the working directory in that checkout. Use the same target for commits, pushes, and PR/API commands.
3. Run `pnpx --allow-build=esbuild tsx@4.23.15 /absolute/path/to/macklinu-machine/scripts/run.ts OWNER/REPO OPERATION ARGS...`.
4. Stop on authentication failure. Do not retry with personal credentials.

Use the tested `tsx@4.23.15` pin, not an unversioned `pnpx tsx`. `pnpx` can download and execute third-party code; the pin reduces version drift but does not lock transitive dependencies or remove package-source risk. `--allow-build=esbuild` permits only tsx's required build dependency in the isolated pnpx cache, not a global/project policy change. Fish, jq, and `gh-token` are not needed. Trust the package source, runner, CLI binaries, checkout, hooks, editors, and pagers. Do not enable shell tracing, debugging, or extra diagnostic loaders around credentials.

### PR and repository API commands

```sh
pnpx --allow-build=esbuild tsx@4.23.15 /absolute/path/to/macklinu-machine/scripts/run.ts macklinu/example-repo gh pr create --title 'Describe the change' --body 'Describe the result'
pnpx --allow-build=esbuild tsx@4.23.15 /absolute/path/to/macklinu-machine/scripts/run.ts macklinu/example-repo gh pr edit 123 --body 'Updated description'
pnpx --allow-build=esbuild tsx@4.23.15 /absolute/path/to/macklinu-machine/scripts/run.ts fairfield-consulting/example-repo gh api repos/fairfield-consulting/example-repo/pulls
```

Only `gh pr` and repository REST API commands are allowed. Put the endpoint immediately after `api`; `repos/{owner}/{repo}/...` placeholders are supported. Do not use cross-repository URLs or endpoints, host/repository overrides, replacement authentication headers, or HTTP request logging. Auth commands, extensions, and other `gh` commands are blocked because they can expose the token or change authentication.

Each invocation captures `op read`, signs an RS256 App JWT in memory, and requests a fresh installation token from `api.github.com`. The token request is limited to the named repository. It retains the App's granted permissions; keep those permissions and installed repositories at the minimum required in GitHub App settings. No redirect, retry, token cache, PEM file, or token file is used.

Configuration, key-read, signing, and token failures stop before the requested command. Errors do not show private references or authentication stderr. The child receives `GH_TOKEN`, `GH_REPO`, and `GH_HOST=github.com`; inherited personal tokens and Git/gh tracing are removed. The PEM buffer is cleared after signing. JavaScript strings and crypto objects cannot be guaranteed to leave no memory copies.

### Commits

Stage only the intended files, then run:

```sh
pnpx --allow-build=esbuild tsx@4.23.15 /absolute/path/to/macklinu-machine/scripts/run.ts macklinu/example-repo commit -m 'Describe the change'
```

The child receives the bot's author and committer name/email. No local machine configuration, key, or token is needed. Do not override `--author`. Include `--reset-author` when amending or reusing a commit message so Git does not retain the previous author. Check both author and committer after the commit.

### HTTPS pushes

```sh
pnpx --allow-build=esbuild tsx@4.23.15 /absolute/path/to/macklinu-machine/scripts/run.ts macklinu/example-repo push HEAD
pnpx --allow-build=esbuild tsx@4.23.15 /absolute/path/to/macklinu-machine/scripts/run.ts fairfield-consulting/example-repo push HEAD:refs/heads/example-branch --force-with-lease
```

The destination is `https://github.com/OWNER/REPO.git`. Do not supply a different destination, transport, or submodule push. Configured submodule pushes are disabled. Remove Git URL rewrites before using this operation. The command clears generic and URL-specific credential helpers and extra headers, then uses `gh auth git-credential` with the child token. Interactive credential fallback is disabled. It does not change remotes, global identity, or permanent Git settings. The downstream exit status is returned.

The child process and its trusted hooks/tools can access the token. Local process inspection or memory dumps can expose it. An installation token can remain valid for up to one hour after this process ends. Protect the 1Password key and local runtime; this workflow is not a sandbox.

## Verification

From this skills repository's root:

```sh
pnpx --allow-build=esbuild tsx@4.23.15 --test skills/macklinu-machine/scripts/run.test.ts
```

`tsx` runs TypeScript but does not type-check. Run TypeScript checking separately.

Sources: [tsx usage](https://tsx.hirok.io/getting-started), [pnpx build policy](https://pnpm.io/cli/dlx), [App JWTs](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-json-web-token-jwt-for-a-github-app), [installation tokens](https://docs.github.com/en/rest/apps/apps#create-an-installation-access-token-for-an-app), and [Git credential helpers](https://git-scm.com/docs/gitcredentials).
