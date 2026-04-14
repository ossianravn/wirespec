# Review mode UI concept

## Design principle

Review mode should feel like a **calm overlay on the actual page**.

It should not become a second dashboard.

That means:

- no permanent analytics rail
- no decorative inspector shell
- no floating control room chrome
- no status-badge spam
- no fake collaboration theater

## Core surfaces

### 1. Review toolbar
A narrow toolbar at the top of the preview.

Contents:

- screen title
- variant selector
- filter: `open`, `all`, `mine`
- toggle: `comment mode`
- action: `copy review link`

The toolbar exists only in review mode.

### 2. Inline pins
When comment mode is on:

- hover highlights the nearest targetable node
- click creates a pin on that node
- existing pins show small counts
- pins use severity subtly, not loudly

### 3. Thread popover
Selecting a pin opens a small local popover near the target.

Use it for:

- reading the thread
- replying
- changing status
- sending to agent

### 4. Optional thread panel
Only when the user explicitly opens it.

Use it for:

- filtering many comments
- jumping between threads
- seeing orphaned comments

Do not show a permanent side rail by default.

## Targeting behavior

### Default behavior
- click an element -> attach to nearest `data-ws-id`
- click empty canvas -> create screen-level comment
- click prose sections in docs view -> attach to prose target

### Advanced behavior
- hold modifier key -> choose parent section instead of leaf node
- select active variant before commenting
- optionally draw a small region box when the issue is spacing between elements

## Browser composition

The preview renderer should emit stable hooks:

- `data-ws-screen`
- `data-ws-id`
- `data-ws-kind`
- `data-ws-parent`

That gives the overlay enough information to map a click to a semantic target.

## Good defaults for teams using agents

### A. Every new thread asks one small question
- target already selected
- title optional
- body required
- severity defaults to `should`
- motivation defaults to `change-request`

### B. Structured tags are opt-in
Advanced tags such as taxonomy ids should be suggested, not required.

### C. Resolution is explicit
Do not auto-resolve just because a file changed.

### D. Agent handoff is one click
Each thread should have a direct action like:

- `Generate patch proposal`
- `Summarize open feedback for this screen`
- `Open source in editor`

## Example interaction flow

1. Reviewer opens the login screen in `state=error` and `breakpoint=mobile`.
2. Reviewer clicks the submit button.
3. Popover opens with target already bound to `node=submit` and the active variant scope.
4. Reviewer writes: “Keep this above the fold on short mobile heights.”
5. Thread is saved to `login.annotations.json`.
6. Agent reads the sidecar, proposes a patch to `primary-actions` and spacing around the alert.
7. Human reviews the patch in the browser.
8. Human resolves the thread.

## Anti-pattern guardrails

Do not let review mode drift into these patterns:

- giant inspector panel with unrelated metadata
- nested cards inside cards for simple comments
- decorative avatars and activity feed fluff
- metrics about comments that compete with the UI being reviewed
- permanent rail that reduces useful preview area
