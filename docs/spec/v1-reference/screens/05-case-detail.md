---
schema: wirespec/1.0-draft
id: case-detail
route: /cases/4821
component: support/CaseDetailScreen
tokens: ./tokens.json
library: ./ui-map.yml
---

# Case detail

## Intent
Help a support agent understand a case quickly, review the timeline, and reply without losing context.

```wirespec v=1 kind=base
screen id=case-detail route="/cases/4821" title="Case 4821"
  header id=case-header
    breadcrumbs id=case-breadcrumbs
      breadcrumb-item id=bc-cases label="Cases"
      breadcrumb-item id=bc-current label="4821"
    row id=case-header-row justify=between align=start
      column id=case-title-block
        heading id=case-title level=1 text="API timeouts during invoice sync"
        text id=case-meta tone=subtle text="Opened by Priya Raman · 2 hours ago"
      actions id=case-header-actions
        button id=assign variant=secondary action=assign-case label="Assign"
        button id=reply-top variant=primary action=focus-reply label="Reply"
  main id=case-layout max=xl
    grid id=case-grid cols=12 gap=lg
      section id=case-primary span=8
        tabs id=case-tabs current=timeline
          button id=tab-summary variant=quiet action=switch-tab label="Summary"
          button id=tab-timeline variant=quiet selected=true action=switch-tab label="Timeline"
          button id=tab-files variant=quiet action=switch-tab label="Files"
        tab-panel id=timeline-panel
          list id=timeline-list variant=timeline
            list-item id=timeline-1
              heading id=timeline-1-title level=2 text="Customer reported repeated 504 responses"
              text id=timeline-1-meta tone=subtle text="2 hours ago"
            list-item id=timeline-2
              heading id=timeline-2-title level=2 text="Ops attached gateway logs"
              text id=timeline-2-meta tone=subtle text="36 minutes ago"
        form id=reply-form submit=send-reply
          textarea id=reply-body name=replyBody label="Reply" rows=8 required=true
          actions id=reply-actions justify=between
            button id=save-draft variant=secondary action=save-draft label="Save draft"
            button id=send-reply variant=primary action=submit label="Send reply"
      aside id=case-sidebar span=4
        card id=case-status
          heading id=case-status-title level=2 text="Case details"
          text id=case-priority text="Priority: High"
          text id=case-owner text="Owner: Unassigned"
          text id=case-channel text="Channel: Email"
```

```wirespec v=1 kind=state name=reply-error
insert position=before ref=reply-form
  alert id=reply-error tone=critical text="Reply could not be sent. Your draft is still saved."
```

```wirespec v=1 kind=state name=reply-sending
patch target=send-reply label="Sending…" busy=true disabled=true
patch target=reply-form disabled=true
```

```wirespec v=1 kind=breakpoint name=mobile max=767
patch target=case-grid cols=1
patch target=case-primary span=1
patch target=case-sidebar span=1
patch target=case-header-row justify=start
```

## Acceptance
- The case title, status, and reply action are visible on first scan.
- Timeline and reply composer stay in the primary reading column.
- Sidebar metadata moves below the work area on mobile instead of becoming a detached rail.
