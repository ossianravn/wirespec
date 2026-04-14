# Adoption Reference

Use this when bringing WireSpec into another repository.

## Minimal Adoption

Start with specs only when the repo has no WireSpec tooling:

```text
docs/wirespec/<screen>.wirespec.md
```

or, if the repo already uses hidden workflow folders:

```text
.wirespec/specs/<screen>.wirespec.md
```

Prefer the local repo's documentation convention. Do not create a large monorepo structure unless asked.

## First Spec Workflow

1. Inspect the relevant route/component and nearby UI patterns.
2. Create one WireSpec file for the screen/component.
3. Include frontmatter with `id`, `route` when known, and `component` when known.
4. Write `Intent` and `Acceptance` in reviewer language.
5. Write one base block and the minimum useful variants.
6. Keep implementation-specific details out of the spec unless needed for mapping.

## Tooling Adoption

Only add runtime/bridge/core tooling when the user wants rendering, browser review, or IDE resolution.

Conservative setup options:

- Add specs only.
- Add parser/runtime package for HTML previews.
- Add bridge for browser review persistence.
- Add core/IDE workflow for task discovery and save-driven resolution.

Prefer existing package manager and scripts. If no package structure exists, propose the smallest setup before editing.

## Suggested Scripts

Use local naming conventions, but these scripts are a reasonable target:

```json
{
  "scripts": {
    "wirespec:test": "node --test packages/core/test/*.test.js",
    "wirespec:generate": "npm --prefix packages/runtime run generate:examples",
    "wirespec:bridge": "node packages/bridge/src/cli-bridge-server.js"
  }
}
```

Do not add scripts that point to missing packages.

## Handoff To Agents

When a coding agent works from WireSpec:

- Read the spec before code.
- Respect stable ids and acceptance criteria.
- Use review tasks as bounded implementation requests.
- Keep end-user copy clean; do not mention prompts, agents, review sidecars, or developer debate in deliverables.
- After implementation, report which WireSpec states and review tasks were covered.
