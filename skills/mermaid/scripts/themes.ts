import { Effect, FileSystem, Path } from "effect";
import { CssResolutionError, resolveCustomProperties } from "./css-variables.ts";

export type ThemeName = "light" | "dark";

export type Theme = {
  name: ThemeName;
  background: string;
  variables: Record<string, string>;
};

export function parseTheme(name: ThemeName, css: string) {
  return Effect.gen(function* () {
    const declarations: Record<string, string> = {};

    for (const match of css.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
      declarations[match[1]] = match[2].trim();
    }

    const variables = yield* resolveCustomProperties(declarations);
    const background = variables["--pele-bg"];
    if (!background) {
      return yield* new CssResolutionError({ message: `Theme "${name}" does not define --pele-bg.` });
    }

    return { name, background, variables };
  });
}

export const loadTheme = Effect.fn("Theme.load")(function* (name: ThemeName) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const themePath = yield* path.fromFileUrl(new URL(`../themes/${name}.css`, import.meta.url));
  const css = yield* fs.readFileString(themePath);
  return yield* parseTheme(name, css);
});
