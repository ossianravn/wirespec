# Semantics and invariants for v1 rc0

This file defines how a valid WireSpec document behaves after parsing.

## 1. Compilation model

A WireSpec compiler should process documents in this order:

1. parse the host document as Markdown
2. extract frontmatter when present
3. collect prose sections such as `Intent`, `Acceptance`, and `Notes`
4. parse the single base `wirespec` block into a root tree
5. parse variant `wirespec` blocks into ordered operation lists
6. validate ids, required props, node structure, and operation targets
7. optionally resolve one or more selected variants into a derived tree

## 2. Id invariants

- ids are unique across the whole document, not merely within a subtree
- ids are compared case-sensitively
- patch operations may not change a node id
- later operations may target nodes inserted earlier in the same variant
- later operations may not target nodes that have already been removed in the same resolution pass

## 3. Visibility model

- all nodes are considered visible by default unless `visible=false`
- `show target=...` is semantic sugar for making the node visible
- `hide target=...` is semantic sugar for making the node not visible
- tools should preserve `show` and `hide` as operations in the AST because they express intent more clearly than a generic `patch`

## 4. Variant kinds

Supported kinds:

- `state`
- `breakpoint`
- `theme`
- `mode`

Recommended meaning:

- `state`: transient or workflow state such as loading, empty, error, selected, confirming
- `breakpoint`: width-based or form-factor variation
- `theme`: light, dark, high-contrast, brand mode
- `mode`: authoring / preview / readonly / print / compare

## 5. Variant precedence

When resolving more than one variant at once, apply them in the following order:

1. `mode`
2. `theme`
3. `breakpoint`
4. `state`

Within each kind, apply variants in source order.

Rationale:
state is usually the most specific and should be able to override the base responsive layout.

## 6. Operation semantics

### `patch`

`patch` updates properties on an existing node.

Rules:

- target must exist at the time the operation runs
- patching `id` is invalid
- patching unknown props is allowed, but linters may warn unless the prop uses `x-...`
- last write wins when multiple patches in the same resolution pass set the same prop

### `show`

`show` makes an existing node visible.

Rules:

- target must exist
- a shown node keeps its subtree intact
- `show` after `remove` is invalid

### `hide`

`hide` makes an existing node not visible.

Rules:

- target must exist
- hidden nodes remain addressable for later operations unless they are removed
- use `hide` when the node still belongs to the derived tree conceptually

### `remove`

`remove` deletes a node and its subtree from the derived tree.

Rules:

- target must exist
- descendants disappear with the removed node
- any later operation targeting the removed id or one of its descendants is invalid

### `insert`

`insert` adds a new subtree relative to an existing reference node.

Positions:

- `before`
- `after`
- `inside-start`
- `inside-end`

Rules:

- `ref` must exist at the time the operation runs
- inserted ids must not collide with existing ids
- inserted nodes immediately become targetable by later operations in the same variant or by later-applied variants

## 7. Conflict model

Conflicts are handled differently depending on the kind:

- duplicate ids: error
- unknown target / ref: error
- missing required prop: error
- unsupported child structure: warning by default, error in strict mode
- unknown non-prefixed prop: warning
- conflicting patches to the same prop: allowed, later patch wins
- redundant `show` on visible node or `hide` on hidden node: warning

## 8. Acceptance rules

Acceptance bullets in prose should compile into stable rule objects:

- `id`: generated from order unless explicitly provided by tooling
- `text`: bullet text
- `tags`: optional machine tags inferred or authored later
- `level`: optional, defaults to `must` for now when omitted by tooling

The AST should keep acceptance criteria outside the structural tree. They are not UI nodes.

## 9. Prose handling

v1 gives special meaning only to these prose sections:

- `Intent`
- `Acceptance`
- `Notes`

Other prose sections should be preserved as markdown blocks or ignored by simple compilers, but they should not mutate the structural tree.

## 10. Accessibility and UX validation hooks

WireSpec itself is not a full accessibility standard, but v1 should expose enough semantics for lints such as:

- interactive controls have accessible labels
- tabs pair correctly with tab panels
- dialogs and drawers expose clear titles and actions
- loading, empty, error, and disabled states are present when relevant
- primary action remains obvious across breakpoints
- hidden decorative copy does not replace actual labels or instructions

## 11. Resolver pseudocode

```text
resolved = clone(baseTree)

selectedVariants = sortByPrecedenceAndSourceOrder(selectedVariants)

for variant in selectedVariants:
  for op in variant.ops:
    execute(op, resolved, idIndex)

return resolved
```

Where `execute` enforces the target / ref checks and keeps the id index synchronized after `insert` and `remove`.

## 12. v1 authoring recommendation

Prefer these patterns:

- keep the base tree as the happy path
- use variants for state and breakpoint deltas
- prefer `hide` and `show` over duplicating whole sections
- prefer `patch` over remove-and-reinsert when the node identity is the same
- use `insert` only for genuinely new transient subtrees such as dialogs, drawers, or mobile-only alternates
