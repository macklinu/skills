import { DOMParser, XMLSerializer, type Element } from "@xmldom/xmldom";
import { Effect, Schema } from "effect";

type Declaration = {
  property: string;
  value: string;
};

export class CssResolutionError extends Schema.TaggedError<CssResolutionError>()(
  "CssResolutionError",
  { message: Schema.String },
) {}

function splitTopLevel(input: string, delimiter: string): string[] {
  const parts: string[] = [];
  let start = 0;
  let depth = 0;
  let quote = "";

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    const previous = input[index - 1];

    if (quote) {
      if (character === quote && previous !== "\\") quote = "";
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
    } else if (character === "(") {
      depth += 1;
    } else if (character === ")") {
      depth -= 1;
    } else if (character === delimiter && depth === 0) {
      parts.push(input.slice(start, index));
      start = index + 1;
    }
  }

  parts.push(input.slice(start));
  return parts;
}

function parseDeclarations(style: string): Declaration[] {
  return splitTopLevel(style, ";").flatMap((declaration) => {
    const colon = declaration.indexOf(":");
    if (colon === -1) return [];
    return [{
      property: declaration.slice(0, colon).trim(),
      value: declaration.slice(colon + 1).trim(),
    }];
  });
}

function findClosingParenthesis(value: string, openIndex: number) {
  return Effect.gen(function* () {
    let depth = 0;
    let quote = "";

    for (let index = openIndex; index < value.length; index += 1) {
      const character = value[index];
      const previous = value[index - 1];

      if (quote) {
        if (character === quote && previous !== "\\") quote = "";
        continue;
      }
      if (character === '"' || character === "'") {
        quote = character;
      } else if (character === "(") {
        depth += 1;
      } else if (character === ")") {
        depth -= 1;
        if (depth === 0) return index;
      }
    }

    return yield* new CssResolutionError({ message: `Unclosed CSS function in "${value}".` });
  });
}

function resolveValue(
  input: string,
  variables: Record<string, string>,
  stack: string[] = [],
): Effect.Effect<string, CssResolutionError> {
  return Effect.gen(function* () {
    let value = input;
    let searchFrom = 0;

    while (true) {
      const varIndex = value.indexOf("var(", searchFrom);
      if (varIndex === -1) return value;

      const openIndex = varIndex + 3;
      const closeIndex = yield* findClosingParenthesis(value, openIndex);
      const [namePart, ...fallbackParts] = splitTopLevel(
        value.slice(openIndex + 1, closeIndex),
        ",",
      );
      const name = namePart.trim();
      const fallback = fallbackParts.length > 0 ? fallbackParts.join(",").trim() : undefined;

      let replacement: string;
      if (Object.hasOwn(variables, name)) {
        if (stack.includes(name)) {
          return yield* new CssResolutionError({
            message: `Circular CSS variable reference: ${[...stack, name].join(" -> ")}.`,
          });
        }
        replacement = yield* resolveValue(variables[name], variables, [...stack, name]);
      } else if (fallback !== undefined) {
        replacement = yield* resolveValue(fallback, variables, stack);
      } else {
        return yield* new CssResolutionError({
          message: `Unresolved CSS variable "${name}" without a fallback.`,
        });
      }

      value = value.slice(0, varIndex) + replacement + value.slice(closeIndex + 1);
      searchFrom = varIndex + replacement.length;
    }
  });
}

export function resolveCustomProperties(
  variables: Record<string, string>,
) {
  return Effect.gen(function* () {
    const resolved = { ...variables };
    for (const [name, value] of Object.entries(variables)) {
      resolved[name] = yield* resolveValue(value, resolved);
    }
    return resolved;
  });
}

function resolveElement(
  element: Element,
  inherited: Record<string, string>,
): Effect.Effect<void, CssResolutionError> {
  return Effect.gen(function* () {
    const declarations = parseDeclarations(element.getAttribute("style") ?? "");
    const localVariables = { ...inherited };

    for (const { property, value } of declarations) {
      if (property.startsWith("--")) localVariables[property] = value;
    }
    const variables = yield* resolveCustomProperties(localVariables);

    if (element.hasAttribute("style")) {
      const resolvedDeclarations: string[] = [];
      for (const { property, value } of declarations) {
        resolvedDeclarations.push(`${property}:${yield* resolveValue(value, variables)}`);
      }
      element.setAttribute("style", resolvedDeclarations.join(";"));
    }

    for (const attribute of Array.from(element.attributes)) {
      if (attribute.name !== "style" && attribute.value.includes("var(")) {
        element.setAttribute(attribute.name, yield* resolveValue(attribute.value, variables));
      }
    }

    if (element.tagName === "style" && element.textContent) {
      element.textContent = yield* resolveValue(element.textContent, variables);
    }

    for (const child of Array.from(element.childNodes)) {
      if (child.nodeType === 1) yield* resolveElement(child as Element, variables);
    }
  });
}

export function resolveCssVariables(
  source: string,
  themeVariables: Record<string, string>,
  background?: string,
) {
  return Effect.gen(function* () {
    const document = yield* Effect.try({
      try: () => new DOMParser().parseFromString(source, "image/svg+xml"),
      catch: (error) => new CssResolutionError({
        message: error instanceof Error ? error.message : String(error),
      }),
    });
    const root = document.documentElement;
    if (!root || root.tagName !== "svg") {
      return yield* new CssResolutionError({ message: "Input does not contain an SVG root element." });
    }

    yield* resolveElement(root, themeVariables);

    if (background) {
      const rectangle = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rectangle.setAttribute("class", "pele-background");
      rectangle.setAttribute("width", "100%");
      rectangle.setAttribute("height", "100%");
      rectangle.setAttribute("fill", background);
      root.insertBefore(rectangle, root.firstChild);
    }

    return yield* Effect.try({
      try: () => new XMLSerializer().serializeToString(document),
      catch: (error) => new CssResolutionError({
        message: error instanceof Error ? error.message : String(error),
      }),
    });
  });
}
