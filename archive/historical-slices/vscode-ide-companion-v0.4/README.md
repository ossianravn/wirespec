# WireSpec VS Code IDE companion v0.4

This pack adds a small VS Code companion for the WireSpec browser review flow.

## What it does
- Watches `.wirespec/reviews/*.agent-tasks.json` and matching annotation sidecars
- Auto-opens changed task files in VS Code
- Keeps a small status bar summary of open review work
- Lets you jump to the next most severe open target
- Tracks edited line ranges and can mark matching threads resolved after the target file is saved
- Writes an audit trail to `.wirespec/reviews/ide.events.ndjson`

## Why this shape
The UI stays intentionally small: one status bar entry, commands, output logging, and file watching. There is no dashboard shell, no permanent side panel, and no filler chrome.

## Commands
- `WireSpec: Open latest task file`
- `WireSpec: Open next open task target`
- `WireSpec: Resolve touched threads for active file`
- `WireSpec: Refresh review files`
- `WireSpec: Show review summary`

## Settings
- `wirespec.ide.autoOpenTaskFiles` — default `true`
- `wirespec.ide.autoRevealFirstTarget` — default `false`
- `wirespec.ide.autoResolveOnSave` — default `true`
- `wirespec.ide.keepResolvedTasksInTaskFile` — default `false`
- `wirespec.ide.statusBarAlignment` — `left` or `right`

## Expected repo shape
Produced by the earlier bridge/runtime packs:
- `.wirespec/reviews/<documentId>.annotations.json`
- `.wirespec/reviews/<documentId>.agent-tasks.json`

## Quick install
Open this folder in VS Code and run the extension with `F5`, or copy the extension files into a normal VS Code extension scaffold.

## Verification
- `node --test`
- `node ./src/simulate.js`

Both were run for this pack.

## Example outputs
- `outputs/ide-companion.transcript.txt`
- `outputs/login.annotations.after.json`
- `outputs/login.agent-tasks.after.json`
- `outputs/ide.events.ndjson`
