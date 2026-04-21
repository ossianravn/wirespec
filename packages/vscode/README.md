# VS Code thin companion

This wrapper keeps the UI intentionally small:

- one status bar item
- command palette actions
- auto-open when a task file changes
- save-driven resolution from changed line ranges

All review mutation and audit logic is delegated to `packages/core/bin/wirespec-ide-core.js`.

Core resolution order:

1. bundled extension asset if present
2. `packages/core/bin/wirespec-ide-core.js` in the open WireSpec repo
3. `node_modules/wirespec/packages/core/bin/wirespec-ide-core.js` in a consumer repo
4. configured absolute `wirespec.ide.corePath`
5. fallback command tokens from `wirespec.ide.coreCommand` (default `pnpm exec wirespec-ide-core`)
