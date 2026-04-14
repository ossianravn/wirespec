# Annotation roadmap

## Phase 1 — essential review loop

Ship these first:

- node-level and screen-level threads
- open / resolved status
- comment mode overlay in browser preview
- source map and editor deep link
- canonical JSON sidecar
- optional Markdown projection export
- filter by active state and breakpoint

Success condition:
A user can click a rendered wireframe element, leave feedback, have an agent act on it, and review the result without losing the thread.

## Phase 2 — stronger agent ergonomics

Add next:

- suggested ops attached to threads
- taxonomy ids from UX / QA rubric
- thread grouping by severity and target area
- per-thread “generate patch proposal” action
- orphaned-thread handling

Success condition:
Agents can translate open feedback into bounded, reviewable patch proposals.

## Phase 3 — richer review fidelity

Add later:

- render-region comments
- screenshot snapshot on creation
- compare-before-after view for a selected thread
- threaded review exports for PR descriptions
- integrations with Storybook or design review surfaces

Success condition:
Teams can use WireSpec review mode as a genuine handoff surface, not just a scratchpad.

## Phase 4 — external system bridges

Possible later integrations:

- import/export with design review tools
- sync selected annotations to ticket systems
- external comment mirrors for Figma / Penpot / Storybook workflows

Success condition:
WireSpec can sit inside existing product-design loops without becoming a silo.
