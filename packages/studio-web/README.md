# WireSpec Studio Web

`studio-web` is the internal browser prototype for the future WireSpec Studio.

It sits on top of `studio-core` and the runtime formatter/renderer. The package is intentionally private while the editor surface is still evolving.

Current scope:

- template-first browser workspace seeded from the canonical reference screens
- semantic palette and tree editing backed by `studio-core` commands
- state and breakpoint editing that writes variant operations instead of duplicated trees
- low-fidelity preview, lint warnings, and canonical WireSpec source view

This package does not replace the browser review runtime yet. Review-sidecar and bridge integration remain a follow-up tranche.
