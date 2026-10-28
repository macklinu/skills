import assert from "node:assert/strict";
import test from "node:test";
import { Effect } from "effect";
import { resolveCssVariables } from "./css-variables.ts";
import { rasterizeSvg } from "./renderer.ts";
import { parseTheme } from "./themes.ts";

test("resolves aliased theme backgrounds in SVG and PNG rendering", () => {
  const theme = parseTheme("light", `.pele {
    --base-bg: #fafafa;
    --pele-bg: var(--base-bg);
    --pele-fg: #1f1f1f;
  }`);
  const svg = Effect.runSync(resolveCssVariables(
    `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20">
      <text fill="var(--pele-fg)">A</text>
    </svg>`,
    theme.variables,
    theme.background,
  ));
  const image = rasterizeSvg(svg, { background: theme.background, width: 40 });

  assert.equal(theme.background, "#fafafa");
  assert.match(svg, /class="pele-background" width="100%" height="100%" fill="#fafafa"/);
  assert.doesNotMatch(svg, /var\(/);
  assert.equal(image.width, 40);
});
