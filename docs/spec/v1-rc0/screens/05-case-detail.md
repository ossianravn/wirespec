---
schema: wirespec/1.0-rc0
id: case-detail
route: /cases/3482
component: cases/CaseDetailScreen
canonical: true
patterns:
  - case-detail
  - breadcrumbs
  - split-layout
  - confirmation-dialog
---

# Case detail

## Intent
Help an operations specialist understand the case quickly, see the timeline, and take the next responsible action without scanning unrelated chrome.

```wirespec v=1 kind=base
screen id=case-detail route="/cases/3482" title="Case 3482"
  header id=case-header
    breadcrumbs id=case-breadcrumbs
      breadcrumb-item id=crumb-cases label="Cases"
      breadcrumb-item id=crumb-case-3482 label="Case 3482"
    row id=case-header-row justify=between align=center
      column id=case-title-block
        heading id=case-title level=1 text="Case 3482 — Missing customs invoice"
        helper id=case-subtitle text="Opened by Logistics on 11 Apr"
      actions id=case-actions
        button id=reassign-case variant=secondary action=reassign-case label="Reassign"
        button id=close-case variant=primary action=close-case label="Close case"
  main id=case-main padding=lg
    row id=case-layout align=start gap=lg
      section id=case-body width=fill
        panel id=case-summary
          heading id=summary-title level=2 text="Summary"
          text id=summary-copy text="Shipment 7714 is held at customs because the invoice PDF was not attached to the export packet."
        section id=timeline-section
          heading id=timeline-title level=2 text="Timeline"
          list id=timeline-list
            list-item id=timeline-1
              text id=timeline-1-copy text="09:08 — Shipment flagged by customs broker."
            list-item id=timeline-2
              text id=timeline-2-copy text="09:21 — Warehouse confirmed the parcel is still on site."
            list-item id=timeline-3
              text id=timeline-3-copy text="09:37 — Finance uploaded the corrected invoice."
      aside id=case-sidebar width=md
        panel id=owner-panel
          heading id=owner-title level=2 text="Ownership"
          text id=owner-copy text="Assigned to Eva Madsen"
        panel id=next-step-panel
          heading id=next-step-title level=2 text="Next step"
          text id=next-step-copy text="Send the corrected invoice to the customs broker and confirm release."
```

```wirespec v=1 kind=state name=confirm-close
insert position=inside-end ref=case-detail
  dialog id=close-case-dialog title="Close case?"
    heading id=close-case-dialog-title level=2 text="Close case 3482?"
    text id=close-case-dialog-copy text="Only close the case if customs release has been confirmed."
    actions id=close-case-dialog-actions
      button id=cancel-close variant=secondary action=cancel-close label="Cancel"
      button id=confirm-close variant=primary action=confirm-close label="Close case"
```

```wirespec v=1 kind=state name=resolved
patch target=case-subtitle text="Resolved on 11 Apr"
patch target=close-case label="Closed" disabled=true
patch target=next-step-copy text="Case closed after customs release confirmation."
```

```wirespec v=1 kind=breakpoint name=mobile max=767
patch target=case-layout direction=column
patch target=case-main padding=md
```

## Acceptance
- The case summary and next step are discoverable within a quick scan.
- Timeline items remain readable on mobile without a separate drill-down.
- Confirmation is required before closing the case.
