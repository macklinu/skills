import assert from "node:assert/strict";
import test from "node:test";
import { rasterizeSvg, renderMermaidToSvg } from "./renderer.ts";

const source = `flowchart LR
  A[Web application] --> B{Order valid?}
  B -->|Yes| C[Store order]
  B -->|No| D[Show validation error]`;

test("renders a standalone light SVG with concrete Pele colors", async () => {
  const result = await renderMermaidToSvg(source);

  assert.equal(result.type, "flowchart");
  assert.match(result.svg, /Web application/);
  assert.match(result.svg, /Paper Mono/);
  assert.match(result.svg, /#f3f3f3/);
  assert.match(result.svg, /class="pele-background" width="100%" height="100%" fill="#ffffff"/);
  assert.doesNotMatch(result.svg, /var\(/);
});

test("renders the dark theme into standalone SVG and PNG output", async () => {
  const result = await renderMermaidToSvg(source, { theme: "dark" });
  const image = rasterizeSvg(result.svg, { background: result.background });

  assert.match(result.svg, /#1c1b1a/);
  assert.match(result.svg, /fill="#100f0f"/);
  assert.deepEqual([...image.png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);

});

test("scales PNG output to the requested width", async () => {
  const result = await renderMermaidToSvg(source);
  const image = rasterizeSvg(result.svg, { background: result.background, width: 800 });

  assert.equal(image.width, 800);
  assert.equal(image.height, Math.round((result.height / result.width) * 800));
});
