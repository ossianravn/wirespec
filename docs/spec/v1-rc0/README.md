# WireSpec v1 continuation pack

This pack moves the first draft toward a **v1 rc0 authoring contract**.

It adds five concrete pieces:

1. a **frozen core vocabulary** instead of a merely recommended one
2. a tighter **EBNF grammar** with list literals and extension naming rules
3. a stricter **AST schema** with reserved kinds plus `x-...` extension support
4. an **agent authoring guide** and **parser / formatter roadmap**
5. **10 canonical reference screens** that act as parser, renderer, and UX fixtures

## Positioning

WireSpec remains:

- Markdown-hosted, using CommonMark fenced code blocks
- low-fidelity by default
- semantic rather than pixel-positioned
- task-first and product-appropriate
- deterministic enough for coding agents to edit safely

The continuation pack also hardens a few design choices that were still soft in the first draft:

- reserved node kinds are now explicit
- custom nodes must use the `x-` prefix
- variant composition has a fixed precedence order
- `patch`, `show`, `hide`, `insert`, and `remove` have defined resolver semantics
- arrays are now a first-class literal in the grammar
- interactive and targetable nodes have stricter id requirements

## Variant precedence

When a renderer resolves more than one variant at the same time, apply them in this order:

1. `mode`
2. `theme`
3. `breakpoint`
4. `state`

Within a variant, operations are applied in source order. Later operations override earlier ones when they touch the same property.

## What is intentionally still out of scope for v1

- absolute positioning
- raw CSS or utility-class embedding
- full design-token values in the source syntax
- WYSIWYG editing
- arbitrary HTML inside `wirespec` blocks
- multi-root screens
- freeform natural language inside the structural block

## Files in this pack

- `grammar-v1-rc0.ebnf` — tightened language grammar
- `wirespec-ast-v1-rc0.schema.json` — rc0 AST contract
- `vocabulary-v1.md` — frozen core node and prop vocabulary
- `semantics-v1.md` — resolver rules, invariants, and validation
- `agent-authoring-guide.md` — how humans and agents should edit WireSpec safely
- `parser-formatter-roadmap.md` — implementation sequence and diagnostics
- `canonical-screen-index.md` — coverage map for the 10 fixtures
- `screens/*.md` — canonical reference screens
- `examples/*.json` — sample parsed and resolved AST outputs

## Why the fixtures matter

The 10 screens are not demo fluff. They are intended to become:

- parser fixtures
- formatter round-trip fixtures
- renderer fixtures
- UX lint fixtures
- agent-edit fixtures

Each screen is deliberately task-first and avoids generic AI dashboard habits:
no KPI filler rows, no fake analytics, no ornamental chrome, and no layout shells that distract from the actual job.

## Suggested implementation order

1. host Markdown parser integration
2. `wirespec` block lexer + parser
3. AST validator
4. canonical formatter
5. variant resolver
6. HTML / SVG wireframe renderer
7. linter packs
8. code adapters and Storybook export
