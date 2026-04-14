# Browser ↔ IDE ↔ agent protocol

## Design principle

The browser should feel visual.
The terminal and editor should feel exact.
Both should talk through small, predictable envelopes.

## Event naming

Use a stable namespace:

- `wirespec.review.thread.created`
- `wirespec.review.thread.messageAdded`
- `wirespec.review.thread.statusChanged`
- `wirespec.review.thread.retargeted`
- `wirespec.review.editor.openRequested`
- `wirespec.review.agent.exportRequested`
- `wirespec.review.preview.stale`

## Event envelope

```json
{
  "version": "0.1",
  "type": "wirespec.review.thread.created",
  "occurredAt": "2026-04-11T17:00:00Z",
  "actor": { "id": "user-1", "kind": "human" },
  "screenId": "login",
  "payload": {}
}
```

## Thread created

The browser emits this after a reviewer confirms a new comment.

Required payload:

- `thread`
- `resolution.target`
- `preview.variantKey`
- `preview.rect` when `scope=region`

## Open in editor

When the reviewer clicks **Open source**, the browser does not need to know how the editor is launched.
It emits an intent.

Example payload:

```json
{
  "targetId": "node:submit",
  "preferredEditor": "vscode",
  "fallbackCommand": "code -g screens/01-login.md:22:9"
}
```

A local bridge can choose:

- `vscode://file/...`
- `code -g ...`
- another editor adapter

## Agent export

When the reviewer or author requests an agent handoff, the runtime exports a normalized task list instead of a freeform prompt first.

That keeps the handoff auditable.

The CLI or IDE can then format:

- a terminal summary
- a structured prompt
- a task list in JSON

## Preview staleness

When the preview is behind the source revision, the browser should emit:

```json
{
  "type": "wirespec.review.preview.stale",
  "payload": {
    "documentId": "login",
    "previewHash": "sha256:old",
    "sourceHash": "sha256:new"
  }
}
```

Recommended behavior:

- show a slim warning bar
- allow refresh
- block new comments by default
- allow override only as an explicit draft mode

## Storage recommendation

- append events if you want an audit trail
- also persist the latest normalized review sidecar for fast reads

That gives you both:

- durable history
- fast current-state access
