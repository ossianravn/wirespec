# WireSpec parser + renderer adapter v0.1

This package turns the draft WireSpec Markdown format into a working reference adapter:

- parses CommonMark-hosted `wirespec` fences
- resolves state / breakpoint / theme / mode variants
- renders restrained semantic HTML wireframes
- emits a target source map for page / section / element / prose / acceptance annotations
- exposes `data-ws-*` hooks that a browser review layer can target
- bridges into the earlier annotation runtime through `resolveTarget`, `buildEditorOpenRequest`, and `exportAgentTasks`

## Why this slice exists

The earlier packs defined:
- the v1 grammar and AST direction
- the annotation sidecar model
- the review runtime types and export flow

This adapter makes those pieces executable.

## Proper UI alignment

The rendered output intentionally follows the uploaded Proper UI guidance:

- no dashboard shell, KPI strip, or ornamental review chrome
- the screen content stays primary
- surfaces are quiet and functional
- styling stays low-fidelity and neutral
- the review-oriented example keeps the drawer optional rather than permanently shrinking the preview

The adapter is not trying to be a polished design system renderer. It is trying to be a trustworthy spec preview with stable targets.

## Package layout

- `src/parser.ts` — Markdown host parser + `wirespec` block parser
- `src/resolver.ts` — variant selection and op application
- `src/render-html.ts` — semantic HTML renderer with `data-ws-*` hooks
- `src/source-map.ts` — target extraction + variant catalog + target resolution
- `src/editor-links.ts` — VS Code friendly deep-link payloads
- `src/task-export.ts` — open thread export for agents
- `src/review-overlay.ts` — minimal browser review overlay on top of `data-ws-*` hooks
- `fixtures/` — runnable screen fixtures
- `outputs/` — generated HTML, resolved trees, and source maps after running the scripts

## Core decisions in this adapter

### 1. The parser is line-oriented on purpose
It assumes the canonical authoring shape from the WireSpec docs:
- one base block
- ordered variant blocks
- two-space indentation
- one operation per line

That keeps the reference implementation small and makes failures obvious to agents.

### 2. The renderer is semantic, not visual-design heavy
It renders enough structure to review task flow and hierarchy:
- labels
- actions
- state changes
- drawers / alerts / helper copy
- basic grouping and spacing

It avoids decorative fidelity because that would blur the boundary between wireframe intent and final product styling.

### 3. The source map treats prose and acceptance as first-class review targets
That is important for the browser ↔ IDE ↔ agent loop. A reviewer should be able to say:
- “this acceptance rule is incomplete”
- “this intent statement is misleading”
- “this element label should be clearer”

without hacking comments onto screenshots.

### 4. `data-ws-*` hooks are stable and minimal
The renderer emits:
- `data-ws-screen`
- `data-ws-id`
- `data-ws-kind`
- `data-ws-target`
- optional `data-ws-role`

That is enough for overlays, hit-testing, and editor retargeting without coupling the review layer to visual CSS details.

## Example flow

```ts
import {
  buildSourceMap,
  parseWireSpecDocument,
  renderDocumentSelection,
  resolveDocument,
} from "./dist/index.js";

const source = `...markdown wirespec file...`;
const doc = parseWireSpecDocument(source, "screens/login.wirespec.md");

const resolved = resolveDocument(doc, {
  state: "error",
  breakpoint: "mobile",
});

const html = renderDocumentSelection(doc, {
  state: "error",
  breakpoint: "mobile",
});

const sourceMap = buildSourceMap(doc, {
  entryFile: "screens/login.wirespec.md",
});
```

## Running the package

```bash
npm run build
npm run generate:examples
npm run test
```

## Generated outputs

The package also ships a tiny browser review overlay prototype. It keeps the preview visually primary and opens a lightweight composer only when the reviewer selects a target.


After running the scripts, `outputs/` contains:

### Login
- `login.base.html`
- `login.error+mobile.html`
- `login.loading.html`
- `login.targets.json`
- matching resolved JSON files

### Review surface
- `review-surface.base.html`
- `review-surface.commenting.html`
- `review-surface.drawer-open+mobile.html`
- `review-surface.stale-preview.html`
- `review-surface.targets.json`
- matching resolved JSON files

## Current limitations

This is a reference adapter, not the full compiler.

Not included yet:
- formatter / canonical writer
- markdown AST preservation beyond the main prose sections
- rich child-structure validation by node kind
- full Open UI or WCAG lint packs
- canvas-style region mapping from actual DOM measurements
- round-tripping comments back into `wirecomment` fences

## Recommended next move

Build the smallest interactive browser overlay on top of the generated HTML:
- hover target highlight
- click to open a thread composer
- persist threads in the sidecar format
- deep-link to source spans using the source map
- export open threads to the agent task format
