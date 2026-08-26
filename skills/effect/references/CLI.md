# Effect CLI

Read this only when the project imports `effect/unstable/cli`. Verify the unstable CLI surface against the pinned Effect version.

- Define typed commands with `Command.make`, reusable `Flag` / `Argument` values, and schemas that validate or transform parsed strings before handlers run.
- Compose subcommands and shared flags declaratively. Keep domain behavior in services and make command handlers thin named effects.
- Distinguish parse/usage errors from typed application failures so help text, exit status, and diagnostics remain truthful.
- Send human output through Effect `Console`; keep machine-readable output stable and avoid mixing diagnostics into stdout.
- Provide platform services once at the entry point, run the composed command with `Command.run`, and hand the resulting effect to the platform `runMain`.
- Acquire files, terminals, clients, and other resources in Layers/scopes so interruption and process shutdown run finalizers.
