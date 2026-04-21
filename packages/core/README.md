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
node packages/core/bin/wirespec-ide-core.js lint ./packages/runtime/fixtures/login.wirespec.md
node packages/core/bin/wirespec-ide-core.js format ./packages/runtime/fixtures/login.wirespec.md
node packages/core/bin/wirespec-ide-core.js summary --workspace ./demo-workspace
node packages/core/bin/wirespec-ide-core.js open-next --workspace ./demo-workspace
node packages/core/bin/wirespec-ide-core.js resolve-on-save --workspace ./demo-workspace --saved-file ./demo-workspace/src/features/auth/LoginCard.tsx --ranges 21-23
```

IDE-facing commands (`summary`, `task-change`, `open-latest`, `open-next`, `resolve-on-save`) use a stable JSON envelope:

```json
{
  "ok": true,
  "command": "summary",
  "summary": {
    "taskFiles": 1,
    "documents": ["login"],
    "openTasks": 2,
    "latestDocumentId": "login",
    "latestTaskFile": "/abs/path/.wirespec/reviews/login.agent-tasks.json"
  },
  "latestTaskFile": "/abs/path/.wirespec/reviews/login.agent-tasks.json",
  "latestDocumentId": "login",
  "nextTask": {
    "threadId": "ann-login-submit-fold"
  }
}
```

On command failure, those same commands exit non-zero and emit JSON with `ok: false` and `error.message` so IDE clients can surface a stable error payload.
