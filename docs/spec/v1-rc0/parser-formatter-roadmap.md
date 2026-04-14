# Parser and formatter roadmap

This roadmap keeps implementation incremental and testable.

## Milestone 1 — Markdown host integration

Goal:
locate `wirespec` fenced code blocks inside a CommonMark parse tree.

Deliverables:
- host document loader
- frontmatter extraction
- title and prose section collection
- block discovery for `wirespec`

Key diagnostics:
- `WS001` missing base block
- `WS002` more than one base block
- `WS003` invalid block info string

## Milestone 2 — WireSpec lexer and parser

Goal:
parse the contents of each `wirespec` block into syntax trees.

Deliverables:
- indentation-aware line parser
- scalar literal parsing
- list literal parsing
- node parsing
- variant operation parsing

Key diagnostics:
- `WS010` invalid indentation
- `WS011` tabs are not allowed
- `WS012` malformed attribute
- `WS013` malformed list literal
- `WS014` malformed insert block

## Milestone 3 — AST builder and schema validation

Goal:
emit the JSON AST and validate structural requirements.

Deliverables:
- id index
- required-prop validation
- root kind validation
- source span attachment

Key diagnostics:
- `WS020` duplicate id
- `WS021` missing required prop
- `WS022` invalid child kind
- `WS023` unsupported root kind
- `WS024` invalid custom node prefix

## Milestone 4 — Canonical formatter

Goal:
normalize source so agents and humans produce stable diffs.

Formatter rules:
- two spaces per indentation level
- one node / operation per line
- canonical attribute order
- double quotes only when necessary
- preserve source-order of sibling nodes
- preserve source-order of variants
- blank line between prose and each block kind

Key diagnostics:
- `WS030` formatter-normalizable source

## Milestone 5 — Variant resolver

Goal:
derive concrete trees for previews, tests, and adapters.

Deliverables:
- id-aware execution engine
- precedence ordering
- visibility handling
- insert / remove tree mutation

Key diagnostics:
- `WS040` unknown patch target
- `WS041` unknown insert ref
- `WS042` target removed earlier in the same pass
- `WS043` attempted id patch
- `WS044` insert introduced duplicate id

## Milestone 6 — Lints

Goal:
catch quality issues before code generation.

Initial lint packs:
- structural lint
- accessibility / label lint
- state completeness lint
- breakpoint completeness lint
- anti-generic layout lint
- design-system binding lint

Suggested diagnostics:
- `WS100` interactive node missing label
- `WS101` screen missing loading or error coverage
- `WS102` primary action unclear
- `WS103` breakpoint coverage incomplete
- `WS104` custom node should be core node
- `WS105` likely filler analytics or decorative badge noise

## Milestone 7 — Renderers

Goal:
give authors fast feedback without committing to production UI.

Recommended order:
1. plain HTML renderer
2. sketch-style HTML / SVG renderer
3. clean wireframe renderer
4. JSON export
5. Storybook story exporter

## Milestone 8 — Code adapters

Goal:
translate approved specs into framework-specific scaffolds.

Output targets can include:
- Storybook stories
- React / Vue / Svelte skeletons
- form test scaffolds
- accessibility test scaffolds

## Test strategy

Use the 10 canonical screens for:

- parse success tests
- format round-trip tests
- AST snapshot tests
- variant resolution tests
- renderer screenshots
- agent edit tasks

Each fixture should have at least:
- base parse
- one state resolution
- one breakpoint resolution
- one negative test where a targeted id is intentionally broken
