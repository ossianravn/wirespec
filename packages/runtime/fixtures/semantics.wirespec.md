---
schema: wirespec/1.0-rc0
id: semantics
route: /semantics
component: demo/SemanticsScreen
canonical: false
---

# Semantics

## Intent
Exercise runtime rendering semantics for controls, collections, and navigation without relying on a large canonical screen.

```wirespec v=1 kind=base
screen id=semantics route="/semantics" title="Runtime semantics"
  main id=semantics-main padding=lg
    card id=controls-card max=sm gap=sm padding=lg
      heading id=controls-title level=1 text="Assign case"
      dialog id=assign-dialog
        heading id=assign-dialog-title level=2 text="Assign case"
        form id=assign-form submit=assign-case
          textarea id=notes name=notes label="Notes" placeholder="Add details" required=true rows=4
          select id=status name=status label="Status" options=["Open","In progress","Resolved"]
          combobox id=assignee name=assignee label="Assignee" placeholder="Choose assignee" options=["Mina","Oskar","Sofia"]
          radio-group id=priority name=priority label="Priority"
            radio id=priority-normal value=normal label="Normal"
            radio id=priority-urgent value=urgent label="Urgent"
          actions id=form-actions
            button id=assign-submit variant=primary action=submit label="Assign"
            button id=assign-cancel action=cancel label="Cancel"
    breadcrumbs id=trail
      breadcrumb-item id=trail-home label="Home" href="/"
      breadcrumb-item id=trail-current label="Runtime semantics" current=true
    tabs id=semantics-tabs
      tab id=overview-tab label="Overview" controls=overview-panel selected=true
      tab id=details-tab label="Details" controls=details-panel
    tab-panel id=overview-panel
      text text="Overview copy"
      text text="Another paragraph"
      empty-state id=no-details title="No details yet" description="Add the first note to continue." visible=false
    tab-panel id=details-panel
      stepper id=delivery-steps
        step id=step-requested label="Requested" current=true
        step id=step-assigned label="Assigned"
      table id=assignment-table
        table-header id=assignment-table-header
          table-row id=assignment-head-row
            table-cell id=head-person text="Person"
            table-cell id=head-state text="State"
        table-body id=assignment-table-body
          table-row id=assignment-row
            table-cell id=assignment-person
              avatar id=person-avatar label="Mina"
            table-cell id=assignment-state
              badge id=assignment-state-badge tone=info text="Open"
      pagination id=assignment-pagination current=1 count=3
      icon id=info-icon label="Info"
```

## Acceptance
- Runtime semantics stay low-fidelity while preserving meaningful HTML structure.
