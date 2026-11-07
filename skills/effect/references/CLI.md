# Effect CLI

Read this only when the project imports `effect/cli`. Verify the unstable CLI surface against the pinned Effect version.

- Import `Argument`, `Command`, and `Flag` from `effect/cli`. Define typed commands with `Command.make`, reusable `Flag.String(...)` / `Argument.String(...)` values, and `Flag.withSchema(...)` / `Argument.withSchema(...)` to validate or transform parsed values before handlers run. Constructors such as `Flag.Boolean`, `Flag.Int`, and `Flag.Literals` are capitalized.
- Compose subcommands and shared flags declaratively. Keep domain behavior in services and make command handlers thin named effects.
- Distinguish parse/usage errors from typed application failures so help text, exit status, and diagnostics remain truthful.
- Send human output through Effect `Console`; keep machine-readable output stable and avoid mixing diagnostics into stdout.
- Provide platform services once at the entry point, run the composed command with `Command.run({ version: "..." })`, and hand the resulting effect to the platform `runMain`. `Command.run` reads application arguments from `Stdio`; use `Command.runWith(command, { version: "..." })(["--flag", "value"])` for explicit argument arrays without the executable/script prefix.
- Acquire files, terminals, clients, and other resources in Layers/scopes so interruption and process shutdown run finalizers.
- Built-in help, version, and parse diagnostics use `CliOutput.Presenter`. Annotated handler failures use `CliOutput.Formatter` and are rethrown after rendering. Set `renderErrors: false` when the host owns error rendering; this does not suppress requested help.

## Sources

- [Current command, flag, schema, and platform wiring example](https://github.com/Effect-TS/effect/blob/506eef143bcc1750ce58920aac1e45da7265d103/ai-docs/src/70_cli/10_basics.ts#L7-L161).
- [Command runners and rendering policy](https://github.com/Effect-TS/effect/blob/506eef143bcc1750ce58920aac1e45da7265d103/packages/effect/src/cli/Command.ts#L1868-L1974).
