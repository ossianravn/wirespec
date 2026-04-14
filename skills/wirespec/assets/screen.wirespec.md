---
schema: wirespec/1.0-rc0
id: screen-id
route: /path
component: src/path/Component.tsx
---

# Screen name

## Intent
Describe the user task and desired outcome in one or two sentences.

```wirespec v=1 kind=base
screen id=screen-id route="/path" title="Screen name"
  main id=content width=fill padding=lg
    section id=primary-flow
      heading id=title level=1 text="Screen name"
      text id=intro text="Short task-facing guidance."
      actions id=primary-actions
        button id=primary-action variant=primary action=submit label="Continue"
```

```wirespec v=1 kind=state name=loading
patch target=primary-action label="Working..." busy=true disabled=true
```

```wirespec v=1 kind=breakpoint name=mobile max=599
patch target=primary-actions direction=column width=fill
```

## Acceptance
- Primary action remains obvious on desktop and mobile.
- Keyboard-only users can complete the task.
- Loading and error states do not remove essential context.
