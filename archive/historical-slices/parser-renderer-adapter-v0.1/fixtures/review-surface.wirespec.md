---
schema: wirespec/1.0-draft
id: review-surface
route: /review/login
component: review/ReviewSurface
canonical: false
---

# Review surface

## Intent
Review one rendered wireframe variant and leave precise page, section, or element feedback without hiding the work under collaboration chrome.

```wirespec v=1 kind=base
screen id=review-surface route="/review/login" title="Review login"
  header id=review-header padding=sm
    toolbar id=review-toolbar gap=sm align=center justify=between
      row id=review-context gap=sm align=center
        heading id=review-title level=1 text="Review login"
        status id=variant-status text="error · mobile"
      actions id=review-actions gap=sm
        select id=screen-picker name=screen label="Screen"
        select id=variant-picker name=variant label="Variant"
        switch id=comment-mode name=comment-mode label="Comment mode"
        button id=open-threads variant=secondary action=open-threads label="Open threads"
        button id=copy-link variant=secondary action=copy-link label="Copy review link"
  main id=review-main direction=column gap=md padding=md
    section id=preview-stage width=fill
      panel id=preview-panel width=fill padding=sm
        helper id=preview-help text="Click the page background for page feedback. Click a highlighted node for section or element feedback."
        x-wireframe-preview id=preview-canvas source="screens/01-login.md" variant="error+mobile"
    drawer id=thread-drawer title="Threads" visible=false width=sm
      heading id=thread-title level=2 text="Open feedback"
      list id=thread-list
        list-item id=thread-1
          text id=thread-1-summary text="Submit button falls below the fold on short mobile heights."
      actions id=drawer-actions
        button id=export-to-agent variant=primary action=export-open label="Send open threads to agent"
```

```wirespec v=1 kind=state name=commenting
patch target=comment-mode checked=true
patch target=preview-help text="Comment mode is on. Hold Alt to target a parent section. Shift-drag for a region comment."
```

```wirespec v=1 kind=state name=drawer-open
patch target=thread-drawer visible=true
```

```wirespec v=1 kind=state name=stale-preview
insert position=before ref=preview-stage
  alert id=stale-warning tone=warning text="Preview is out of date. Refresh before leaving new feedback."
```

```wirespec v=1 kind=breakpoint name=mobile max=767
patch target=review-actions direction=column
patch target=thread-drawer width=fill
```

## Acceptance
- The preview stays visually primary in every state.
- Reviewers can leave page, section, or element feedback in one click after entering comment mode.
- The thread drawer stays optional and does not permanently reduce preview width.
- Stale preview is visible without replacing the page with a large empty shell.
