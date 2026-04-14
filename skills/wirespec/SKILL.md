---
name: wirespec
description: Work with WireSpec Markdown UI specifications and review artifacts. Use when creating, editing, validating, or adopting `.wirespec.md` files; turning product/UI requests into WireSpec before code; resolving WireSpec annotation sidecars or agent tasks under `.wirespec/reviews`; running WireSpec parser/runtime/bridge/core commands; or using WireSpec as an agent-facing contract in another repository.
---

# WireSpec

## Core Rule

Treat WireSpec as the contract between product intent, review feedback, and implementation. Inspect existing specs, review files, and UI code before editing. Make the smallest coherent change to the spec or implementation, preserve stable ids, and keep end-user-facing copy free of agent/developer context.

## Quick Start

1. Run `scripts/inspect_wirespec_repo.mjs <repo-root>` to see whether the target repo already has WireSpec files, review tasks, package scripts, or runtime packages.
2. If editing an existing spec, read its frontmatter, `Intent`, base `wirespec` block, variants, and `Acceptance` before changing code.
3. If introducing WireSpec, create a `.wirespec.md` screen/component spec first; use `assets/screen.wirespec.md` as a starter if helpful.
4. Keep base blocks for default structure; use variants for loading, error, empty, selected, disabled, theme, mode, and breakpoint changes.
5. If review tasks exist under `.wirespec/reviews/*.agent-tasks.json`, prioritize those tasks and update/resolve them through the repo's existing WireSpec commands.

## Workflow Decision Tree

**Creating or changing a UI before implementation?**

- Author or update the WireSpec first.
- Use semantic nodes and acceptance criteria to lock down task flow, hierarchy, states, and breakpoints.
- Only then modify UI code if the user asked for implementation.
- Read `references/authoring.md` for syntax and editing rules.

**Repo already has WireSpec runtime/bridge/core tooling?**

- Prefer local package scripts and `packages/core/bin/wirespec-ide-core.js` over inventing new commands.
- Run the repo's tests/generation commands after changes.
- Read `references/review-loop.md` for annotation and task-file handling.

**Repo does not have WireSpec yet?**

- Add specs without over-integrating first, unless the user asks to wire runtime tooling.
- Put specs near the feature or under a clear `wirespec/`, `docs/wirespec/`, or `.wirespec/specs/` directory according to local conventions.
- Read `references/adoption.md` for setup options and boundaries.

**Working from review feedback or agent tasks?**

- Treat `.wirespec/reviews/*.agent-tasks.json` as actionable work items.
- Open the target file/line when provided.
- Preserve annotation sidecar structure; avoid hand-editing ids unless relinking is the task.
- Resolve only the threads actually addressed.

## Authoring Guardrails

- Preserve node ids unless semantic identity changes.
- Use the frozen core vocabulary before adding `x-...` extension nodes.
- Keep one node or operation per line.
- Keep prose outside fenced `wirespec` blocks.
- Do not embed raw CSS, utility classes, pixel positioning, or implementation-only component names.
- Do not duplicate whole subtrees for state or responsive changes; use `patch`, `show`, `hide`, `insert`, or `remove`.
- Cover meaningful states and breakpoints, not only the happy path.
- Keep WireSpec low-fidelity and task-first; do not add fake KPI strips, ornamental rails, dashboard filler, or decorative product theater.

## Useful Resources

- `references/authoring.md`: syntax, vocabulary, variants, operations, and examples.
- `references/review-loop.md`: annotation sidecars, agent tasks, bridge/core commands, and resolution flow.
- `references/adoption.md`: how to introduce WireSpec into another repo with minimal coupling.
- `assets/screen.wirespec.md`: starter screen template.
- `scripts/inspect_wirespec_repo.mjs`: repo scanner for WireSpec files, review files, scripts, and packages.

## Output Expectations

When producing a WireSpec deliverable, include:

- the changed or created spec path
- the selected states/breakpoints covered
- any assumptions about source UI, route, or component mapping
- verification commands run, or a clear note if no local tooling exists

For implementation work driven by WireSpec, report both the spec change and the code change. Do not claim review threads are resolved unless the sidecar/tasks were actually updated by the repo workflow.
