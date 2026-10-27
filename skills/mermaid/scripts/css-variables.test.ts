import assert from "node:assert/strict";
import test from "node:test";
import { resolveCssVariables } from "./css-variables.ts";

test("resolves theme variables, aliases, and nested fallbacks", () => {
  const source = `<svg xmlns="http://www.w3.org/2000/svg" style="--alias:var(--pele-accent)">
    <rect fill="var(--alias)" />
    <text fill="var(--missing,var(--pele-fg,#000))">Label</text>
  </svg>`;

  const result = resolveCssVariables(source, {
    "--pele-accent": "#4385be",
    "--pele-fg": "#cecdc3",
  });

  assert.match(result, /fill="#4385be"/);
  assert.match(result, /fill="#cecdc3"/);
  assert.doesNotMatch(result, /var\(/);
});

test("inherits custom properties and honors local overrides", () => {
  const source = `<svg xmlns="http://www.w3.org/2000/svg" style="--tone:#111111">
    <g><path id="before" fill="var(--tone)" /></g>
    <g style="--tone:#222222"><path id="override" fill="var(--tone)" /></g>
    <path id="after" fill="var(--tone)" />
  </svg>`;

  const result = resolveCssVariables(source, {});
  const fills = [...result.matchAll(/id="(before|override|after)" fill="(#[0-9a-f]+)"/g)];

  assert.deepEqual(fills.map((match) => [match[1], match[2]]), [
    ["before", "#111111"],
    ["override", "#222222"],
    ["after", "#111111"],
  ]);
});

test("resolves inherited aliases in their declaring scope", () => {
  const source = `<svg xmlns="http://www.w3.org/2000/svg" style="--tone:#111111;--alias:var(--tone)">
    <g style="--tone:#222222"><path id="child" fill="var(--alias)" /></g>
  </svg>`;

  const result = resolveCssVariables(source, {});
  assert.match(result, /id="child" fill="#111111"/);
});

test("resolves variables in embedded style elements", () => {
  const source = `<svg xmlns="http://www.w3.org/2000/svg">
    <style>.node { fill: var(--pele-surface); }</style>
  </svg>`;

  const result = resolveCssVariables(source, { "--pele-surface": "#f3f3f3" });
  assert.match(result, /\.node \{ fill: #f3f3f3; \}/);
});

test("rejects unresolved variables instead of emitting invalid colors", () => {
  const source = `<svg xmlns="http://www.w3.org/2000/svg"><rect fill="var(--missing)" /></svg>`;
  assert.throws(() => resolveCssVariables(source, {}), /Unresolved CSS variable "--missing"/);
});

test("rejects circular variable references", () => {
  const source = `<svg xmlns="http://www.w3.org/2000/svg" style="--a:var(--b);--b:var(--a)">
    <rect fill="var(--a)" />
  </svg>`;
  assert.throws(() => resolveCssVariables(source, {}), /Circular CSS variable reference/);
});
