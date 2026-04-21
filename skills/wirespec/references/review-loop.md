# Review Loop Reference

Use this when working with annotations, agent tasks, bridge saves, or IDE-style resolution.

## Files

Default review directory:

```text
.wirespec/reviews/
```

Common files:

```text
<documentId>.annotations.json
<documentId>.agent-tasks.json
events.ndjson
ide.events.ndjson
```

Annotation sidecars store review threads. Agent task exports store actionable open work for agents and IDE companions.

## Task Handling

1. Find task files:

```bash
find . -path '*/.wirespec/reviews/*.agent-tasks.json' -print
```

2. Read tasks and prioritize by severity/order.
3. Open `openInEditor.file`, `line`, and `column` when present.
4. Make the smallest implementation/spec change that addresses that thread.
5. Use local WireSpec core commands to resolve threads when available.

## Core CLI Pattern

If the repo has `packages/core/bin/wirespec-ide-core.js`, prefer:

```bash
node packages/core/bin/wirespec-ide-core.js summary --workspace <workspace>
node packages/core/bin/wirespec-ide-core.js open-next --workspace <workspace>
node packages/core/bin/wirespec-ide-core.js resolve-on-save --workspace <workspace> --saved-file <file> --ranges <start-end>
```

If WireSpec is installed as a package in a consumer repo, the equivalent commands are:

```bash
pnpm exec wirespec lint path/to/screen.wirespec.md
pnpm exec wirespec format path/to/screen.wirespec.md
pnpm exec wirespec summary --workspace <workspace>
pnpm exec wirespec open-next --workspace <workspace>
pnpm exec wirespec resolve-on-save --workspace <workspace> --saved-file <file> --ranges <start-end>
```

Do not hand-remove tasks unless no resolver exists and the user explicitly accepts manual maintenance.

## Bridge Pattern

If the repo has `packages/bridge`, typical commands are:

```bash
npm --prefix packages/bridge test
npm --prefix packages/bridge run generate:examples
node packages/bridge/src/cli-bridge-server.js --workspace <workspace> --port 4317
node packages/bridge/src/cli-bridge-watch.js --url http://127.0.0.1:4317/api/events
```

The bridge should write review state inside the workspace root only.

## Resolution Rules

- Resolve only the thread that was actually fixed.
- Keep sidecar ids stable.
- Preserve source anchors when possible.
- If a target moved, prefer relinking against semantic ids or source map targets rather than inventing new thread ids.
- Report unresolved tasks explicitly.

## UI Review Copy Rule

Review UI text is for reviewers, not implementers. Keep raw file paths, target ids, and bridge details out of visible UI unless they are in a details/debug area. Agent task JSON can keep the full technical detail.
