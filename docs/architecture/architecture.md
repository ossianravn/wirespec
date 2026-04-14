# Cross-IDE architecture

## Goal

Keep review behavior identical across IDEs while keeping each IDE surface intentionally small.

## Split of responsibilities

### Shared core

The shared core owns:

- review file discovery
- loading and writing sidecars/task files
- next-task selection
- changed-range normalization
- save-driven thread resolution
- audit event formatting and file writes
- JSON command contract for IDE callers

### Thin IDE wrappers

Each IDE wrapper owns only:

- local file-watch events
- local save/document-change events
- opening files and caret navigation
- tiny status surfaces
- passing workspace path, file path, and changed ranges into the core

## Why this split

Watcher semantics differ between editors, but the meaning of those events should not. The thin wrapper turns “task file changed” or “file saved at these lines” into the same core command in both editors.

## Core contract

Commands:

- `summary`
- `task-change`
- `open-latest`
- `open-next`
- `resolve-on-save`

All commands return JSON so both companions can stay dumb.

## Minimal companion UI

To stay aligned with Proper UI:

- no review dashboard
- no permanent side panel
- no decorative collaboration chrome
- one status surface
- command palette / action menu entrypoints
- open the real file instead of copying data into a custom list UI
