import assert from "node:assert/strict";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";

const skillRoot = fileURLToPath(new URL("../", import.meta.url));
const architecture = join(skillRoot, "examples", "architecture.mmd");

function runCli(arguments_: string[]) {
  return spawnSync("pnpm", ["exec", "tsx", "scripts/render.ts", ...arguments_], {
    cwd: skillRoot,
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1" },
    timeout: 30_000,
  });
}

test("shows declarative CLI help", () => {
  const result = runCli(["--help"]);

  assert.equal(result.status, 0);
  assert.match(result.stdout, /USAGE/);
  assert.match(result.stdout, /--theme, -t choice/);
  assert.match(result.stdout, /--width integer/);
});

test("renders a PNG and preserves JSON output metadata", (context) => {
  const directory = mkdtempSync(join(tmpdir(), "mermaid-cli-"));
  context.after(() => rmSync(directory, { recursive: true, force: true }));
  const output = join(directory, "nested", "diagram.png");
  const result = runCli([
    architecture,
    "--output", output,
    "--theme", "dark",
    "--width", "800",
  ]);

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), {
    output,
    format: "png",
    theme: "dark",
    type: "flowchart",
    width: 800,
    height: 167,
  });
  assert.deepEqual([...readFileSync(output).subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
});

test("rejects an unsupported theme", () => {
  const result = runCli([architecture, "--output", "out/invalid.png", "--theme", "blue"]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Invalid value for flag --theme/);
  assert.match(result.stderr, /Expected: "light" \| "dark"/);
});

test("rejects a non-positive width", () => {
  const result = runCli([architecture, "--output", "out/invalid.png", "--width", "0"]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /--width must be a positive integer/);
});

test("rejects width for SVG output", () => {
  const result = runCli([architecture, "--output", "out/invalid.svg", "--width", "800"]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /--width applies only to PNG output/);
});

test("rejects an unsupported output extension", () => {
  const result = runCli([architecture, "--output", "out/invalid.jpg"]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /--output must end in .svg or .png/);
});
