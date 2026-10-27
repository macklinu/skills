import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { layer as nodeServicesLayer } from "@effect/platform-node/NodeServices";
import { Effect } from "effect";
import test from "node:test";
import { rasterizeSvg, renderMermaidToSvg } from "./renderer.ts";

const cases = [
  { file: "state.mmd", type: "state", label: "Published" },
  { file: "class.mmd", type: "class", label: "Animal" },
  { file: "er.mmd", type: "er", label: "CUSTOMER" },
  { file: "gantt.mmd", type: "gantt", label: "Release plan" },
  { file: "git.mmd", type: "gitGraph", label: "Initial" },
  { file: "mindmap.mmd", type: "mindmap", label: "Mermaid" },
  { file: "pie.mmd", type: "pie", label: "Renderer share" },
  { file: "xychart.mmd", type: "xychart", label: "Milliseconds" },
];

for (const [index, fixture] of cases.entries()) {
  test(`resolves and rasterizes ${fixture.type} diagrams`, async () => {
    const source = await readFile(
      new URL(`../examples/variety/${fixture.file}`, import.meta.url),
      "utf8",
    );
    const theme = index % 2 === 0 ? "light" : "dark";
    const result = await Effect.runPromise(
      renderMermaidToSvg(source, { theme }).pipe(Effect.provide(nodeServicesLayer)),
    );
    const image = rasterizeSvg(result.svg, { background: result.background, width: 640 });

    assert.equal(result.type, fixture.type);
    assert.match(result.svg, new RegExp(fixture.label));
    assert.doesNotMatch(result.svg, /var\(/);
    assert.equal(image.width, 640);
  });
}
