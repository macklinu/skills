import { fileURLToPath } from "node:url";
import * as fontkit from "fontkit";

export const paperMonoFontFiles = [
  fileURLToPath(new URL("../fonts/PaperMono-Regular.ttf", import.meta.url)),
  fileURLToPath(new URL("../fonts/PaperMono-Bold.ttf", import.meta.url)),
];

const regular = fontkit.openSync(paperMonoFontFiles[0]);
const bold = fontkit.openSync(paperMonoFontFiles[1]);

export const paperMonoMeasurer = {
  width(text: string, size: number, style: number): number {
    const font = style & 1 ? bold : regular;
    return (font.layout(text).advanceWidth / font.unitsPerEm) * size;
  },
};
