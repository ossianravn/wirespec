# Agent authoring guide

WireSpec is intended to be easy for coding agents to modify without drifting away from the agreed UI.

This guide defines the editing habits that produce stable diffs.

## Primary rule

Make the **smallest coherent change** that moves the UI spec toward the user's task.

Do not restyle the whole screen when the task only needs a new field, state, or action.

## Authoring contract for agents

1. Preserve existing ids whenever the semantic identity of a node stays the same.
2. Prefer editing the base tree only for structural changes to the default screen.
3. Prefer variant operations for loading, error, empty, selected, and breakpoint-specific changes.
4. Use the frozen core vocabulary before inventing `x-...` nodes.
5. Keep prose outside the `wirespec` block.
6. Keep one node or one operation per line.
7. Never embed raw CSS, utility classes, or pixel coordinates.
8. Do not duplicate large subtrees just to change one label or visibility flag.
9. When reusing an existing screen as reference, match its structure before trying to improve it.
10. Cover states and breakpoints, not only the default view.

## Good editing patterns

### Add a field to an existing form

Edit the base block and insert one new field at the correct location. Keep sibling ids unchanged.

### Add an error state

Add a state variant that reveals an existing alert node or patches an input with `invalid=true`.

### Add a mobile treatment

Add a breakpoint variant that patches direction, order, width, and visibility. Avoid rewriting the whole screen.

### Add a transient confirmation

Use `insert` to add a `dialog` in a `state=confirming` variant.

## Bad editing patterns

- replacing the entire base screen because one control changed
- renaming ids casually
- translating component-library names directly into custom node kinds
- using prose sentences inside the structural block
- adding decorative rails, KPI strips, or fake status panels that are not part of the task
- representing responsive changes by cloning the whole screen twice

## When to use `x-...` extensions

Use an extension only if the core vocabulary would mislead a renderer or future editor.

Prefer core:
- `field type=search`
- `button action=save-draft`
- `panel`
- `table`

Prefer extension:
- `x-code-editor`
- `x-payment-method`
- `x-canvas-annotation`

## Minimal agent checklist

Before editing, capture this internally:

- task: what the user must accomplish
- source of truth: which existing screen or style rules to preserve
- scope boundary: what should not change
- states: loading, error, empty, disabled, selected
- breakpoints: at minimum mobile and desktop
- primary action: what must stay obvious

## Recommended edit order

1. inspect frontmatter and prose intent
2. inspect the base tree
3. inspect existing variants
4. edit the smallest relevant area
5. ensure ids remain stable
6. verify states and breakpoints
7. run formatter

## Diff quality rule

A good WireSpec diff is one where a human reviewer can answer these questions in under a minute:

- what changed?
- why did it change?
- which states and breakpoints are affected?
- did the semantic identity of nodes stay stable?
