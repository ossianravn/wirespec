# WireSpec

WireSpec is a Markdown-native UI specification and review workflow for teams building interfaces with coding agents.

It gives product, design, and engineering a small text format for describing screens before implementation, rendering low-fidelity previews, collecting structured browser feedback, and turning that feedback into actionable repo files.

WireSpec is useful when a normal prompt is too loose, but a high-fidelity design file is more than the work needs.

## Why Use It

Coding agents are fast at producing UI, but they need a precise target. A prose prompt often leaves too much unstated: layout hierarchy, empty states, loading behavior, breakpoints, primary actions, error copy, and what should stay unchanged.

WireSpec puts a reviewable contract between intent and code:

1. Write the screen in Markdown with a fenced `wirespec` block.
2. Render a semantic low-fidelity preview.
3. Review page, section, and element feedback in the browser.
4. Save annotations into `.wirespec/reviews`.
5. Give coding agents bounded tasks instead of vague comments.
6. Resolve review threads as implementation changes land.

## Install

Install directly from GitHub:

```bash
pnpm add -D wirespec@github:ossianravn/wirespec
```

Requires Node.js 18 or newer.

## Quick Start

Create a screen spec:

````md
---
id: login
route: /login
component: src/features/auth/LoginCard.tsx
---

# Login

## Intent
Allow a returning user to sign in with a work email and password.

```wirespec v=1 kind=base
screen id=login route="/login" title="Sign in"
  main id=content align=center justify=center padding=lg
    card id=auth-card max=sm
      heading id=title level=1 text="Welcome back"
      form id=login-form submit=sign-in
        field id=email type=email name=email label="Work email" required=true
        field id=password type=password name=password label="Password" required=true
        actions id=primary-actions
          button id=submit variant=primary action=submit label="Sign in"
```

```wirespec v=1 kind=state name=loading
patch target=submit label="Signing in..." busy=true disabled=true
patch target=login-form disabled=true
```

## Acceptance
- The email field is focused first.
- The submit button is disabled while sign-in is pending.
- Error copy appears near the form, not in a global notification.
````

Inspect a repo for existing WireSpec files and review tasks:

```bash
pnpm exec wirespec-inspect .
```

Ask for the current review summary:

```bash
pnpm exec wirespec summary --workspace .
```

Start the local review bridge:

```bash
pnpm exec wirespec-bridge --workspace . --port 4317
```

Watch review events from another terminal:

```bash
pnpm exec wirespec-bridge-watch --url http://127.0.0.1:4317/api/events
```

Run the full repository proof loop locally:

```bash
pnpm run demo:full
```

## Runtime API

The package exposes the parser, resolver, renderer, source-map builder, review runtime, and task export utilities.

```ts
import {
  buildSourceMap,
  buildVariantRefs,
  formatWireSpecDocument,
  lintWireSpecQuality,
  lintWireSpecDocument,
  mountReviewRuntime,
  parseWireSpecDocument,
  renderDocumentSelection,
} from "wirespec";

const source = await fetch("/screens/login.wirespec.md").then((response) => response.text());
const document = parseWireSpecDocument(source, "screens/login.wirespec.md");
const sourceMap = buildSourceMap(document, {
  entryFile: "screens/login.wirespec.md",
  variantRefs: buildVariantRefs(document),
});

const lint = lintWireSpecDocument(document);
if (!lint.ok) {
  console.error(lint.diagnostics);
}
const qualityWarnings = lintWireSpecQuality(document);

const canonicalSource = formatWireSpecDocument(document);

document.body.innerHTML = renderDocumentSelection(
  document,
  { state: "loading", breakpoint: "mobile" },
  { includeDocumentShell: false, includeAcceptance: true },
);

mountReviewRuntime({
  sourceMap,
  variantKey: "mobile+loading",
});
```

`lintWireSpecDocument` includes syntax, vocabulary, and Proper UI quality warnings. If you only want structural linting in code, pass `{ includeQualityWarnings: false }` or call `lintWireSpecQuality(document)` separately.

## Core Concepts

**WireSpec document**

A Markdown file that combines normal product prose with one base `wirespec` block and optional variants. The prose explains intent and acceptance. The fenced blocks define structure and states.

**Base tree**

The default screen structure. It uses semantic nodes such as `screen`, `main`, `card`, `heading`, `form`, `field`, `actions`, `button`, `panel`, `table`, and `dialog`.

**Variants**

State, breakpoint, theme, or mode changes applied on top of the base tree. Variants use operations such as `patch`, `show`, `hide`, `insert`, and `remove` instead of duplicating the whole screen.

**Source map**

A mapping from rendered targets back to WireSpec source spans. This lets review feedback attach to the full page, a section, an element, prose, or acceptance criteria.

**Annotation sidecar**

A JSON file containing structured review threads. Review feedback stays outside the source spec so the UI contract remains readable.

**Agent tasks**

A normalized export of open review threads. Tasks include target ids, severity, source locations when available, requested changes, and editor-open metadata.

**Local bridge**

A localhost server that lets browser review tools write annotation sidecars, agent tasks, and event logs into the repository.

## Review Files

By default, the bridge writes review artifacts under:

```text
.wirespec/reviews/<documentId>.annotations.json
.wirespec/reviews/<documentId>.agent-tasks.json
.wirespec/reviews/events.ndjson
```

These files are intended to be committed when review state should travel with the branch.

## Studio

Studio is still internal, but the current repo now includes three working layers:

- `packages/studio-core`: semantic AST edit engine with undo/redo and canonical projection refresh
- `packages/studio-web`: internal browser prototype for template-based editing, review mode, and state/breakpoint authoring
- `packages/studio-import-dom`: internal implementation drift comparison and DOM-to-WireSpec inference engine

The current Studio prototype supports:

- creating screens from the canonical templates
- editing the WireSpec tree without raw Markdown
- reviewing through the same annotation sidecar and bridge flow as the browser runtime
- comparing approved WireSpec against implementation HTML when `data-ws-id` hooks exist
- inferring a draft WireSpec baseline from semantic HTML when hooks do not exist

The compare/import workflow is intentionally conservative: drift can become review notes, and inferred drafts must be explicitly loaded before they replace the active Studio draft.

## CLI Commands

```bash
# Inspect WireSpec usage in a repo
pnpm exec wirespec-inspect .

# Lint a WireSpec document
pnpm exec wirespec lint screens/login.wirespec.md

# Print canonical formatting
pnpm exec wirespec format screens/login.wirespec.md

# Rewrite a file in canonical form
pnpm exec wirespec format --write screens/login.wirespec.md

# Summarize review task state
pnpm exec wirespec summary --workspace .

# Open the next highest-priority review task as JSON
pnpm exec wirespec open-next --workspace .

# Resolve threads touched by a saved file and changed line range
pnpm exec wirespec resolve-on-save --workspace . --saved-file src/App.tsx --ranges 21-35

# Run the browser review bridge
pnpm exec wirespec-bridge --workspace . --port 4317

# Watch bridge events
pnpm exec wirespec-bridge-watch --url http://127.0.0.1:4317/api/events
```

Useful package scripts for a consuming repo:

```json
{
  "scripts": {
    "wirespec:inspect": "wirespec-inspect .",
    "wirespec:summary": "wirespec summary --workspace .",
    "wirespec:bridge": "wirespec-bridge --workspace . --port 4317"
  }
}
```

## Authoring Rules

- Keep WireSpec low-fidelity and task-first.
- Preserve node ids unless the meaning of the node changes.
- Use variants for loading, error, empty, selected, disabled, and responsive states.
- Prefer the core vocabulary before adding `x-...` extension nodes.
- Keep one node or operation per line.
- Do not embed raw CSS, utility classes, pixel coordinates, or component-library internals.
- Do not duplicate whole subtrees to represent small state changes.
- Keep end-user copy in the spec free of implementation notes and review process details.

## Repository Layout

```text
docs/spec/v1-rc0/           Language grammar, AST schema, semantics, vocabulary, and examples
packages/runtime/           Parser, resolver, renderer, source maps, review runtime, task export
packages/bridge/            Local bridge server, browser client, event watcher
packages/core/              Review task discovery, prioritization, resolution, and audit events
packages/review-contract/   Shared review constants, schema, and helper functions
packages/studio-core/       Internal semantic edit engine for the future Studio surface
packages/studio-import-dom/ Internal DOM drift comparison and inference engine for Studio
packages/studio-web/        Internal browser prototype for semantic Studio editing
packages/vscode/            VS Code companion over the shared core
packages/jetbrains/         JetBrains companion skeleton over the shared core
skills/wirespec/            Agent instructions for using WireSpec in other repositories
```

## Development

Install dependencies:

```bash
pnpm install
```

Run the full test suite:

```bash
pnpm run test
```

Regenerate examples:

```bash
pnpm run generate:examples
```

Build a local package tarball:

```bash
pnpm run pack:local
```

Run the packed consumer-install smoke test after packing:

```bash
pnpm run test:consumer
```

## Project Status

WireSpec is early-stage. The current repository includes a working language draft, parser, resolver, renderer, browser review runtime, local bridge, review task format, and IDE-core workflow. It is ready for experimentation in real UI work, but package APIs and file formats may still change before a stable release.

Most complete today:

- Markdown-hosted WireSpec authoring
- v1 rc0 grammar, semantics, and vocabulary
- parser, resolver, renderer, and source-map generation
- internal Studio edit-core foundation
- internal Studio DOM compare/import engine
- internal Studio browser prototype
- browser annotation runtime
- local bridge persistence
- agent-task export
- shared IDE core and VS Code companion workflow

Still evolving:

- formatter and lint rules
- npm registry publishing
- IDE extension packaging
- code-generation adapters
- multi-user review
- long-term schema versioning guarantees

## License

WireSpec is released under the [MIT License](LICENSE).
