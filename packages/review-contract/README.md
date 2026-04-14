# WireSpec Review Contract

Shared review data constants and schemas used by runtime, bridge, and IDE core.

This package is intentionally small. It centralizes values that must not drift across packages:

- annotation sidecar schema version
- agent task export version
- review statuses and active-status aliases
- review severities and severity ranking
- review motivations
- annotation anchor type names
- the canonical annotation sidecar JSON Schema

The package is CommonJS so the IDE core can `require()` it directly. ESM packages should import the default export and destructure the values they need.
