import { runMain } from "@effect/platform-node/NodeRuntime";
import { layer as nodeServicesLayer } from "@effect/platform-node/NodeServices";
import { Console, Effect, FileSystem, Option, Path } from "effect";
import { Argument, CliError, Command, Flag } from "effect/cli";
import { rasterizeSvg, renderMermaidToSvg } from "./renderer.ts";
import type { ThemeName } from "./themes.ts";

type RenderInput = {
  readonly input: string;
  readonly output: string;
  readonly theme: ThemeName;
  readonly width: Option.Option<number>;
};

const userError = (userMessage: string) => new CliError.UserError({
  cause: userMessage,
  userMessage,
});

const renderDiagram = Effect.fn("Mermaid.render")(function* ({
  input,
  output,
  theme,
  width,
}: RenderInput) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const format = path.extname(output).toLowerCase();

  if (format !== ".svg" && format !== ".png") {
    return yield* Effect.fail(userError("--output must end in .svg or .png."));
  }
  if (format === ".svg" && Option.isSome(width)) {
    return yield* Effect.fail(userError("--width applies only to PNG output."));
  }

  const source = yield* fs.readFileString(input);
  const result = yield* renderMermaidToSvg(source, { theme });
  yield* fs.makeDirectory(path.dirname(output), { recursive: true });

  const outputFormat = format === ".svg" ? "svg" : "png";
  let dimensions: { readonly width: number; readonly height: number };

  if (format === ".svg") {
    yield* fs.writeFileString(output, result.svg);
    dimensions = { width: result.width, height: result.height };
  } else {
    const image = yield* Effect.try(() => rasterizeSvg(result.svg, {
      background: result.background,
      width: Option.getOrUndefined(width),
    }));
    yield* fs.writeFile(output, image.png);
    dimensions = { width: image.width, height: image.height };
  }

  yield* Console.log(JSON.stringify({
    output,
    format: outputFormat,
    theme,
    type: result.type,
    ...dimensions,
  }));
});

const renderCommand = Command.make("render", {
  input: Argument.Path("input", { pathType: "file", mustExist: true }),
  output: Flag.String("output").pipe(
    Flag.withAlias("o"),
    Flag.withDescription("Output path ending in .svg or .png"),
  ),
  theme: Flag.Literals("theme", ["light", "dark"]).pipe(
    Flag.withAlias("t"),
    Flag.withDefault("light"),
    Flag.withDescription("Color theme"),
  ),
  width: Flag.Int("width").pipe(
    Flag.filter(
      (width) => Number.isSafeInteger(width) && width > 0,
      () => "--width must be a positive integer.",
    ),
    Flag.optional,
    Flag.withDescription("PNG output width in pixels"),
  ),
}, renderDiagram).pipe(
  Command.withDescription("Render Mermaid with Pele and write static SVG or PNG."),
);

runMain(
  Command.run(renderCommand, { version: "1.0.0" }).pipe(
    Effect.provide(nodeServicesLayer),
  ),
);
