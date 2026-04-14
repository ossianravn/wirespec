# WireSpec review runtime v0.2

This package extends the earlier parser / renderer adapter into a working review loop for browser-based feedback.

It keeps the wireframe preview primary, lets a reviewer leave page / section / element comments directly on the rendered output, persists them as a structured annotation sidecar, and exports open threads as bounded agent tasks.

## What this slice adds

- browser review runtime on top of `data-ws-*` targets
- saved annotation sidecar export and import
- local persistence via `localStorage`
- target pins with active thread counts
- optional thread drawer that overlays instead of shrinking the preview
- sidecar -> store -> agent task flow
- anchor-based relinking when a target id drifts

## Proper UI alignment

This runtime intentionally follows the uploaded Proper UI guidance:

- the preview stays visually primary
- the review tools are quiet and optional
- no dashboard shell, KPI strip, or ornamental collaboration chrome
- the thread surface overlays the preview instead of permanently stealing layout width
- controls stay calm and functional

## Package layout

- `src/annotation-sidecar.ts` — thread creation, anchors, sidecar conversion, relinking
- `src/review-store.ts` — pure store operations and counts
- `src/review-runtime.ts` — browser runtime, pins, drawer, import/export, local persistence
- `src/review-overlay.ts` — comment-mode selection and composer
- `schemas/wirespec-annotation-sidecar-v0.2.schema.json` — sidecar contract
- `outputs/*.review-runtime.html` — generated demos with seeded threads
- `outputs/*.annotations.json` — seeded sidecars
- `outputs/*.agent-tasks.json` — seeded agent task exports

## Runtime behavior

1. render a WireSpec selection into semantic HTML
2. mount the review runtime with the source map and optional initial sidecar
3. enter comment mode and click the page, a section, or an element
4. submit a note
5. the runtime creates a thread with semantic anchors and persists it
6. open threads can be exported as JSON for agents or imported back later

## Minimal browser integration

```ts
import {
  buildSourceMap,
  buildVariantRefs,
  mountReviewRuntime,
  parseWireSpecDocument,
  renderDocumentSelection,
} from "./dist/index.js";

const source = await fetch("/screens/login.wirespec.md").then((response) => response.text());
const document = parseWireSpecDocument(source, "screens/login.wirespec.md");
const sourceMap = buildSourceMap(document, {
  entryFile: "screens/login.wirespec.md",
  variantRefs: buildVariantRefs(document),
});

document.body.innerHTML = renderDocumentSelection(document, {
  state: "error",
  breakpoint: "mobile",
}, {
  includeDocumentShell: false,
  includeAcceptance: true,
});

mountReviewRuntime({
  sourceMap,
  variantKey: "mobile+error",
});
```

## Browser -> IDE -> agent loop

- **Browser:** reviewer comments on a real target and exports annotations or tasks
- **IDE:** tasks include `vscode://file/...:line:column` links when the source span is known
- **Agent:** exported tasks already carry severity, scope, taxonomy, target id, wire id, variant key, requested change, and source location

## Running the package

```bash
npm run build
npm run test
npm run generate:examples
```

## Key generated outputs

### Login
- `outputs/login.review-runtime.html`
- `outputs/login.annotations.json`
- `outputs/login.agent-tasks.json`

### Review surface
- `outputs/review-surface.review-runtime.html`
- `outputs/review-surface.annotations.json`
- `outputs/review-surface.agent-tasks.json`

## Current limits

- no multi-user presence
- no freehand canvas markup
- no automatic file writes back from the browser into the repository
- no automatic thread resolution after code changes

That last point is deliberate. The runtime makes feedback structured and portable without hiding code changes behind browser-only state.
