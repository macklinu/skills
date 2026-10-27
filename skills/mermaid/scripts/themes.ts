import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolveCustomProperties } from "./css-variables.ts";

export type ThemeName = "light" | "dark";

export type Theme = {
  name: ThemeName;
  background: string;
  variables: Record<string, string>;
};

export function parseTheme(name: ThemeName, css: string): Theme {
  const declarations: Record<string, string> = {};

  for (const match of css.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    declarations[match[1]] = match[2].trim();
  }

  const variables = resolveCustomProperties(declarations);
  const background = variables["--pele-bg"];
  if (!background) throw new Error(`Theme "${name}" does not define --pele-bg.`);

  return { name, background, variables };
}

export async function loadTheme(name: ThemeName): Promise<Theme> {
  const themePath = fileURLToPath(new URL(`../themes/${name}.css`, import.meta.url));
  return parseTheme(name, await readFile(themePath, "utf8"));
}
