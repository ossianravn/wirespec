# Merge and relink algorithm

## Goal

When a screen changes, keep existing review threads attached if that is still reasonable.
Do not silently discard anything.

## Resolution order

For each thread target:

1. direct match by `targetId`
2. rename table lookup
3. semantic path match
4. text / role signature match
5. DOM selector fallback
6. region overlap fallback
7. mark orphaned

## Why this order

It prefers semantic stability over visual coincidence.

A matching `node:submit` is far more trustworthy than a rectangle that happens to overlap a nearby button.

## Rename table

The parser or formatter can optionally emit rename hints:

```json
{
  "fromTargetId": "node:primary-cta",
  "toTargetId": "node:submit",
  "reason": "id-normalization"
}
```

This is the safest non-direct relink.

## Semantic path

A target may carry a semantic path such as:

```json
["screen:login", "node:auth-card", "node:actions", "node:submit"]
```

If the id changed but the path shape stayed stable, the runtime may relink with medium confidence.

## Signature matching

Use only as a fallback.

Useful fields:

- node kind
- role
- label or text signature
- parent target id

Do not use text alone when multiple nodes share similar labels.

## Region overlap

Only for `scope=region`, or as a last-resort hint.

If a semantic target disappeared but a region still overlaps a surviving element, keep the thread open and flag the relink as low confidence.

## Confidence policy

- `high` — direct match or rename
- `medium` — semantic path
- `low` — signature or region
- `none` — orphaned

Low-confidence relinks should be surfaced in the review UI and the terminal.

## Orphan handling

When relinking fails:

- preserve the thread
- set `orphaned=true`
- store the last known target and rect
- show it in the optional thread panel
- let the reviewer retarget manually

## Pseudocode

```text
resolve(thread, sourceMap):
  if sourceMap has thread.targetId:
    return matched(high)

  if rename table maps old -> new:
    return matched(high)

  if semantic path matches one candidate:
    return matched(medium)

  if signature match yields one plausible candidate:
    return matched(low)

  if region overlap yields one candidate:
    return matched(low)

  return orphaned
```
