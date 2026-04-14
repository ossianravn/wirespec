# VS Code thin companion

This wrapper keeps the UI intentionally small:

- one status bar item
- command palette actions
- auto-open when a task file changes
- save-driven resolution from changed line ranges

All review mutation and audit logic is delegated to `packages/core/bin/wirespec-ide-core.js`.
