# VS Code / JetBrains parity map

| Concern | VS Code companion | JetBrains companion | Shared core command |
|---|---|---|---|
| review summary | status bar item | status bar widget | `summary` |
| task file changed | `FileSystemWatcher` | `BulkFileListener` on VFS changes | `task-change` |
| open latest task file | command | action | `open-latest` |
| open next task target | command | action | `open-next` |
| changed line tracking | `onDidChangeTextDocument` | `DocumentListener` | local only |
| save-driven resolution | `onDidSaveTextDocument` | `FileDocumentManagerListener` | `resolve-on-save` |
| audit log writes | none | none | core only |

The IDEs differ in event APIs, but the review behavior is meant to stay identical because the core owns all mutation and audit decisions.
