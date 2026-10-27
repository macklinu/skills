---
name: mermaid
description: Create and render Mermaid diagrams as source, SVG, or PNG for Mermaid and .mmd requests.
license: MIT; Paper Mono uses SIL OFL-1.1 (fonts/LICENSE.txt)
compatibility: Requires Node.js 22+, pnpm 12+, and network access on first install.
---

# Mermaid

Create the smallest diagram that answers the user's question.

## Workflow

1. Identify the question, audience, and requested output. Use only supplied facts.
2. Choose the diagram type:
   - Flowchart for processes, decisions, and data flow.
   - Sequence diagram for ordered interactions.
   - State diagram for lifecycle transitions.
   - Class diagram for static type relationships.
   - Entity relationship diagram for stored data relationships.
   - Another Mermaid type only when it fits better.
3. Draft concise labels and meaningful IDs. Use subgraphs only for real boundaries and declare sequence participants in reading order.
4. If syntax is uncertain, read only the selected type's [Mermaid syntax documentation](https://mermaid.js.org/intro/syntax-reference.html) or [Pele examples](https://pele.run/examples). Do not crawl the full documentation.
5. Render and inspect the actual image. Revise clipping, overlap, density, reading order, and unnecessary edges; split overloaded diagrams.
6. Return the source and requested artifacts. Do not claim Pele output matches another host's Mermaid version or layout.

## Render

Resolve this skill directory to an absolute path. On first use, install its local dependencies:

```sh
pnpm --dir /absolute/path/to/mermaid install --frozen-lockfile
```

Pele renders Mermaid to SVG. The script resolves theme CSS variables to static values, writes SVG, and uses resvg for PNG:

```sh
pnpm --dir /absolute/path/to/mermaid render input.mmd --output diagram.svg --theme light
pnpm --dir /absolute/path/to/mermaid render input.mmd --output diagram.png --theme dark
```

- PNG defaults to twice the natural width.
- For PNG only, `--width 1600` sets the final pixel width and scales height proportionally.
- Default to PNG for sharing. Keep the `.mmd` source beside generated artifacts.

Edit `themes/light.css` or `themes/dark.css` to change the theme.

Paper Mono regular and bold are bundled in `fonts/` under the SIL Open Font License. Pele and resvg load them locally.

Do not substitute Mermaid CLI or another Mermaid renderer when Pele fails. Report an unresolved compatibility or visual-verification limit.
