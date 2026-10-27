import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, extname } from "node:path";
import { renderMermaidToSvg, rasterizeSvg } from "./renderer.ts";
import type { ThemeName } from "./themes.ts";

const usage = `Usage: pnpm render INPUT.mmd --output FILE [options]

Render Mermaid with Pele, resolve its CSS variables, and write static SVG or PNG.

Options:
  -o, --output FILE   Output path ending in .svg or .png (required)
  -t, --theme NAME    light or dark (default: light)
      --width PX      PNG output width (default: 2x natural width)
  -h, --help          Show this help
`;

function parseArguments(arguments_: string[]) {
  let input: string | undefined;
  let output: string | undefined;
  let theme: ThemeName = "light";
  let width: number | undefined;

  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index];
    if (argument === "--help" || argument === "-h") return { help: true };
    if (argument === "--output" || argument === "-o") {
      output = arguments_[++index];
    } else if (argument === "--theme" || argument === "-t") {
      const value = arguments_[++index];
      if (value !== "light" && value !== "dark") throw new Error("--theme must be light or dark.");
      theme = value;
    } else if (argument === "--width") {
      width = Number(arguments_[++index]);
      if (!Number.isSafeInteger(width) || width <= 0) {
        throw new Error("--width must be a positive integer.");
      }
    } else if (argument.startsWith("-")) {
      throw new Error(`Unknown option "${argument}".`);
    } else if (input) {
      throw new Error("Provide only one input file.");
    } else {
      input = argument;
    }
  }

  if (!input) throw new Error("An input .mmd file is required.");
  if (!output) throw new Error("--output is required.");
  const format = extname(output).toLowerCase();
  if (format !== ".svg" && format !== ".png") throw new Error("--output must end in .svg or .png.");
  if (format === ".svg" && width) throw new Error("--width applies only to PNG output.");

  return { help: false, input, output, theme, width, format };
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log(usage);
    return;
  }

  const source = await readFile(options.input, "utf8");
  const result = await renderMermaidToSvg(source, { theme: options.theme });
  await mkdir(dirname(options.output), { recursive: true });

  if (options.format === ".svg") {
    await writeFile(options.output, result.svg);
    console.log(JSON.stringify({
      output: options.output,
      format: "svg",
      theme: options.theme,
      type: result.type,
      width: result.width,
      height: result.height,
    }));
    return;
  }

  const image = rasterizeSvg(result.svg, {
    background: result.background,
    width: options.width,
  });
  await writeFile(options.output, image.png);
  console.log(JSON.stringify({
    output: options.output,
    format: "png",
    theme: options.theme,
    type: result.type,
    width: image.width,
    height: image.height,
  }));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
