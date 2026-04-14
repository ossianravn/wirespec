# Browser <-> IDE <-> agent loop

## Goal

A reviewer comments in the browser while the human and agent work in a terminal or IDE.
The comment must map back to the exact source and survive iteration.

## Recommended loop

### 1. Compile the screen
The WireSpec compiler produces:

- rendered preview HTML / SVG
- resolved ASTs for selected variants
- source map from node ids to source spans

### 2. Instrument the preview
The renderer emits stable DOM hooks such as `data-ws-id`.

### 3. Save threads in sidecar storage
When a reviewer comments, write to:

- `screen.annotations.json` as canonical storage
- optional `screen.review.md` projection for git readability

### 4. Open source from the browser
Given a target node id, the overlay resolves a source span and opens the source file.

Recommended deep-link outputs:

- `vscode://file/...:line:column`
- fallback terminal command: `code -g path:line:column`

### 5. Let the agent consume structured review tasks
The agent reads:

- base screen AST
- selected open annotation threads
- current variant context
- acceptance criteria

Then it proposes a minimal patch set.

### 6. Re-render and compare
After the patch:

- rebuild preview
- keep thread ids stable
- show which open threads were probably affected
- require human resolution

## File set recommendation

For one screen:

- `01-login.md` — source spec
- `01-login.ast.json` — parsed AST
- `01-login.annotations.json` — canonical review data
- `01-login.review.md` — optional projection
- `01-login.sourcemap.json` — id -> file span map

## Source map shape

A minimal source map can be as simple as:

```json
{
  "documentId": "login",
  "file": "screens/01-login.md",
  "nodes": {
    "submit": { "lineStart": 18, "lineEnd": 18, "columnStart": 9, "columnEnd": 73 },
    "primary-actions": { "lineStart": 17, "lineEnd": 19, "columnStart": 7, "columnEnd": 73 }
  }
}
```

## Why this matters for agents

Without source mapping, the browser knows what the user clicked but the editor and agent do not.
With source mapping, a review thread becomes a precise work item.

## Failure handling

### When a node id is renamed
- preserve a rename map when possible
- otherwise try selector and source-span fallback
- if still unresolved, mark the thread orphaned

### When a variant disappears
- keep the thread
- mark the missing variant in the review UI
- let the human decide whether the comment still applies

### When the preview and source are out of sync
- show a stale-preview warning
- disable new comments until the preview is rebuilt or explicitly allow draft comments
