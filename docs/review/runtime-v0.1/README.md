# WireSpec annotation runtime pack v0.1

This pack turns the review-layer concept into a **concrete implementation slice**.

The goal is not full collaboration software yet. The goal is to make page, section, and element feedback work cleanly across:

- browser preview
- terminal or IDE authoring
- coding-agent patch loops

## What this pack adds

- a richer **source-map format** that indexes screen, section, prose, acceptance, and element targets
- a **browser ↔ IDE event contract** for creating threads and opening source
- an **agent-task export** format that turns open review threads into bounded work items
- a **minimal review overlay spec** shaped by Proper UI principles
- a small **TypeScript skeleton** for target resolution, thread storage, task export, and editor deep links

## Main recommendation

Treat annotations as a review runtime around the WireSpec source, not as inline clutter in the structural grammar.

That gives you:

- a deterministic structural AST for agents
- a human-friendly browser review layer
- a clean way to export actionable tasks to the terminal

## Target model

This pack supports these review levels:

- **page** → `scope=screen`
- **section** → `scope=section`
- **element** → `scope=element`
- **prose / acceptance** → `scope=prose` and `scope=acceptance`
- **region fallback** → `scope=region`

Section and element targeting use stable semantic ids first.
Region comments stay available, but secondary.

## File guide

- `implementation-slice.md` — what to ship first and why
- `source-map-v0.1.schema.json` — canonical target index format
- `annotation-events-v0.1.schema.json` — browser / IDE event envelopes
- `agent-tasks-v0.1.schema.json` — normalized agent handoff format
- `browser-ide-protocol.md` — practical event flow
- `merge-and-relink-algorithm.md` — how comments survive edits
- `review-overlay-interactions.md` — the review surface behavior
- `review-overlay-audit.md` — Proper UI rubric audit of the review surface
- `typescript/` — strict TypeScript reference implementation
- `examples/` — sample source map, events, agent tasks, and a WireSpec review surface

## Recommended implementation order

1. Emit the richer target source map from the parser
2. Emit `data-ws-*` hooks from the renderer
3. Add the browser overlay with thread creation only
4. Add source opening from target spans
5. Add agent export and relinking
6. Add resolution workflow and optional thread drawer

## Definition of done for this slice

- A reviewer can click the page background, a section, or an element and create a thread with the correct target scope.
- The thread can open the right source line in the editor.
- The terminal can list open feedback as structured tasks without guessing what the comment refers to.
- After a screen edit, the runtime can keep or relink the thread instead of silently dropping it.
