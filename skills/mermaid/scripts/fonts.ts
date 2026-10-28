import { fileURLToPath } from "node:url";
import * as fontkit from "fontkit";

export const paperMonoFontFiles = [
  fileURLToPath(new URL("../fonts/PaperMono-Regular.ttf", import.meta.url)),
  fileURLToPath(new URL("../fonts/PaperMono-Bold.ttf", import.meta.url)),
];

function openFont(path: string): fontkit.Font {
  const font = fontkit.openSync(path);
  if (!("layout" in font)) throw new Error(`Expected a single font file: ${path}`);
  return font;
}

const regular = openFont(paperMonoFontFiles[0]);
const bold = openFont(paperMonoFontFiles[1]);

export const paperMonoMeasurer = {
  width(text: string, size: number, style: number): number {
    const font = style & 1 ? bold : regular;
    return (font.layout(text).advanceWidth / font.unitsPerEm) * size;
  },
};
