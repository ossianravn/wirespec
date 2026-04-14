# Review overlay interactions

## Product posture

The overlay exists to support one job:

> review the current wireframe variant and leave precise feedback quickly

It should not read like a separate collaboration product.

## Surface layout

### Base layout

- slim top review bar
- dominant preview stage
- inline pins and hover outlines
- local thread popover
- optional thread drawer only when opened

### Why this works

This keeps the page being reviewed as the primary object.
It avoids the common mistake of turning review into a dashboard shell with side rails and metadata chrome.

## Top review bar

Keep only the controls that help the current review task:

- current screen label
- breakpoint selector
- state selector
- comment-mode toggle
- filter toggle: open / all / mine
- copy review link

Do not add:

- analytics counts
- activity feeds
- global navigation
- badge strips

## Targeting behavior

### Page-level feedback

Click the page background or choose the screen title in the review bar.

Stored target:

```json
{ "scope": "screen", "targetId": "screen:login" }
```

### Section-level feedback

Hover highlights meaningful containers.
Click attaches to the nearest eligible section target.

Examples:

- `node:auth-card`
- `node:results-panel`
- `node:reply-form`

### Element-level feedback

Controls and leaf elements target directly.

Examples:

- `node:submit`
- `node:password`
- `node:state-select`

### Prose / acceptance feedback

In docs view, the reviewer can target:

- `prose:intent`
- `acceptance:login-01`

### Region fallback

Shift-drag creates a region annotation.
Store the normalized rectangle and nearest semantic anchor.

## Thread creation flow

1. reviewer enters comment mode
2. reviewer clicks a target
3. popover opens near that target
4. body is required
5. title is optional
6. severity defaults to `should`
7. motivation defaults to `change-request`
8. save writes to the review sidecar

## Thread inspection flow

Clicking a pin or a thread card opens local detail:

- messages
- status
- suggested ops
- open in editor
- send to agent
- resolve or wontfix

## Narrow-width behavior

On smaller viewports:

- keep the preview full-width
- thread drawer becomes a bottom sheet when opened
- do not reserve permanent side space for review chrome

## Failure states

### Preview stale
Show a slim warning above the preview.
Do not replace the page with a full empty shell.

### Orphaned thread
Show it in the drawer with a clear label and a retarget action.

### No comments
Do not show a giant empty state card.
A single helper line in the review bar or thread popover is enough.

## Keyboard suggestions

- `C` toggle comment mode
- `Esc` close popover or exit comment mode
- `[` previous open thread
- `]` next open thread
- `O` open source for selected thread
- `R` resolve selected thread
