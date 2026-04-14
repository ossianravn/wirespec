# JetBrains thin companion

This plugin skeleton is intentionally small:

- project service
- VFS listener for `.agent-tasks.json` changes
- document listener for changed lines
- save listener that calls the shared core
- status bar widget
- a few actions available from Tools / Find Action

The plugin delegates all review mutation and audit writes to the shared Node core under `packages/core/bin/wirespec-ide-core.js`.

## Runtime assumptions

- the project contains the shared core
- `node` is available, or a custom executable path is configured later
- the repo already contains `.wirespec/reviews/*.agent-tasks.json` sidecars/tasks

## Why no tool window

This follows the Proper UI guidance for restrained utility surfaces: open the real task or code file, keep the preview/editor primary, and avoid inventing a new dashboard shell.
