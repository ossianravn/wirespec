# WireSpec annotation model v0.1

## Position

Annotations should be part of the product from early on because the whole point of WireSpec is to tighten the loop between **agreement** and **implementation**.

But annotations should not mutate the structural grammar directly.

Use this split:

- **WireSpec document** = the UI source of truth
- **annotation sidecar** = review state attached to that source of truth
- **resolved preview** = rendered wireframe with overlay pins, filters, and thread UI

## Why a separate layer wins

### 1. Cleaner authoring
The base screen spec stays focused on structure, states, and acceptance.

### 2. Better stability for agents
Agents can read a clean tree plus a clean list of review tasks instead of parsing comments mixed into layout nodes.

### 3. Better browser ergonomics
A review session can create, update, and resolve threads without rewriting the Markdown file on every click.

### 4. Better git behavior
You can diff screen structure separately from review feedback.

## Target levels

Annotations need more than one target level.

### A. Document / screen level
Use when feedback applies to the overall job or hierarchy.

Examples:
- “The primary action is unclear.”
- “This screen probably needs an empty state.”

### B. Section / prose level
Use when feedback refers to `Intent`, `Acceptance`, or `Notes` rather than a rendered element.

Examples:
- “Add an acceptance rule for keyboard-only completion.”
- “Intent should mention account lockout.”

### C. Node level
Use when feedback attaches to a semantic WireSpec node id.

Examples:
- `submit`
- `primary-actions`
- `results-list`

This should be the default review target.

### D. Variant-scoped node level
Use when feedback is only valid in a given state or breakpoint.

Examples:
- `node=submit` only in `state=error`
- `node=filters-drawer` only in `breakpoint=mobile`

### E. Render-region level
Use sparingly when a human reviewer is pointing at a visual sub-region that does not map neatly to a single node.

Examples:
- alignment between two nodes
- spacing between stacked elements
- clipping or overflow area

Render-region anchors should always include a semantic anchor when possible.

## Anchor strategy

Use layered anchors in this order:

1. `node-id` or `acceptance-id`
2. selected variant scope (`state`, `breakpoint`, `theme`, `mode`)
3. DOM selector derived from renderer output
4. source span in the Markdown file
5. optional render-region snapshot

The first successful anchor is enough to open the thread, but tools should keep all available anchors for resilience.

## Thread model

An annotation is a **thread** with metadata and one or more messages.

Recommended fields:

- `id`
- `title`
- `status`
- `severity`
- `motivation`
- `category`
- `taxonomy`
- `target`
- `messages`
- `suggestedOps`
- `createdAt`
- `updatedAt`

## Status lifecycle

Recommended v0.1 statuses:

- `open`
- `accepted`
- `in-progress`
- `resolved`
- `wontfix`

Rules:

- new browser comments default to `open`
- when a human or agent attaches a concrete fix plan, status may move to `accepted`
- when a patch is being generated or applied, move to `in-progress`
- only a human reviewer or explicit rule should mark a thread `resolved`
- `wontfix` requires a resolution note

## Motivation

Keep the set small and explicit:

- `note`
- `question`
- `change-request`
- `issue`
- `approval`
- `blocking`

## Category

Recommended categories:

- `layout`
- `copy`
- `behavior`
- `a11y`
- `responsive`
- `fidelity`
- `content`
- `state`
- `navigation`
- `visual`
- `data`

## Proper UI taxonomy bridge

Optionally attach issue ids from the Proper UI rubric.

Examples:

- `LAY-02` for spacing / alignment / hierarchy problems
- `LAY-10` for breakpoint collapse
- `FID-02` for design-system drift
- `QA-02` for missing states
- `QA-03` for task clarity

This is useful because it turns taste-level feedback into a reusable machine tag.

## Suggested ops

Annotations may include optional structural fix hints.

These should reuse the existing variant op vocabulary where possible:

- `patch`
- `show`
- `hide`
- `remove`
- `insert`

Examples:

- patching a button label
- showing an existing error alert
- hiding a secondary panel on mobile
- inserting a mobile-only helper note

Suggested ops are **advisory**, not authoritative. They are there to help agents and humans converge faster.

## Agent behavior

An agent should process annotations in this order:

1. load the base WireSpec AST
2. load open annotation threads
3. group by severity, target, and variant scope
4. separate structural tasks from copy-only tasks
5. propose the smallest patch set that addresses the highest-priority open threads
6. report which annotation ids were addressed and which were not
7. never auto-resolve a thread without an explicit rule or user instruction

## Merge behavior

If a node id disappears after a screen edit:

1. try to relocate by source span
2. try to relocate by DOM selector
3. try to relocate by title / text quote hints
4. if still unresolved, mark the thread `orphaned=true` and surface it in review mode

Do not silently drop orphaned annotations.

## v0.1 scope

Ship in scope:

- screen-level comments
- node-level comments
- state and breakpoint scoping
- open / resolved flow
- browser pins
- editor deep links
- agent-readable sidecar

Keep out of scope for the first implementation:

- arbitrary freehand drawing
- canvas arrows and sketch layers
- audio or video comments
- multi-file cross-screen dependency graphs
- automatic conflict resolution between competing comments
