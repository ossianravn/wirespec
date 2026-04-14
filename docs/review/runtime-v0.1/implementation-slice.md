# Implementation slice: annotation runtime v0.1

## Goal

Make review feedback **operational**.

That means each comment should become:

1. a precise target in the preview
2. a stable anchor in source
3. a bounded task for a human or coding agent

## Scope for v0.1

### In scope

- `screen`, `section`, `element`, `prose`, `acceptance`, and `region` targets
- canonical JSON source map
- canonical JSON review sidecar
- browser event envelopes
- editor deep link generation
- agent task export
- orphan detection and simple relinking
- a minimal review surface

### Out of scope

- multiplayer presence
- arbitrary freehand markup
- audio comments
- comment analytics
- workflow boards for review triage
- automatic comment resolution

## Runtime architecture

```text
WireSpec source (.md)
  -> parser
     -> AST
     -> target source map (.targets.json)
  -> resolver
     -> resolved variants
  -> renderer
     -> DOM with data-ws-* hooks
  -> review overlay
     -> review events
     -> annotation sidecar (.annotations.json)
  -> CLI / IDE / agent
     -> open source
     -> list open threads
     -> export tasks
```

## Why the source map has to expand

A node-only source map is not enough for real review.

People will comment on:

- the whole page
- a specific card or section
- a specific element
- the `Intent` or `Acceptance` prose
- the gap or alignment between elements

So the source map needs a **general target index**, not only node spans.

## Target id convention

Use stable target ids with explicit prefixes:

- `screen:login`
- `node:auth-card`
- `node:submit`
- `prose:intent`
- `acceptance:login-01`
- `region:generated-id` (runtime only)

## Browser targeting rules

### Click background
Create a `screen` target.

### Click meaningful container
Create a `section` target.

### Click leaf or control
Create an `element` target.

### Alt-click
Bubble up to the nearest meaningful parent target.

### Shift-drag
Create a `region` comment with a normalized rect and optional nearest semantic anchor.

## Export rules for agents

The agent export should include:

- thread id
- severity
- category
- taxonomy ids
- screen id
- target id and wire id
- variant key when present
- latest requested change
- suggested ops when available
- open-in-editor location

This is enough for an agent to make a bounded patch proposal.

## Minimal build order

### Step 1 — source map and renderer hooks
Nothing else matters if the runtime cannot map a click back to source.

### Step 2 — thread creation and storage
Allow creating and persisting threads, but keep the UI intentionally small.

### Step 3 — editor links
Once a thread exists, the author must be able to jump to the exact line quickly.

### Step 4 — agent export
Now the terminal and agent can act on the same structured feedback.

### Step 5 — relinking
Only after the loop works should you add smarter orphan repair.

## Acceptance for v0.1

- Threads stay attached across rerenders.
- Removed ids become `orphaned=true`, not silently deleted.
- The review surface stays centered on the wireframe, not on tooling chrome.
- Mobile review keeps preview space dominant and collapses secondary review surfaces.
