# Continue from here

Use this order when resuming work:

1. **Language**: update `docs/spec/v1-rc0/`
2. **Compiler/runtime**: update `packages/runtime/`
3. **Review persistence**: update `packages/bridge/`
4. **IDE workflow**: update `packages/core/`, then the thin editor companions
5. **Design-quality guardrails**: keep `references/proper-ui/` in view when changing rendered UI or review surfaces

Suggested first cleanup tasks:

- move shared schemas into a common package
- unify sidecar and task types across runtime, bridge, and IDE core
- add one end-to-end script using the demo workspace
- decide whether `packages/runtime` should absorb the historical parser adapter or keep the older slice archived only
