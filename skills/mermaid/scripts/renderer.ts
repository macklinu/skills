import { Resvg } from "@resvg/resvg-js";
import { render } from "pele";
import { resolveCssVariables } from "./css-variables.ts";
import { paperMonoFontFiles, paperMonoMeasurer } from "./fonts.ts";
import { loadTheme, type ThemeName } from "./themes.ts";

export type MermaidSvg = {
  svg: string;
  type: string;
  width: number;
  height: number;
  background: string;
};

export type RasterImage = {
  png: Buffer;
  width: number;
  height: number;
};

export async function renderMermaidToSvg(
  source: string,
  options: { theme?: ThemeName } = {},
): Promise<MermaidSvg> {
  const theme = await loadTheme(options.theme ?? "light");
  const result = render(source, {
    autoDirection: false,
    fontFamily: "Paper Mono",
    fontFamilyMono: "Paper Mono",
    measurer: paperMonoMeasurer,
    monospace: ["attributes", "files", "members", "messages"],
    padding: 24,
    responsive: false,
  });

  return {
    svg: resolveCssVariables(result.svg, theme.variables, theme.background),
    type: result.type,
    width: result.width,
    height: result.height,
    background: theme.background,
  };
}

export function rasterizeSvg(
  svg: string,
  options: { background: string; width?: number },
): RasterImage {
  const resvg = new Resvg(svg, {
    background: options.background,
    fitTo: options.width
      ? { mode: "width", value: options.width }
      : { mode: "zoom", value: 2 },
    font: {
      defaultFontFamily: "Paper Mono",
      fontFiles: paperMonoFontFiles,
      loadSystemFonts: true,
      monospaceFamily: "Paper Mono",
      sansSerifFamily: "Paper Mono",
    },
    shapeRendering: 2,
    textRendering: 1,
    imageRendering: 0,
  });
  const image = resvg.render();

  return { png: image.asPng(), width: image.width, height: image.height };
}
