# Effect CLI

Use this reference only when the project imports `effect/cli`. Keep an established CLI framework unless the task calls for changing it.

Compose typed commands, subcommands, arguments, and shared flags declaratively. Validate parsed values with Schema before handlers run. Keep handlers thin named effects that call application services instead of implementing domain behavior.

Distinguish parse and usage errors from application failures so help, exit status, and diagnostics describe what happened. Send human output through Effect `Console`. Keep machine-readable stdout stable and send diagnostics elsewhere, so scripts can consume results without parsing log messages.

## Own startup, output, and shutdown

Provide platform services once at the entry point and pass the composed command effect to the platform `runMain`. `Command.run` reads arguments from `Stdio`; use `Command.runWith` for tests or hosts that supply explicit argument arrays, without the executable or script prefix.

Acquire files, terminals, clients, and other resources in Layers or scopes so interruption and shutdown run their finalizers.

Decide whether the CLI runner or its host renders failures. Built-in help and parse diagnostics use `CliOutput.Presenter`; annotated handler failures use `CliOutput.Formatter` and are rethrown after rendering.

Set `renderErrors: false` when the host owns error rendering to avoid duplicate diagnostics. Requested help is still presented.

## Source hints

Start with `ai-docs/src/70_cli/10_basics.ts` in the matching Effect checkout. Read `packages/effect/src/cli/Command.ts` for argument and rendering behavior rather than copying older runner signatures.
