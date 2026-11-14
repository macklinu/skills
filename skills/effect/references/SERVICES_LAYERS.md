# Services, layers, and modules

Use services for application capabilities with dependencies, shared state, resource ownership, or replaceable implementations. Prefer `Context.Service` and function-valued methods.

Keep dependency-free, stateless helpers as plain functions unless replacement is needed. Do not wrap pure domain functions in services solely to observe their calls in tests.

Export the effectful implementation as `layer`, built with `Layer.effect` and returning `Service.of`.

## Module surface

For new application modules, prefer file-local role names and a canonical ES module namespace. Keep the project's existing style when it differs; this is a local preference, not an Effect requirement.

```ts
// user-repo.ts
import { Context, Effect } from "effect"

export interface Interface {
  readonly exists: (id: string) => Effect.Effect<boolean>
}

export class Service extends Context.Service<Service, Interface>()(
  "@app/UserRepo",
) {}

export * as UserRepo from "./user-repo.js"
```

Consumers import `{ UserRepo }` from the owning leaf and access `UserRepo.Service`. Barrels relay it with `export { UserRepo }`, rather than establishing another identity. Keep schemas and helpers private unless consumers need them.

This self-export creates a namespace self-reference. If the toolchain does not support it, use named exports or a separate barrel. Do not replace it with a TypeScript `namespace` declaration.

## Acquisition and composition

- Acquire dependencies once while building the layer. Use `Layer.succeed` for an existing implementation, `Layer.sync` for lazy synchronous construction, and `Layer.unwrap` when configuration selects a layer.
- Reuse named layer values because memoization follows layer identity, not the service tag. Nested provisions can reuse an enclosing acquisition; independent sibling provisions do not share new acquisitions.
- Hide implementation dependencies with `Layer.provide`. Use `provideMerge` when consumers also need the dependency, and `mergeAll` for independent exposed services.
- Keep wiring flat enough to inspect. Do not add broad provisioning merely to silence missing-service errors, or hide required authority behind `Context.Reference` defaults.

## Operations

Prefer direct combinators for focused transformations and recovery. Use `Effect.gen` for dependent workflows and branching; avoid generators that only yield and return one effect without adding workflow logic.

Use `Effect.fn("Domain.operation")` for public or non-trivial service methods. Use `fnUntraced` for internal helpers that intentionally need no tracing metadata.

Extract meaningful domain decisions, recovery policies, and coherent steps when they clarify the parent workflow. Do not impose function-length limits.

Prefer exhaustive variant matchers for closed unions and `Match` utilities when they clarify multi-condition branches. Keep simple predicates as `if` statements or guard clauses.

Keep generator bodies focused on the workflow. Additional `Effect.fn` transforms can apply shared error mapping, annotations, or cleanup to the whole call and receive its original arguments. Reuse error helpers when repetition warrants them; name them after the error they produce and preserve useful operation labels.

For workers and listeners started by layers, follow [resource ownership](RESOURCES_RUNTIME.md) and [fiber supervision](CONCURRENCY.md). Layer acquisition must finish rather than run a forever loop inline.

For exact composition and transform behavior, inspect `Layer.ts`, `Effect.ts`, `Match.ts`, and `migration/layer-memoization.md` in the matching Effect checkout.
