# WireSpec Studio Core

`studio-core` is the framework-agnostic editing engine for the future WireSpec Studio.

This package does not render UI and does not depend on the browser DOM. It owns:

- semantic AST edit commands
- undo / redo history
- semantic insert and move validation
- optional formatter and source-map adapter hooks

The goal is to keep Studio edits semantic and formatter-stable before any drag-and-drop or visual editor surface is introduced.
