import assert from "node:assert/strict";
import test from "node:test";
import { paperMonoMeasurer } from "./fonts.ts";

test("measures regular and bold Paper Mono as monospaced fonts", () => {
  for (const style of [0, 1]) {
    const narrow = paperMonoMeasurer.width("iii", 16, style);
    const wide = paperMonoMeasurer.width("WWW", 16, style);
    assert.equal(narrow, wide);
  }
});
