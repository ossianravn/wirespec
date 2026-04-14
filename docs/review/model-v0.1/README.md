# WireSpec annotation continuation pack

This pack adds a **review and annotation layer** to the WireSpec v1 rc0 work.

## Recommendation

Build annotations as a **first-class but separate layer**.

Do **not** mix review threads into the base structural tree. Keep the tree clean for authoring, parsing, resolving, and code generation. Store review data in a sidecar model and project it into the browser preview and IDE.

That choice keeps all three audiences happy:

- **humans** can comment directly on a rendered page or element
- **agents** can consume stable, structured targets and thread metadata
- **parsers / renderers** can keep the structural grammar small and deterministic

## What is in this pack

- `annotation-model-v0.1.md` — data model, target levels, lifecycle, and agent behavior
- `annotation-markdown-projection.ebnf` — optional Markdown projection for review threads
- `wirespec-annotation-sidecar-v0.1.schema.json` — canonical machine-readable storage
- `review-mode-ui.md` — browser review UI concept aligned with Proper UI principles
- `browser-ide-loop.md` — how preview, filesystem, editor, and agent stay in sync
- `roadmap-annotation.md` — phased implementation plan
- `examples/login.annotations.json` — example sidecar for the login fixture
- `examples/login.review.md` — example review projection next to a screen spec
- `annotation-fixtures-index.md` — review fixture coverage for the 10 canonical screens

## Key decisions

1. **Canonical storage is JSON sidecar**
   - best for browser tooling and agents
2. **Optional Markdown projection exists for PR review and manual editing**
   - good for git diffs and lightweight authoring
3. **Targets are semantic first**
   - `screenId`, `nodeId`, `acceptanceId`, and selected variants
4. **DOM selectors and region snapshots are fallback anchors**
   - useful when a rendered review session needs extra resilience
5. **Comments are threads, not one-off notes**
   - supports question -> reply -> proposed patch -> resolution
6. **Suggested ops are optional**
   - lets a human or agent attach concrete `patch` / `show` / `hide` / `insert` ideas to a thread

## Proper UI alignment

The review UI in this pack intentionally avoids:

- permanent filler side rails
- dashboard-style chrome
- decorative analytics
- badge spam
- ornamental panels

Review mode should feel like a calm task layer over the page, not like a separate product.
