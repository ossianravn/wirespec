# Shared core

This package is the single source of truth for:

- discovering `.wirespec/reviews/*.agent-tasks.json`
- picking the next open task
- resolving threads on save from changed line ranges
- writing sidecars and task files
- appending IDE audit events
- returning JSON for IDE shells

CLI examples:

```bash
node packages/core/bin/wirespec-ide-core.js summary --workspace ./demo-workspace
node packages/core/bin/wirespec-ide-core.js open-next --workspace ./demo-workspace
node packages/core/bin/wirespec-ide-core.js resolve-on-save --workspace ./demo-workspace --saved-file ./demo-workspace/src/features/auth/LoginCard.tsx --ranges 21-23
```
