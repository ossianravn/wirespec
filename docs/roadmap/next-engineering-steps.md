# Next Engineering Steps

## 1. Add an End-to-End Demo/Test Script

Status: complete. Added `tools/e2e-demo.mjs`, `npm run test:e2e`, and `npm run demo:e2e`.

Follow-up complete: the e2e now preserves implementation `source-span` anchors through bridge relinking and resolves saved changes against `src/features/auth/LoginCard.tsx`, not only the WireSpec fixture.

Create one command that proves the whole WireSpec workflow is intact:

1. Parse a WireSpec fixture.
2. Render the selected runtime preview and source map.
3. Save reviewer feedback through the local bridge API.
4. Persist `.wirespec/reviews` annotation and task files.
5. Ask the IDE core for the next task.
6. Resolve touched feedback through `resolve-on-save`.

This turns the repo from a set of locally passing packages into a product workflow that can be demonstrated and guarded by tests.

## 2. Unify the Review Data Contract

Status: first pass complete. Added `packages/review-contract` as the shared source for review versions, statuses, severity ranking, sidecar schema, active/closed status helpers, and review UI copy/status behavior.

Follow-up complete: generated examples now use deterministic review ids, event ids, timestamps, and normalized workspace paths so repeated `npm run generate:examples` runs do not create avoidable churn.

Before more annotation UI refactoring, promote the shared review contract across:

- `packages/runtime`
- `packages/bridge`
- `packages/core`

The shared contract should cover annotation sidecars, agent tasks, thread status values, source anchors, severity ranking, and exported task shape. This reduces schema drift more effectively than more UI polish.

## 3. Consolidate Annotation UI Behavior

Status: first pass complete. Bridge and runtime now consume shared review UI copy and status transition helpers. Deeper consolidation of rendering/layout primitives remains open.

Follow-up complete: added browser-safe review contract primitives for toolbar and composer markup. Bridge and runtime now render those shared primitives instead of carrying separate copies of the same reviewer-facing form and toolbar structure.

Follow-up complete: extracted shared thread-card, badge, latest-message, summary, and thread-action primitives. Bridge and runtime still keep their own layout classes and actions, but no longer hand-roll the same annotation card markup and escaping rules.

The bridge and runtime annotation UIs are still separate implementations. After the data contract is stable, consolidate the shared behavior, labels, state rules, and reviewer-facing copy so the two surfaces do not drift again.

The goal is not to expose implementation detail to reviewers. The review UI should stay focused on adding notes, finding open feedback, and saving structured work for the developer loop.
