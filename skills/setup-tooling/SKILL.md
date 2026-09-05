---
name: setup-tooling
description: Set up a safe TypeScript-first Node monorepo with Nub, npm workspaces, an official MCP TypeScript stdio server, Oxlint, Oxfmt, Lefthook, and Conventional Commits. Use when initializing a Node repository or adding this tooling baseline to an existing repository.
---

# Setup tooling

Build the smallest complete tooling baseline. Read the nearest repository instructions first. Preserve existing files, scripts, package-manager pins, lockfiles, ignore rules, and hook behavior unless the task explicitly replaces them.

## Choose the path

- New or empty Node root: use the initialization sequence below.
- Existing Node root: do not run a generator over it. Inspect its manifest, workspaces, lockfile, ignore files, and hooks, then add only missing parts.
- Existing alternative linter, formatter, package manager, or hook runner: report the conflict and follow the requested migration scope. Do not create two active conventions.

## Initialize safely

1. Inspect the root before generating files. `nub init` refuses to overwrite conflicts unless `--force` is used; never use `--force` in an existing repository.
2. In a root where Nub's generated targets are absent, run:

   ```sh
   nub init --yes --no-install
   ```

   This creates a TypeScript-first Node root without installing dependencies. Keep the `packageManager` and `devEngines` values produced by the installed Nub version. The verified baseline produced `packageManager: "nub@0.7.5"`; do not hard-code that version into later projects.
3. During the pre-Nub bootstrap window, generate the standard Node ignore rules and install the two operating skills:

   ```sh
   npx gitignore node
   npx skills add https://github.com/nubjs/nub --skill nub
   npx skills find conventional-commit
   npx skills add https://github.com/github/awesome-copilot --skill conventional-commit
   ```

   Review the `.gitignore` diff and retain project-specific rules. The verified exact discovery result with the highest install count was `github/awesome-copilot@conventional-commit`; discovery results can change, so confirm the exact result before installation.
4. Read the installed Nub skill before the next Node command. From this point, use Nub instead of `node`, `npm`, `npx`, `pnpm`, or `yarn`:

   | Need | Command |
   | --- | --- |
   | Run a JS/TS file | `nub <file>` |
   | Run a package script | `nub run <script>` |
   | Run an installed local CLI | `nubx <tool>` |
   | Fetch and run a temporary CLI | `nub dlx <package>` |
   | Install dependencies | `nub install` |
   | Add a dependency | `nub add <package>` |
   | Watch an entry file | `nub watch <file>` |

5. Make the root manifest private and add npm workspaces:

   ```json
   {
     "private": true,
     "workspaces": ["apps/*"]
   }
   ```

   Put applications under `apps/*`. Root scripts can delegate with `nub run --workspace <workspace-name> <script>`. A Nub-native install writes `nub.lock`; keep and commit that lockfile, and do not substitute `package-lock.json`. Do not invent extra workspace packages or dependency stacks.

## Add an MCP TypeScript server

Create one private ESM workspace under `apps/<server>/`. Give it `dev`, `start`, and `typecheck` scripts that use `nub watch`, `nub`, and `nubx tsc --noEmit -p tsconfig.json`. From that workspace, install only the protocol and schema dependencies:

```sh
nub add @modelcontextprotocol/server zod
```

Use the current v2 server package and API shape:

```ts
import { McpServer } from "@modelcontextprotocol/server";
import { serveStdio } from "@modelcontextprotocol/server/stdio";
import * as z from "zod/v4";

function createServer(): McpServer {
  const server = new McpServer({ name: "example-server", version: "0.0.1" });

  server.registerTool(
    "health",
    {
      description: "Report server health.",
      inputSchema: z.object({}),
    },
    async () => ({ content: [{ type: "text", text: "ok" }] }),
  );

  return server;
}

void serveStdio(createServer);
console.error("MCP server running on stdio");
```

`serveStdio` owns stdin and stdout. Stdout is the JSON-RPC protocol channel: never write banners, debug output, or application logs to it. Send startup and diagnostic logs to stderr with `console.error`.

## Configure OxC and Lefthook

Install the root development tools from the workspace root. Nub requires `-W` for a workspace-root dependency:

```sh
nub add -D -W oxlint oxfmt lefthook
nubx oxlint --init
nubx oxfmt --init
```

Keep the generated Oxlint and Oxfmt defaults. Add this property to both `.oxlintrc.json` and `.oxfmtrc.json`:

```json
"ignorePatterns": ["vendor/**", "repos/**"]
```

Every Oxlint and Oxfmt runtime call must include `--disable-nested-config`. Use focused formatter targets so generated, vendored, repository mirror, and agent-instruction trees are not rewritten:

```json
{
  "scripts": {
    "lint": "nubx oxlint --disable-nested-config .",
    "format": "nubx oxfmt --write --disable-nested-config apps package.json .oxlintrc.json .oxfmtrc.json",
    "format:check": "nubx oxfmt --check --disable-nested-config apps package.json .oxlintrc.json .oxfmtrc.json"
  }
}
```

Configure `lefthook.yml` to pass only staged matching files. `stage_fixed: true` stages formatter changes and is valid for `pre-commit`:

```yaml
pre-commit:
  commands:
    lint:
      glob: "*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}"
      run: nubx oxlint --disable-nested-config {staged_files}
    format:
      glob: "*.{js,mjs,cjs,jsx,ts,mts,cts,tsx,json,jsonc}"
      run: nubx oxfmt --write --disable-nested-config {staged_files}
      stage_fixed: true
```

Install after validation, not as an unverified postinstall fallback:

```sh
nubx lefthook validate
nubx lefthook install --force
```

## Verify the changed paths

Run only checks that cover this setup:

```sh
nub install
nub run lint
nub run format:check
nub run typecheck
nubx lefthook validate
nubx lefthook install --force
```

Exercise the MCP server through a real stdio client. The Inspector is the temporary fetch-and-run case, so use `nub dlx`, not `nubx`:

```sh
nub dlx @modelcontextprotocol/inspector nub apps/<server>/src/index.ts
```

Connect, list tools, and call the starter tool. Confirm the tool result, confirm startup logs are on stderr, and confirm stdout contains protocol data only.

## Commit and open a pull request

1. Review the working-tree and staged diffs. Stage only intended setup files; do not include generated caches, vendored files, repository mirrors, or unrelated formatting.
2. Re-run the focused checks after the final edit.
3. Read the installed `conventional-commit` skill before composing the commit. Use a Conventional Commit message that describes the actual diff.
4. Commit, push the current branch with its upstream, and open a pull request against the repository default branch. The PR body must state the configuration added and the exact checks run.
5. Report changed files, validation results, commit SHA, and PR URL.

## Verified sources

- [Nub project initialization](https://nubjs.com/docs/init)
- [Nub command mapping](https://nubjs.com/docs)
- [Skills CLI](https://skills.sh/docs/cli) and [`github/awesome-copilot` conventional-commit](https://skills.sh/github/awesome-copilot/conventional-commit)
- [`gitignore` package](https://www.npmjs.com/package/gitignore)
- [MCP TypeScript v2 first server](https://ts.sdk.modelcontextprotocol.io/v2/get-started/first-server)
- [Oxlint nested configuration](https://oxc.rs/docs/guide/usage/linter/nested-config) and [ignore patterns](https://oxc.rs/docs/guide/usage/linter/ignore-files)
- [Oxfmt CLI](https://oxc.rs/docs/guide/usage/formatter/cli.html) and [ignore patterns](https://oxc.rs/docs/guide/usage/formatter/ignore-files)
- [Lefthook staged files](https://lefthook.dev/configuration/run/) and [`stage_fixed`](https://lefthook.dev/configuration/stage_fixed/)
