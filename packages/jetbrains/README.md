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

- the project contains the shared core or has `wirespec` installed in `node_modules`
- Node is available, or a custom executable path is configured in Settings | Tools | WireSpec
- the repo already contains `.wirespec/reviews/*.agent-tasks.json` sidecars/tasks

## Core resolution order

The companion resolves the shared core in this order:

1. `packages/core/bin/wirespec-ide-core.js` in the open WireSpec repo checkout
2. `node_modules/wirespec/packages/core/bin/wirespec-ide-core.js` in a consumer repo
3. the project-specific `Core script path` override in Settings | Tools | WireSpec
4. the fallback `Core command` from Settings | Tools | WireSpec, which defaults to `pnpm exec wirespec-ide-core`

Project settings also allow overriding the Node executable path when the IDE environment does not inherit the right `PATH`.

## Build setup

This module targets IntelliJ Platform `2025.3`, which JetBrains maps to branch `253` and Java `21`.

JetBrains' current IntelliJ Platform Gradle Plugin 2.x docs require Gradle `8.13+`, and JetBrains' Kotlin guidance requires Kotlin `2.x` for `2025.1+` targets. The build is pinned accordingly:

- Gradle wrapper task: `8.13`
- Kotlin plugins: `2.2.20`
- IntelliJ since-build: `253`

From `packages/jetbrains`, use a documented local Gradle install:

```bash
gradle buildPlugin
```

If you want a committed wrapper after that first bootstrap, generate it with:

```bash
gradle wrapper
```

This project does not yet commit `gradlew`; generate the wrapper after bootstrapping Gradle on a machine with Java available.

## Why no tool window

This follows the Proper UI guidance for restrained utility surfaces: open the real task or code file, keep the preview/editor primary, and avoid inventing a new dashboard shell.
