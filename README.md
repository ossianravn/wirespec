# WireSpec consolidated repo

This is the **single handoff package** for the full WireSpec solution created in this thread.

It is designed to let you continue working **outside this environment** without needing to chase earlier zips, missing docs, or superseded slices.

## What is canonical now

Treat **this repo folder** as the canonical handoff going forward.

Inside it, the most important current sources of truth are:

- `docs/spec/v1-rc0/` — current language direction, grammar, AST schema, semantics, vocabulary, and canonical screens
- `packages/runtime/` — parser, resolver, semantic renderer, source map, sidecar model, review runtime, and generated examples
- `packages/bridge/` — localhost bridge that saves annotations and agent tasks into `.wirespec/reviews`
- `packages/core/` — shared cross-IDE watcher, resolver, task selection, and audit logic
- `packages/vscode/` — thin VS Code companion over the shared core
- `packages/jetbrains/` — thin JetBrains companion skeleton over the shared core
- `demo-workspace/` — working sample workspace for the IDE layer
- `references/proper-ui/` — the Proper UI skill materials used as the design-quality constraint

## What is included

### Active implementation packages

- `packages/runtime` from `wirespec_review_runtime_v0_2`
- `packages/bridge` from `wirespec_local_bridge_v0_3`
- `packages/core`, `packages/vscode`, `packages/jetbrains` from `wirespec_cross_ide_companions_v0_5`

### Design and specification docs

- `docs/spec/v1-reference` from the first v1 language pack
- `docs/spec/v1-rc0` from the continuation pack
- `docs/review/model-v0.1` from the annotation concept pack
- `docs/review/runtime-v0.1` from the annotation runtime pack
- `docs/full-solution/README.md` from the consolidated solution README
- `docs/architecture/` from the cross-IDE slice

### Preserved history and provenance

- `archive/historical-slices/parser-renderer-adapter-v0.1`
- `archive/historical-slices/vscode-ide-companion-v0.4`
- `archive/original-packs/*.zip` with the original pack archives from the thread

## Recommended place to start

1. Read `docs/full-solution/README.md` for the end-to-end product framing.
2. Read `docs/spec/v1-rc0/README.md` plus `grammar-v1-rc0.ebnf`, `wirespec-ast-v1-rc0.schema.json`, `semantics-v1.md`, and `vocabulary-v1.md`.
3. Open `packages/runtime/README.md` to understand the current parser / renderer / review-runtime implementation.
4. Open `packages/bridge/README.md` to see how browser review is persisted into repo files.
5. Open `packages/core/README.md` and then `packages/vscode/README.md` / `packages/jetbrains/README.md` for the IDE loop.
6. Use `demo-workspace/` as the starting fixture when continuing development.

## Quick commands

From the repo root:

```bash
npm run test
npm run generate:examples
```

More targeted:

```bash
npm run test:core
npm run test:runtime
npm run test:bridge
npm run generate:cross-ide
npm run generate:runtime
npm run generate:bridge
```

## Honest status

This repo is now a **single consolidated handoff**, but it is still composed of sequential slices that were originally created in stages.

So:

- it **does include everything needed to continue**
- it **does preserve the earlier packs and design docs**
- it **does not pretend all parts were fully refactored into one polished production monorepo**

That means the repo is suitable as a continuation base, while still keeping the original artifacts for traceability.

## Best next engineering move

If you want one fully unified codebase after this handoff, the next step is to refactor the active packages into a tighter monorepo contract:

- promote shared schemas and types into common packages
- wire `packages/runtime` outputs directly into `packages/bridge`
- formalize CLI entrypoints for compile / render / review
- make the IDE companions consume the same published core package instead of path coupling
- add end-to-end demo scripts that run browser review -> bridge save -> IDE resolve in one loop
